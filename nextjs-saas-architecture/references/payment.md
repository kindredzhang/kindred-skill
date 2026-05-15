# Payment Integration Reference (Stripe)

Concrete implementation of the Stripe payment flow: checkout API, order/credit models, and pricing types.

---

## Architecture Flow

```
Pricing block (UI)
  → POST /api/checkout
    → getUserUuid() (auth check)
    → insertOrder({ status: "created" })   ← Order created BEFORE Stripe
    → stripe.checkout.sessions.create()     ← Metadata: order_no, user_uuid, credits
    → Redirect to Stripe Checkout page
  → Stripe webhook (checkout.session.completed)
    → findOrderByOrderNo()
    → updateOrderStatus("paid", ...)
    → increaseCredits()                     ← Grant credits atomically
```

---

## Checkout API Route (`app/api/checkout/route.ts`)

```typescript
import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { Order } from "@/types/order";
import Stripe from "stripe";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    const {
      credits, currency, amount, interval,
      product_id, product_name, valid_months, cancel_url,
    } = await req.json();

    // --- Validation ---
    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }
    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    // --- Auth ---
    const user_uuid = await getUserUuid();
    if (!user_uuid) return respErr("no auth, please sign-in");

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) user_email = user.email;
    }
    if (!user_email) return respErr("invalid user");

    // --- Create Order (BEFORE Stripe) ---
    const order_no = getSnowId();
    const currentDate = new Date();
    const created_at = currentDate.toISOString();
    const expired_at = new Date(
      currentDate.getTime() +
      (valid_months * 30 * 24 * 60 * 60 * 1000) +
      (is_subscription ? 24 * 60 * 60 * 1000 : 0)  // 24h buffer for subscriptions
    ).toISOString();

    const order: Order = {
      order_no, created_at, user_uuid, user_email,
      amount, interval, expired_at,
      status: "created",
      credits, currency, product_id, product_name, valid_months,
    };
    await insertOrder(order);

    // --- Create Stripe Session ---
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");

    let options: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: product_name },
          unit_amount: amount,
          recurring: is_subscription ? { interval } : undefined,
        },
        quantity: 1,
      }],
      allow_promotion_codes: true,
      metadata: {
        order_no: order_no.toString(),
        user_email,
        credits: String(credits),
        user_uuid,
      },
      mode: is_subscription ? "subscription" : "payment",
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/pay-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || process.env.NEXT_PUBLIC_WEB_URL,
    };

    if (user_email) options.customer_email = user_email;

    if (is_subscription) {
      options.subscription_data = { metadata: options.metadata };
    }

    // CNY payment: WeChat Pay + Alipay + card
    if (currency === "cny") {
      options.payment_method_types = ["wechat_pay", "alipay", "card"];
      options.payment_method_options = {
        wechat_pay: { client: "web" },
        alipay: {},
      };
    }

    const session = await stripe.checkout.sessions.create(options);
    await updateOrderSession(order_no, session.id, JSON.stringify(options));

    return respData({
      public_key: process.env.STRIPE_PUBLIC_KEY,
      order_no,
      session_id: session.id,
    });
  } catch (e: any) {
    console.log("checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}
```

---

## Order Model (`models/order.ts`)

Pure data access layer for orders:

```typescript
import { Order } from "@/types/order";
import { getSupabaseClient } from "@/models/db";

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

export async function insertOrder(order: Order) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("orders").insert(order);
  if (error) throw error;
  return data;
}

export async function findOrderByOrderNo(order_no: string): Promise<Order | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders").select("*").eq("order_no", order_no).single();
  if (error) return undefined;
  return data;
}

export async function updateOrderStatus(
  order_no: string, status: string, paid_at: string,
  paid_email: string, paid_detail: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, paid_at, paid_detail, paid_email })
    .eq("order_no", order_no);
  if (error) throw error;
  return data;
}

export async function updateOrderSession(
  order_no: string, stripe_session_id: string, order_detail: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ stripe_session_id, order_detail })
    .eq("order_no", order_no);
  if (error) throw error;
  return data;
}
```

---

## Webhook Handler Pattern (`app/api/webhook/stripe/route.ts`)

```typescript
import { stripe } from "@/lib/stripe";
import { respData, respErr, respOk } from "@/lib/resp";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { increaseCredits } from "@/services/credit";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json(respErr("Invalid signature"), { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { order_no, user_uuid, credits } = session.metadata;

      // Idempotency check: skip if already processed
      const order = await findOrderByOrderNo(order_no);
      if (!order || order.status === "paid") return respOk();

      // Update order + grant credits
      await updateOrderStatus(order_no, "paid", new Date().toISOString(), user_email, "");
      await increaseCredits({
        user_uuid, trans_type: "order_pay",
        credits: parseInt(credits), order_no,
      });
      break;
    }
    case "invoice.paid": {
      // Subscription renewal - similar logic
      break;
    }
  }

  return Response.json(respOk());
}
```

---

## Credit Model & Service

### Model (`models/credit.ts`) — Pure data access:

```typescript
export async function insertCredit(credit: Credit) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("credits").insert(credit);
  if (error) throw error;
  return data;
}

export async function getUserValidCredits(user_uuid: string): Promise<Credit[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits").select("*")
    .eq("user_uuid", user_uuid)
    .gte("expired_at", now)
    .order("expired_at", { ascending: true });
  if (error) return undefined;
  return data;
}
```

### Service (`services/credit.ts`) — Business logic:

```typescript
export enum CreditsTransType {
  NewUser = "new_user",
  OrderPay = "order_pay",
  SystemAdd = "system_add",
}

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let result: UserCredits = { left_credits: 0, is_recharged: false, is_pro: false };

  const firstPaid = await getFirstPaidOrderByUserUuid(user_uuid);
  if (firstPaid) result.is_recharged = true;

  const credits = await getUserValidCredits(user_uuid);
  if (credits) {
    credits.forEach(v => { result.left_credits += v.credits; });
  }
  if (result.left_credits > 0) result.is_pro = true;

  return result;
}

export async function increaseCredits({
  user_uuid, trans_type, credits, expired_at, order_no,
}: {
  user_uuid: string; trans_type: string; credits: number;
  expired_at?: string; order_no?: string;
}) {
  const newCredit = {
    trans_no: getSnowId(), created_at: getIsoTimestr(),
    user_uuid, trans_type, credits,
    order_no: order_no || "", expired_at: expired_at || "",
  };
  await insertCredit(newCredit);
}

export async function updateCreditForOrder(order: Order) {
  const existing = await findCreditByOrderNo(order.order_no);
  if (existing) return; // Idempotent — already granted

  await increaseCredits({
    user_uuid: order.user_uuid,
    trans_type: CreditsTransType.OrderPay,
    credits: order.credits,
    expired_at: order.expired_at,
    order_no: order.order_no,
  });
}
```

---

## Pricing Types (`types/blocks/pricing.d.ts`)

```typescript
import { Button } from "@/types/blocks/base";

export interface PricingGroup {
  name?: string;
  title?: string;
  description?: string;
  label?: string;
}

export interface PricingItem {
  title?: string;
  description?: string;
  label?: string;
  price?: string;
  original_price?: string;
  currency?: string;
  unit?: string;
  features_title?: string;
  features?: string[];
  button?: Button;
  tip?: string;
  is_featured?: boolean;
  interval: "month" | "year" | "one-time";
  product_id: string;
  product_name?: string;
  amount: number;
  cn_amount?: number;
  credits?: number;
  valid_months?: number;
  group?: string;
}

export interface Pricing {
  disabled?: boolean;        // Toggle entire pricing section
  name?: string;
  title?: string;
  description?: string;
  items?: PricingItem[];
  groups?: PricingGroup[];
}
```

The `Disabled` flag follows the blocks system pattern — set to `true` to hide the entire pricing section without code changes.

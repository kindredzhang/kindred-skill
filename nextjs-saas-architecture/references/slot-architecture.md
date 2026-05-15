# Slot Architecture Reference (Data-Driven UI)

Full type definitions and component patterns for the data-driven slot system.

---

## Type Hierarchy

```
types/blocks/base.d.ts         ← Shared: Button, NavItem, Crumb, Toolbar, Tip
  types/blocks/form.d.ts       ← FormField, FormSubmit, Form
  types/blocks/table.d.ts      ← TableColumn, Table
    types/slots/base.d.ts      ← Slot (wraps base with title, crumb, toolbar, data)
      types/slots/form.d.ts    ← Form (Slot + fields + submit)
      types/slots/table.d.ts   ← Table (Slot + columns + empty_message)
```

## Base Types (`types/blocks/base.d.ts`)

Shared by all blocks and slots — buttons, navigation, breadcrumbs, toolbars:

```typescript
export type ButtonVariant = "secondary" | "link" | "default" | "destructive" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface Button {
  title?: string;
  icon?: string;       // Dynamic icon name, e.g. "RiAddLine"
  url?: string;
  target?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export interface NavItem {
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  image?: Image;
  url?: string;
  target?: string;
  is_active?: boolean;
  is_expand?: boolean;
  className?: string;
  children?: NavItem[];
}

export interface Crumb {
  items?: NavItem[];
}

export interface Toolbar {
  items?: Button[];
}

export interface Tip {
  title?: string;
  description?: string;
  icon?: string;
  type?: "info" | "warning" | "error";
}

export interface Brand {
  title?: string;
  description?: string;
  logo?: Image;
  url?: string;
}

export interface Nav {
  name?: string;
  title?: string;
  icon?: string;
  items?: NavItem[];
}
```

## Form Field Types (`types/blocks/form.d.ts`)

Defines the field schema that drives all form rendering:

```typescript
type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  message?: string;
  email?: boolean;
};

export interface FormField {
  name?: string;
  title?: string;
  type?:
    | "text"           // Standard text input
    | "textarea"       // Multi-line text
    | "number"         // Numeric input
    | "email"          // Email with validation
    | "password"       // Password field
    | "select"         // Dropdown (requires options)
    | "url"            // URL input
    | "editor"         // Rich content editor
    | "code_editor"    // Code editor
    | "richtext_editor" // Rich text editor
    | "markdown_editor"; // Markdown editor
  placeholder?: string;
  options?: { title: string; value: string }[];
  value?: string;
  tip?: string;
  attributes?: Record<string, any>;  // Passed directly to input element
  validation?: ValidationRule;        // Compiled into Zod schema
}

export interface FormSubmit {
  button?: Button;
  handler?: (
    data: FormData,
    passby?: any
  ) => Promise<{
    status: "success" | "error";
    message: string;
    redirect_url?: string;
  } | undefined | void>;
}

export interface Form {
  fields: FormField[];
  data?: any;
  submit?: FormSubmit;
}
```

## Table Column Types (`types/blocks/table.d.ts`)

```typescript
export interface TableColumn {
  name?: string;
  title?: string;
  type?: string;
  options?: any[];
  className?: string;
  callback?: (item: any) => any;   // Custom render function
}

export interface Table {
  columns: TableColumn[];
  data: any[];
}
```

## Slot Wrapper Types (`types/slots/`)

Slots extend base types with page-level UI elements (crumb, toolbar, loading, empty state):

```typescript
// types/slots/base.d.ts
import { Crumb, Toolbar, Tip } from "@/types/blocks/base";

export interface Slot {
  title?: string;
  description?: string;
  tip?: Tip;
  crumb?: Crumb;
  toolbar?: Toolbar;
  loading?: boolean;
  data?: any;
  passby?: any;
}

// types/slots/form.d.ts
import { FormField, FormSubmit } from "@/types/blocks/form";
import { Slot } from "@/types/slots/base";

export interface Form extends Slot {
  fields?: FormField[];
  submit?: FormSubmit;
}

// types/slots/table.d.ts
import { TableColumn } from "@/types/blocks/table";
import { Slot } from "@/types/slots/base";

export interface Table extends Slot {
  columns?: TableColumn[];
  empty_message?: string;
}
```

## Dashboard vs Console Slots

Both variants share the same type definitions but differ in the layout wrapper:

```
components/
├── dashboard/
│   └── slots/
│       ├── table/index.tsx     # Full page with SidebarInset
│       └── form/index.tsx      # Full page with SidebarInset
├── console/
│   └── slots/
│       ├── table/index.tsx     # Compact card layout
│       └── form/index.tsx      # Compact card layout
└── blocks/
    ├── table/index.tsx         # Shared table renderer (columns, data, empty state)
    └── form/index.tsx          # Shared form renderer (fields, validation, submit)
```

The block-level renderers (`components/blocks/table/`, `components/blocks/form/`) are framework-agnostic and can be reused anywhere. Slots add page-level chrome (header, breadcrumb, sidebar wrapper).

## Validation Example

Validation rules on form fields are dynamically compiled into Zod schemas:

```typescript
// fields -> Zod schema
const fields = [
  { name: "email", type: "email", validation: { required: true, email: true } },
  { name: "age", type: "number", validation: { required: true, min: 18, max: 120 } },
  { name: "bio", type: "textarea", validation: { max: 500 } },
];

// Internal: buildFieldSchema() maps FormField type + ValidationRule
// to the correct Zod primitive (z.string(), z.number(), etc.)
// and applies constraints (required → .min(1), email → .email(), etc.)
// generateFormSchema() compiles the array into a single Zod object schema
```

No manual Zod definitions per form — the config drives validation automatically.

## Full Page Example

**Table page** (`app/[locale]/(admin)/admin/coupons/page.tsx`):
```tsx
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getAllCoupons } from "@/models/coupon";

export default async function CouponsPage() {
  const coupons = await getAllCoupons();

  const table: TableSlotType = {
    title: "Coupons",
    toolbar: {
      items: [{ title: "Add Coupon", icon: "RiAddLine", url: "/admin/coupons/add" }],
    },
    columns: [
      { name: "code", title: "Code" },
      { name: "discount_percent", title: "Discount (%)",
        callback: (row) => `${row.discount_percent}%` },
      { name: "expires_at", title: "Expires At",
        callback: (row) => moment(row.expires_at).format("YYYY-MM-DD") },
    ],
    data: coupons,
    empty_message: "No coupons found",
  };

  return <TableSlot {...table} />;
}
```

**Form page** (`app/[locale]/(admin)/admin/coupons/add/page.tsx`):
```tsx
import FormSlot from "@/components/dashboard/slots/form";
import { Form as FormSlotType } from "@/types/slots/form";
import { insertCoupon } from "@/models/coupon";

export default async function AddCouponPage() {
  const form: FormSlotType = {
    title: "Add Coupon",
    fields: [
      { name: "code", title: "Coupon Code", type: "text",
        validation: { required: true } },
      { name: "discount_percent", title: "Discount Percent", type: "number",
        validation: { required: true, min: 1, max: 100 } },
      { name: "expires_at", title: "Expires At", type: "text",
        validation: { required: true } },
    ],
    submit: {
      button: { title: "Create Coupon" },
      handler: async (data: FormData) => {
        "use server";
        const code = data.get("code") as string;
        const discount_percent = parseInt(data.get("discount_percent") as string);
        const expires_at = data.get("expires_at") as string;

        await insertCoupon({ uuid: getUuid(), code, discount_percent, expires_at });
        return { status: "success", message: "Coupon created", redirect_url: "/admin/coupons" };
      },
    },
  };

  return <FormSlot {...form} />;
}
```

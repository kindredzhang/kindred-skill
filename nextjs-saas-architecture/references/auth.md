# Authentication Reference (NextAuth v5 + Dual Auth)

Concrete implementation patterns for Next.js SaaS authentication.

---

## NextAuth Configuration (`auth/config.ts`)

Providers are conditionally registered based on environment variables:

```typescript
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { saveUser } from "@/services/user";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";

let providers: Provider[] = [];

// Google One Tap Auth (conditional provider)
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",
      credentials: { credential: { type: "text" } },
      async authorize(credentials, req) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        const token = credentials!.credential;

        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
        );
        if (!response.ok) return null;

        const payload = await response.json();
        const { email, sub, given_name, family_name, picture: image } = payload;
        if (!email) return null;

        return {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };
      },
    })
  );
}

// Google OAuth (conditional provider)
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(GoogleProvider({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }));
}

// GitHub OAuth (conditional provider)
if (
  process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" &&
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
) {
  providers.push(GitHubProvider({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }));
}

export const authOptions: NextAuthConfig = {
  providers,
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async signIn({ user, account }) {
      return true; // Allow sign-in; return false to reject
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token?.user) session.user = token.user;
      return session;
    },
    async jwt({ token, user, account }) {
      if (user && user.email && account) {
        const dbUser = {
          uuid: getUuid(),
          email: user.email,
          nickname: user.name || "",
          avatar_url: user.image || "",
          signin_type: account.type,
          signin_provider: account.provider,
          signin_openid: account.providerAccountId,
          created_at: getIsoTimestr(),
          signin_ip: await getClientIp(),
        };
        const savedUser = await saveUser(dbUser);
        token.user = {
          uuid: savedUser.uuid,
          email: savedUser.email,
          nickname: savedUser.nickname,
          avatar_url: savedUser.avatar_url,
          created_at: savedUser.created_at,
        };
      }
      return token;
    },
  },
};
```

---

## Session Provider (`auth/session.tsx`)

Thin wrapper around NextAuth's `SessionProvider`:

```tsx
"use client";
import { SessionProvider } from "next-auth/react";

export function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

## Dual Auth: getUserUuid (`services/user.ts`)

Checks both API key header and session cookie:

```typescript
import { auth } from "@/auth";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";

export async function getUserUuid() {
  const token = await getBearerToken();

  if (token && token.startsWith("sk-")) {
    const user_uuid = await getUserUuidByApiKey(token);
    if (user_uuid) return user_uuid;
  }

  const session = await auth();
  if (session?.user?.uuid) return session.user.uuid;

  return "";
}

export async function getBearerToken() {
  const h = await headers();
  const authHeader = h.get("Authorization");
  if (!authHeader) return "";
  return authHeader.replace("Bearer ", "");
}
```

---

## saveUser — New User Handling (`services/user.ts`)

Creates user in DB if not exists, with side effects (new user credits):

```typescript
export async function saveUser(user: User) {
  const existUser = await findUserByEmail(user.email);
  if (!existUser) {
    await insertUser(user);
    // New user bonus credits (expire in one year)
    await increaseCredits({
      user_uuid: user.uuid || "",
      trans_type: CreditsTransType.NewUser,
      credits: CreditsAmount.NewUserGet,     // e.g. 10
      expired_at: getOneYearLaterTimestr(),
    });
  } else {
    user.id = existUser.id;
    user.uuid = existUser.uuid;
    user.created_at = existUser.created_at;
  }
  return user;
}
```

---

## Google One Tap Login (`hooks/useOneTapLogin.tsx`)

Polls when unauthenticated, shown as browser-native prompt:

```tsx
"use client";
import googleOneTap from "google-one-tap";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function UseOneTapLogin() {
  const { data: session, status } = useSession();

  const oneTapLogin = () => {
    googleOneTap(
      {
        client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: "signin",
      },
      (response: any) => signIn("google-one-tap", {
        credential: response.credential,
        redirect: false,
      })
    );
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      oneTapLogin();
      const intervalId = setInterval(oneTapLogin, 3000); // Re-prompt every 3s
      return () => clearInterval(intervalId);
    }
  }, [status]);

  return <></>;
}
```

---

## AppContext — Ties Auth to Global State (`contexts/app.tsx`)

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true") {
    useOneTapLogin();
  }

  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);

  const fetchUserInfo = async () => {
    try {
      const resp = await fetch("/api/get-user-info", { method: "POST" });
      const { code, message, data } = await resp.json();
      if (code === 0) setUser(data);
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

  useEffect(() => {
    if (session?.user) fetchUserInfo();
  }, [session]);

  return (
    <AppContext.Provider value={{ user, setUser, /* theme, sign modal, etc. */ }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

## Middleware with i18n Exclusions (`middleware.ts`)

Legal and API routes excluded from locale rewriting:

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
  ],
};
```

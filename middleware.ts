import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

import { env } from "@/env";
import type { Database } from "@/lib/supabase/types";

export const middleware = async (request: NextRequest) => {
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...(options as CookieOptions) });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: "",
            ...(options as CookieOptions),
            maxAge: 0,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reports");

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

import { env } from "@/env";
import type { Database } from "./types";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not fully configured. Authentication and data fetching will fail until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  );
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...(options as CookieOptions) });
        } catch (error) {
          // noop: cookies are read-only in certain server contexts (e.g. statically rendered)
          console.error("Failed to set supabase auth cookie", error);
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...(options as CookieOptions),
            maxAge: 0,
          });
        } catch (error) {
          console.error("Failed to clear supabase auth cookie", error);
        }
      },
    },
  });
};

export const createSupabaseRouteHandlerClient = async (request: NextRequest) => {
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  });

  return { supabase, response };
};

export const createSupabaseServerActionClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...(options as CookieOptions) });
        } catch (error) {
          console.error("Failed to set cookie in server action", error);
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...(options as CookieOptions),
            maxAge: 0,
          });
        } catch (error) {
          console.error("Failed to remove cookie in server action", error);
        }
      },
    },
  });
};
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/env";
import type { Database } from "./types";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Supabase environment variables are not fully configured. Provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const createSupabaseClient = (): SupabaseClient<Database> =>
  createClient<Database>(supabaseUrl ?? "", supabaseServiceKey ?? "", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

export const createSupabaseServerClient = () => createSupabaseClient();

export const createSupabaseServerActionClient = () => createSupabaseClient();

export const createSupabaseRouteHandlerClient = () => createSupabaseClient();
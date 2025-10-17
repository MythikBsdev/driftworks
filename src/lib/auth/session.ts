import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const SESSION_COOKIE = "dw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
};

export type Session = {
  token: string;
  user: SessionUser;
};

export const createSession = async (user: SessionUser) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  const supabase = createSupabaseServerClient();
  await supabase
    .from("user_sessions")
    .insert(
      {
        token,
        user_id: user.id,
        expires_at: expiresAt,
      } as never,
    );

  const cookieStore = await cookies();
    cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const getSession = async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data: session } = await supabase
    .from("user_sessions")
    .select("token, user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  const sessionRecord =
    session as Database["public"]["Tables"]["user_sessions"]["Row"] | null;

  if (!sessionRecord) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (new Date(sessionRecord.expires_at) < new Date()) {
    await supabase.from("user_sessions").delete().eq("token", token);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const { data: user } = await supabase
    .from("app_users")
    .select("id, username, full_name, role")
    .eq("id", sessionRecord.user_id)
    .maybeSingle();

  const userRecord =
    user as Database["public"]["Tables"]["app_users"]["Row"] | null;

  if (!userRecord) {
    await supabase.from("user_sessions").delete().eq("token", token);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return {
    token,
    user: userRecord,
  };
};

export const destroySession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const supabase = createSupabaseServerClient();
    await supabase.from("user_sessions").delete().eq("token", token);
  }

      cookieStore.delete(SESSION_COOKIE);
};







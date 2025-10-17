import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  await supabase.from("user_sessions").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  });

  const cookieStore = cookies();
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
  const cookieStore = cookies();
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

  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("user_sessions").delete().eq("token", token);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const { data: user } = await supabase
    .from("app_users")
    .select("id, username, full_name, role")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) {
    await supabase.from("user_sessions").delete().eq("token", token);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return {
    token,
    user,
  };
};

export const destroySession = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const supabase = createSupabaseServerClient();
    await supabase.from("user_sessions").delete().eq("token", token);
  }

  cookieStore.delete(SESSION_COOKIE);
};

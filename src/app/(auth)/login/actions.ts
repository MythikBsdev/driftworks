"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type AppUserRow = Database["public"]["Tables"]["app_users"]["Row"];

export type LoginFormState = {
  error?: string;
  message?: string;
};

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

export const login = async (
  _prev: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> => {
  const supabase = createSupabaseServerActionClient();

  const parsed = loginSchema.safeParse({
    username: formData.get("username")?.toString().trim() ?? "",
    password: formData.get("password")?.toString() ?? "",
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid credentials",
    } satisfies LoginFormState;
  }

  const credentials = parsed.data;

  const { data } = await supabase
    .from("app_users")
    .select("id, username, full_name, role, password_hash")
    .eq("username", credentials.username)
    .maybeSingle();

  const account = data as Pick<
    AppUserRow,
    "id" | "username" | "full_name" | "role" | "password_hash"
  > | null;

  if (!account) {
    return { error: "Invalid username or password" } satisfies LoginFormState;
  }

  const valid = await verifyPassword(
    credentials.password,
    account.password_hash,
  );

  if (!valid) {
    return { error: "Invalid username or password" } satisfies LoginFormState;
  }

  const { token } = await createSession({
    id: account.id,
    username: account.username,
    full_name: account.full_name,
    role: account.role,
  });

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

  const destination =
    credentials.redirectTo && credentials.redirectTo.startsWith("/")
      ? credentials.redirectTo
      : "/dashboard";

  redirect(destination);
};


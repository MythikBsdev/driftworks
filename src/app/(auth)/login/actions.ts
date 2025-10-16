"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

export type LoginFormState = {
  error?: string;
  message?: string;
};

export const login = async (_prev: LoginFormState | undefined, formData: FormData) => {
  const supabase = await createSupabaseServerActionClient();

  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid credentials",
    } satisfies LoginFormState;
  }

  const { redirectTo, ...credentials } = parsed.data;

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      error: error.message,
    } satisfies LoginFormState;
  }

  const destination = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  redirect(destination);
};
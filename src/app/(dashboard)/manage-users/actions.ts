"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_\-]+$/,
      "Only letters, numbers, hyphen, and underscore allowed",
    ),
  fullName: z
    .string()
    .max(120, "Name is too long")
    .optional()
    .or(z.literal("")),
  role: z.enum(["owner", "manager", "mechanic", "sales", "apprentice"]).default("apprentice"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const createUserAccount = async (
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return {
      status: "error",
      message: "You do not have permission to create users.",
    };
  }

  const parsed = createUserSchema.safeParse({
    username: formData.get("username")?.toString().trim(),
    fullName: formData.get("fullName")?.toString().trim(),
    role: formData.get("role")?.toString(),
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid user details",
    };
  }

  const supabase = createSupabaseServerActionClient();

  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "Username is already taken" };
  }

  const password_hash = await hashPassword(parsed.data.password);

  const { error } = await supabase
    .from("app_users")
    .insert(
      // Cast keeps Supabase from collapsing the payload type.
      {
        username: parsed.data.username,
        password_hash,
        full_name: parsed.data.fullName || null,
        role: parsed.data.role,
      } as never,
    );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/manage-users");

  return { status: "success" };
};



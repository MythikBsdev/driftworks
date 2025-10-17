"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

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
  role: z
    .enum([
      "owner",
      "manager",
      "shop_foreman",
      "master_tech",
      "mechanic",
      "apprentice",
    ])
    .default("apprentice"),
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

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: createUserSchema.shape.role,
});

export const updateUserRole = async (formData: FormData) => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId")?.toString(),
    role: formData.get("role")?.toString(),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { data: target } = await supabase
    .from("app_users")
    .select("id, role")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  const targetRow =
    target as Database["public"]["Tables"]["app_users"]["Row"] | null;

  if (!targetRow) {
    return;
  }

  if (
    targetRow.role === "owner" &&
    parsed.data.role !== "owner"
  ) {
    const { count } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return;
    }
  }

  const { error } = await supabase
    .from("app_users")
    .update(
      {
        role: parsed.data.role,
      } as never,
    )
    .eq("id", parsed.data.userId);

  if (!error) {
    revalidatePath("/manage-users");
  }
};

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: createUserSchema.shape.password,
});

export const resetUserPassword = async (formData: FormData) => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId")?.toString(),
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return;
  }

  const password_hash = await hashPassword(parsed.data.password);
  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase
    .from("app_users")
    .update(
      {
        password_hash,
      } as never,
    )
    .eq("id", parsed.data.userId);

  if (!error) {
    revalidatePath("/manage-users");
  }
};

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export const deleteUserAccount = async (formData: FormData) => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const parsed = deleteUserSchema.safeParse({
    userId: formData.get("userId")?.toString(),
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.userId === session.user.id) {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { data: target } = await supabase
    .from("app_users")
    .select("id, role")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (!target) {
    return;
  }

  const targetRow =
    target as Database["public"]["Tables"]["app_users"]["Row"] | null;

  if (!targetRow) {
    return;
  }

  if (targetRow.role === "owner") {
    const { count } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return;
    }
  }

  const { error } = await supabase
    .from("app_users")
    .delete()
    .eq("id", parsed.data.userId);

  if (!error) {
    revalidatePath("/manage-users");
  }
};



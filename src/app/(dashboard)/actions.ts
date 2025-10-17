"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  destroySession,
  getSession,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database, InvoiceStatus } from "@/lib/supabase/types";

export const signOut = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  await destroySession(token);
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
};

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().nonnegative(),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number required"),
  client_id: z.string().uuid(),
  issue_date: z.string(),
  due_date: z.string(),
  status: z.custom<InvoiceStatus>(),
  currency: z.string().length(3),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export type InvoiceFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export const createInvoice = async (
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const supabase = createSupabaseServerActionClient();
  const parsed = invoiceSchema.safeParse({
    invoice_number: formData.get("invoice_number"),
    client_id: formData.get("client_id"),
    issue_date: formData.get("issue_date"),
    due_date: formData.get("due_date"),
    status: formData.get("status"),
    currency: formData.get("currency"),
    notes: formData.get("notes"),
    items: JSON.parse((formData.get("items") as string) ?? "[]"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid invoice data",
    };
  }

  const {
    invoice_number,
    client_id,
    issue_date,
    due_date,
    status,
    currency,
    notes,
    items,
  } = parsed.data;

  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price,
    0,
  );
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const invoicePayload: Database["public"]["Tables"]["invoices"]["Insert"] = {
    owner_id: session.user.id,
    client_id,
    issue_date,
    due_date,
    status,
    currency,
    invoice_number,
    subtotal,
    tax,
    total,
    notes: notes ?? null,
  };

  const { error: invoiceError, data: invoice } = await supabase
    .from("invoices")
    // Supabase type helpers do not infer the insert payload correctly here, so we
    // cast to never to keep the runtime behaviour unchanged.
    .insert(invoicePayload as never)
    .select("id")
    .single();

  const insertedInvoice =
    invoice as Database["public"]["Tables"]["invoices"]["Row"] | null;

  if (
    invoiceError ||
    !insertedInvoice ||
    typeof insertedInvoice !== "object" ||
    !("id" in insertedInvoice)
  ) {
    return {
      status: "error",
      message: invoiceError?.message ?? "Unable to save invoice",
    };
  }

  const itemsPayload: Database["public"]["Tables"]["invoice_items"]["Insert"][] =
    items.map((item) => ({
      invoice_id: insertedInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
    }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    // Cast required for the same Supabase typing quirk as above.
    .insert(itemsPayload as never);

  if (itemsError) {
    return { status: "error", message: itemsError.message };
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");

  return { status: "success" };
};

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ClientFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export const createClient = async (
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const supabase = createSupabaseServerActionClient();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid client data",
    };
  }

  const { error } = await supabase
    .from("clients")
    .insert({
      owner_id: session.user.id,
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    } as never);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/sales-register");
  revalidatePath("/sales");
  revalidatePath("/dashboard");

  return { status: "success" };
};







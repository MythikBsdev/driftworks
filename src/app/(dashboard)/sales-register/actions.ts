"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { brand } from "@/config/brands";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";
import { brandCurrency } from "@/config/brand-overrides";

const cartItemSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  profit: z.number().nonnegative().default(0),
  commissionFlatOverride: z.number().nonnegative().nullable().optional(),
  quantity: z.number().min(1),
});

const LOYALTY_ACTIONS = ["none", "stamp", "double", "redeem"] as const;
const LOYALTY_ENABLED = brand.slug === "driftworks";
type LoyaltyAccount =
  Database["public"]["Tables"]["loyalty_accounts"]["Row"];
type LoyaltyUpdatePayload = {
  id: string;
  stamp_count: number;
  total_stamps: number;
  total_redemptions: number;
};

const saleSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    cid: z
      .string()
      .max(32, "CID must be 32 characters or fewer")
      .optional()
      .transform((value) => value?.trim().toUpperCase() ?? ""),
    loyaltyAction: z.enum(LOYALTY_ACTIONS).default("none"),
    items: z.array(cartItemSchema).min(1, "Add at least one item"),
    discountId: z.string().uuid().nullable(),
  })
  .refine((data) => data.loyaltyAction === "none" || data.cid.length, {
    message: "CID is required to apply a loyalty action",
    path: ["cid"],
  })
  .transform((data) => ({
    ...data,
    cid: data.cid.length ? data.cid : null,
  }));

export type CompleteSaleState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const completeSale = async (
  _prev: CompleteSaleState,
  formData: FormData,
): Promise<CompleteSaleState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = saleSchema.safeParse({
    invoiceNumber: formData.get("invoiceNumber")?.toString().trim(),
    cid: formData.get("cid")?.toString(),
    loyaltyAction: LOYALTY_ENABLED
      ? formData.get("loyaltyAction")?.toString()
      : "none",
    items: (() => {
      try {
        return JSON.parse(formData.get("items")?.toString() ?? "[]");
      } catch {
        return [];
      }
    })(),
    discountId: (() => {
      const raw = formData.get("discountId");
      if (!raw) {
        return null;
      }
      const value = raw.toString().trim();
      return value.length ? value : null;
    })(),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unable to process sale",
    };
  }

  const { invoiceNumber, items, discountId, cid, loyaltyAction } = parsed.data;
  const roundCurrency = (amount: number) =>
    Math.round((amount + Number.EPSILON) * 100) / 100;

  const subtotal = roundCurrency(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );
  const profitSubtotal = roundCurrency(
    items.reduce((acc, item) => acc + (item.profit ?? 0) * item.quantity, 0),
  );

  const supabase = createSupabaseServerActionClient();

  let discountAmount = 0;
  if (discountId) {
    const { data: discountRecord } = await supabase
      .from("discounts")
      .select("percentage")
      .eq("id", discountId)
      .maybeSingle();

    const discountRow =
      discountRecord as Database["public"]["Tables"]["discounts"]["Row"] | null;

    if (!discountRow) {
      return {
        status: "error",
        message: "Selected discount could not be found",
      };
    }

    discountAmount = roundCurrency(
      subtotal * (discountRow.percentage ?? 0),
    );
  }

  let loyaltyUpdate: LoyaltyUpdatePayload | null = null;
  if (LOYALTY_ENABLED && loyaltyAction !== "none") {
    if (!cid) {
      return {
        status: "error",
        message: "CID is required to apply a loyalty action",
      };
    }

    const { data: loyaltyRecord, error: loyaltyFetchError } = await supabase
      .from("loyalty_accounts")
      .select("id, stamp_count, total_stamps, total_redemptions")
      .eq("owner_id", session.user.id)
      .eq("cid", cid)
      .maybeSingle();

    if (loyaltyFetchError) {
      return {
        status: "error",
        message: loyaltyFetchError.message,
      };
    }

    let account =
      loyaltyRecord as LoyaltyAccount | null;

    if (!account) {
      const { data: createdAccount, error: createAccountError } = await supabase
        .from("loyalty_accounts")
        .insert(
          [
            {
              owner_id: session.user.id,
              cid,
            },
          ] as never,
        )
        .select("id, stamp_count, total_stamps, total_redemptions")
        .single();

      if (createAccountError || !createdAccount) {
        return {
          status: "error",
          message:
            createAccountError?.message ?? "Unable to create loyalty account",
        };
      }

      account = createdAccount as LoyaltyAccount;
    }

    if (loyaltyAction === "redeem") {
      if (account.stamp_count < 9) {
        return {
          status: "error",
          message: "Customer needs 9 loyalty stamps before redeeming a free sale",
        };
      }

      loyaltyUpdate = {
        id: account.id,
        stamp_count: 0,
        total_stamps: account.total_stamps,
        total_redemptions: account.total_redemptions + 1,
      };
      discountAmount = subtotal;
    } else {
      const stampIncrement = loyaltyAction === "double" ? 2 : 1;
      const nextStampCount = Math.min(account.stamp_count + stampIncrement, 9);
      loyaltyUpdate = {
        id: account.id,
        stamp_count: nextStampCount,
        total_stamps: account.total_stamps + stampIncrement,
        total_redemptions: account.total_redemptions,
      };
    }
  }

  const total = roundCurrency(Math.max(subtotal - discountAmount, 0));
  const discountMultiplier = subtotal > 0 ? Math.max(total / subtotal, 0) : 0;
  const profitTotal = roundCurrency(Math.max(profitSubtotal * discountMultiplier, 0));

  const { data: existing } = await supabase
    .from("sales_orders")
    .select("id")
    .eq("invoice_number", invoiceNumber)
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "Invoice number already exists" };
  }

  const { data: inserted, error } = await supabase
    .from("sales_orders")
    .insert(
      {
        owner_id: session.user.id,
        cid,
        invoice_number: invoiceNumber,
        loyalty_action: loyaltyAction,
        subtotal,
        discount: discountAmount,
        total,
        profit_total: profitTotal,
        status: "completed",
      } as never,
    )
    .select("id")
    .single();

  const orderRecord =
    inserted as Database["public"]["Tables"]["sales_orders"]["Row"] | null;

  if (error || !orderRecord) {
    return { status: "error", message: error?.message ?? "Unable to create sale" };
  }

  const { error: itemsError } = await supabase
    .from("sales_order_items")
    .insert(
      items.map((item) => ({
        order_id: orderRecord.id,
        item_name: item.name,
        catalog_item_id: item.itemId,
        quantity: item.quantity,
        unit_price: item.price,
        unit_profit: item.profit ?? 0,
        total: item.price * item.quantity,
        profit_total: roundCurrency(
          Math.max((item.profit ?? 0) * item.quantity * discountMultiplier, 0),
        ),
        commission_flat_override: item.commissionFlatOverride ?? null,
      })) as never,
    );

  if (itemsError) {
    return { status: "error", message: itemsError.message };
  }

  if (loyaltyUpdate) {
    const { error: loyaltyUpdateError } = await supabase
      .from("loyalty_accounts")
      .update(
        {
          stamp_count: loyaltyUpdate.stamp_count,
          total_stamps: loyaltyUpdate.total_stamps,
          total_redemptions: loyaltyUpdate.total_redemptions,
        } as never,
      )
      .eq("id", loyaltyUpdate.id);

    if (loyaltyUpdateError) {
      return {
        status: "error",
        message: loyaltyUpdateError.message ?? "Unable to update loyalty data",
      };
    }
  }

  const formatter = currencyFormatter(brandCurrency);
  const saleIdDisplay = orderRecord.id.slice(0, 8).toUpperCase();
  const soldBy = session.user.full_name ?? session.user.username;

  const webhookUrl = brand.webhooks?.sales;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `${brand.shortName} Sales Portal`,
          embeds: [
            {
              title: "?? New Sale Completed!",
              color: 5763719,
              fields: [
                { name: "Invoice ID", value: invoiceNumber, inline: true },
                { name: "Sale ID", value: saleIdDisplay, inline: true },
                { name: "Amount", value: formatter.format(total), inline: true },
                { name: "Sold By", value: soldBy, inline: false },
              ],
              footer: { text: `${brand.shortName} Sales System` },
              timestamp: new Date().toISOString(),
            },
          ],
          allowed_mentions: { parse: [] },
        }),
      });
    } catch (error) {
      console.error("Failed to dispatch Discord webhook", error);
    }
  } else {
    console.warn(`[webhook] No sales webhook configured for brand "${brand.slug}"`);
  }


  revalidatePath("/sales");
  revalidatePath("/sales-register");
  if (LOYALTY_ENABLED) {
    revalidatePath("/loyalty");
  }

  return { status: "success" };
};

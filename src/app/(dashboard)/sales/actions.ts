"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  brandCurrency,
  commissionUsesProfit,
  hasLsManagerOrOwnerAccess,
  hasManagerLikeAccess,
  hasOwnerLikeAccess,
} from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";
import { z } from "zod";

const deleteOrderItemsInChunks = async (
  supabase: ReturnType<typeof createSupabaseServerActionClient>,
  orderIds: string[],
) => {
  if (!orderIds.length) {
    return true;
  }

  const chunkSize = 99;
  const chunks: string[][] = [];
  for (let index = 0; index < orderIds.length; index += chunkSize) {
    chunks.push(orderIds.slice(index, index + chunkSize));
  }

  for (const chunk of chunks) {
    const { error } = await supabase
      .from("sales_order_items")
      .delete()
      .in("order_id", chunk);

    if (error) {
      console.error("Failed to delete sales order items", error);
      return false;
    }
  }

  return true;
};

const removeUserSales = async (
  supabase: ReturnType<typeof createSupabaseServerActionClient>,
  userId: string,
) => {
  const { data: orderRows, error: orderSelectError } = await supabase
    .from("sales_orders")
    .select("id")
    .eq("owner_id", userId);

  if (orderSelectError) {
    console.error("Failed to fetch sales orders for reset", orderSelectError);
    return false;
  }

  const typedOrders =
    (orderRows ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const orderIds = typedOrders
    .map((order) => order.id)
    .filter((id): id is string => Boolean(id));

  const itemsDeleted = await deleteOrderItemsInChunks(supabase, orderIds);
  if (!itemsDeleted) {
    return false;
  }

  const { error: salesOrdersError } = await supabase
    .from("sales_orders")
    .delete()
    .eq("owner_id", userId);
  if (salesOrdersError) {
    console.error("Failed to delete sales orders", salesOrdersError);
    return false;
  }

  const { error: employeeSalesError } = await supabase
    .from("employee_sales")
    .delete()
    .or(`employee_id.eq.${userId},owner_id.eq.${userId}`);
  if (employeeSalesError) {
    console.error("Failed to delete employee sales", employeeSalesError);
    return false;
  }

  return true;
};

const payUserSchema = z.object({
  userId: z.string().uuid(),
  bonus: z.preprocess(
    (value) => {
      if (value === undefined || value === null) return 0;
      const raw = value.toString().trim();
      if (!raw.length) return 0;
      return Number(raw);
    },
    z.number().nonnegative("Bonus must be zero or greater"),
  ),
});

type SalesOrderRow = Database["public"]["Tables"]["sales_orders"]["Row"];
type SalesOrderItemRow = Database["public"]["Tables"]["sales_order_items"]["Row"];
type EmployeeSalesRow = Database["public"]["Tables"]["employee_sales"]["Row"];

const computeTotals = (
  salesOrders: SalesOrderRow[],
  salesOrderItems: SalesOrderItemRow[],
  employeeSales: EmployeeSalesRow[],
  roleRate: number,
  useProfitBase: boolean,
) => {
  const itemsByOrderId = new Map<string, SalesOrderItemRow[]>();
  salesOrderItems.forEach((item) => {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  });

  let commissionTotal = 0;
  let salesTotal = 0;

  salesOrders.forEach((order) => {
    salesTotal += order.total ?? 0;
    const discountMultiplier =
      order.subtotal && order.subtotal > 0
        ? Math.max(Math.min((order.total ?? 0) / order.subtotal, 1), 0)
        : 0;
    const lineItems = itemsByOrderId.get(order.id) ?? [];
    if (lineItems.length) {
      lineItems.forEach((item) => {
        const base = useProfitBase
          ? item.profit_total ?? 0
          : (item.total ?? 0) * discountMultiplier;
        const appliedFlat = item.commission_flat_override;
        if (appliedFlat != null) {
          commissionTotal += appliedFlat * (item.quantity ?? 1) * discountMultiplier;
        } else {
          commissionTotal += base * roleRate;
        }
      });
      return;
    }
    const fallbackBase = useProfitBase ? order.profit_total ?? 0 : order.total ?? 0;
    commissionTotal += fallbackBase * roleRate;
  });

  employeeSales.forEach((entry) => {
    salesTotal += entry.amount ?? 0;
    commissionTotal += (entry.amount ?? 0) * roleRate;
  });

  return { salesTotal, commissionTotal };
};

export const resetAllSales = async () => {
  const session = await getSession();
  const canManage = session && hasLsManagerOrOwnerAccess(session.user.role);

  if (!canManage) {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { data: userRows, error: userSelectError } = await supabase
    .from("app_users")
    .select("id, role, username");

  if (userSelectError) {
    console.error("Failed to fetch users for reset", userSelectError);
    return;
  }

  const typedUsers =
    (userRows ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

  for (const user of typedUsers) {
    const { salesTotal, commissionTotal } = await computeUserTotalsForUser(
      supabase,
      user.id,
      user.role,
    );

    const { error: logError } = await supabase.from("payout_logs").insert({
      user_id: user.id,
      username: user.username,
      sales_total: salesTotal,
      commission_total: commissionTotal,
      bonus: 0,
      action: "reset",
    } as never);
    if (logError) {
      console.error("Failed to log payout during resetAll", logError);
    }

    const success = await removeUserSales(supabase, user.id);
    if (!success) {
      return;
    }
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};

export const resetUserSales = async (formData: FormData) => {
  const session = await getSession();
  const canManage = session && hasLsManagerOrOwnerAccess(session.user.role);

  if (!canManage) {
    return;
  }

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId.length) {
    return;
  }

  const supabase = createSupabaseServerActionClient();
  const { data: userRowRaw } = await supabase
    .from("app_users")
    .select("id, role, username")
    .eq("id", userId)
    .maybeSingle();

  const userRow =
    userRowRaw as Database["public"]["Tables"]["app_users"]["Row"] | null;

  if (userRow) {
    const { salesTotal, commissionTotal } = await computeUserTotalsForUser(
      supabase,
      userRow.id,
      userRow.role,
    );
    const { error: logError } = await supabase.from("payout_logs").insert({
      user_id: userRow.id,
      username: userRow.username,
      sales_total: salesTotal,
      commission_total: commissionTotal,
      bonus: 0,
      action: "reset",
    } as never);
    if (logError) {
      console.error("Failed to log payout during resetUser", logError);
    }
  }

  const success = await removeUserSales(supabase, userId);
  if (!success) {
    return;
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};

export const deleteSale = async (formData: FormData) => {
  const session = await getSession();
  if (!session || !hasManagerLikeAccess(session.user.role)) {
    return;
  }

  const saleId = formData.get("saleId");
  const saleType = formData.get("saleType");

  if (typeof saleId !== "string" || !saleId.length) {
    return;
  }

  if (saleType !== "register" && saleType !== "employee") {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  if (saleType === "register") {
    const itemsDeleted = await deleteOrderItemsInChunks(supabase, [saleId]);
    if (!itemsDeleted) {
      return;
    }

    const { error: deleteOrderError } = await supabase
      .from("sales_orders")
      .delete()
      .eq("id", saleId);

    if (deleteOrderError) {
      console.error("Failed to delete sales order", deleteOrderError);
      return;
    }
  } else {
    const { error: deleteEmployeeSaleError } = await supabase
      .from("employee_sales")
      .delete()
      .eq("id", saleId);

    if (deleteEmployeeSaleError) {
      console.error("Failed to delete employee sale", deleteEmployeeSaleError);
      return;
    }
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
};

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const computeUserTotalsForUser = async (
  supabase: ReturnType<typeof createSupabaseServerActionClient>,
  userId: string,
  role: string,
) => {
  const [{ data: commissionRatesResult }, { data: salesOrdersResult }, { data: employeeSalesResult }] =
    await Promise.all([
      supabase.from("commission_rates").select("role, rate"),
      supabase
        .from("sales_orders")
        .select("id, owner_id, subtotal, total, profit_total")
        .eq("owner_id", userId),
      supabase
        .from("employee_sales")
        .select("employee_id, amount")
        .eq("employee_id", userId),
    ]);

  const commissionRates =
    (commissionRatesResult ?? []) as Database["public"]["Tables"]["commission_rates"]["Row"][];
  const salesOrders =
    (salesOrdersResult ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const employeeSales =
    (employeeSalesResult ?? []) as Database["public"]["Tables"]["employee_sales"]["Row"][];

  const commissionMap = new Map<string, number>();
  commissionRates.forEach((rate) => commissionMap.set(rate.role, rate.rate ?? 0));
  const roleRate = commissionMap.get(role) ?? 0;

  const saleIds = salesOrders.map((order) => order.id).filter(Boolean);
  let salesOrderItems: Database["public"]["Tables"]["sales_order_items"]["Row"][] = [];
  if (saleIds.length) {
    const { data: saleItemRows } = await supabase
      .from("sales_order_items")
      .select("order_id, total, profit_total, commission_flat_override, quantity")
      .in("order_id", saleIds);
    salesOrderItems =
      (saleItemRows ?? []) as Database["public"]["Tables"]["sales_order_items"]["Row"][];
  }

  return computeTotals(salesOrders, salesOrderItems, employeeSales, roleRate, commissionUsesProfit);
};

export type PayUserState =
  | { status: "idle"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const payUser = async (_prev: PayUserState, formData: FormData): Promise<PayUserState> => {
  try {
    const session = await getSession();
    if (!session || !hasOwnerLikeAccess(session.user.role)) {
      console.warn("[payout] Blocked: insufficient permissions", { userId: session?.user.id });
      return { status: "error", message: "You do not have permission to pay users." };
    }

    const parsed = payUserSchema.safeParse({
      userId: formData.get("userId"),
      bonus: formData.get("bonus"),
    });

    if (!parsed.success) {
      console.warn("[payout] Validation failed", parsed.error.issues);
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid payout" };
    }

    const supabase = createSupabaseServerActionClient();
    const { data: targetUser, error: userError } = await supabase
      .from("app_users")
      .select("id, username, full_name, role, bank_account, pay_channel_id")
      .eq("id", parsed.data.userId)
      .maybeSingle();

    const targetRow = targetUser as Database["public"]["Tables"]["app_users"]["Row"] | null;

    if (userError || !targetRow) {
      console.error("[payout] User lookup failed", userError);
      return { status: "error", message: "User not found" };
    }

    if (!DISCORD_BOT_TOKEN) {
      console.error("[payout] Missing DISCORD_BOT_TOKEN");
      return { status: "error", message: "Discord bot token is not configured" };
    }

    if (!targetRow.pay_channel_id) {
      console.warn("[payout] No pay channel linked", { targetId: targetRow.id });
      return { status: "error", message: "No Discord payslip channel linked for this user." };
    }

    const [{ data: commissionRatesResult }, { data: salesOrdersResult }, { data: employeeSalesResult }] =
      await Promise.all([
        supabase.from("commission_rates").select("role, rate"),
        supabase
          .from("sales_orders")
          .select("id, owner_id, subtotal, total, profit_total")
          .eq("owner_id", targetRow.id),
        supabase
          .from("employee_sales")
          .select("employee_id, amount")
          .eq("employee_id", targetRow.id),
      ]);

    const commissionRates =
      (commissionRatesResult ?? []) as Database["public"]["Tables"]["commission_rates"]["Row"][];
    const salesOrders =
      (salesOrdersResult ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
    const employeeSales =
      (employeeSalesResult ?? []) as Database["public"]["Tables"]["employee_sales"]["Row"][];

    const commissionMap = new Map<string, number>();
    commissionRates.forEach((rate) => commissionMap.set(rate.role, rate.rate ?? 0));
    const roleRate = commissionMap.get(targetRow.role) ?? 0;

    const saleIds = salesOrders.map((order) => order.id).filter(Boolean);
    let salesOrderItems: Database["public"]["Tables"]["sales_order_items"]["Row"][] = [];
    if (saleIds.length) {
      const { data: saleItemRows } = await supabase
        .from("sales_order_items")
        .select("order_id, total, profit_total, commission_flat_override, quantity")
        .in("order_id", saleIds);
      salesOrderItems =
        (saleItemRows ?? []) as Database["public"]["Tables"]["sales_order_items"]["Row"][];
    }

    const itemsByOrderId = new Map<
      string,
      Database["public"]["Tables"]["sales_order_items"]["Row"][]
    >();
    salesOrderItems.forEach((item) => {
      const current = itemsByOrderId.get(item.order_id) ?? [];
      current.push(item);
      itemsByOrderId.set(item.order_id, current);
    });

    let commissionTotal = 0;

    salesOrders.forEach((order) => {
      const discountMultiplier =
        order.subtotal && order.subtotal > 0
          ? Math.max(Math.min((order.total ?? 0) / order.subtotal, 1), 0)
          : 0;
      const lineItems = itemsByOrderId.get(order.id) ?? [];
      if (lineItems.length) {
        lineItems.forEach((item) => {
          const base = commissionUsesProfit
            ? item.profit_total ?? 0
            : (item.total ?? 0) * discountMultiplier;
          const appliedFlat = item.commission_flat_override;
          if (appliedFlat != null) {
            commissionTotal += appliedFlat * (item.quantity ?? 1) * discountMultiplier;
          } else {
            commissionTotal += base * roleRate;
          }
        });
        return;
      }
      const fallbackBase = commissionUsesProfit ? order.profit_total ?? 0 : order.total ?? 0;
      commissionTotal += fallbackBase * roleRate;
    });

    employeeSales.forEach((entry) => {
      commissionTotal += (entry.amount ?? 0) * roleRate;
    });

    const bonus = Math.max(parsed.data.bonus ?? 0, 0);
    const netTotal = commissionTotal + bonus;

    const formatter = currencyFormatter(brandCurrency);

    const embed = {
      title: "Pay Slip",
      color: 0x22c55e,
      fields: [
        { name: "Employee", value: targetRow.full_name ?? targetRow.username, inline: true },
        { name: "Commission", value: formatter.format(commissionTotal), inline: true },
        { name: "Bonus", value: formatter.format(bonus), inline: true },
        { name: "Net Total", value: formatter.format(netTotal), inline: true },
        {
          name: "Bank Account",
          value: targetRow.bank_account ? `**${targetRow.bank_account}**` : "Not provided",
          inline: true,
        },
      ],
      footer: { text: "Issued via Benny's portal" },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(
      `https://discord.com/api/v10/channels/${targetRow.pay_channel_id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          embeds: [embed],
          allowed_mentions: { parse: [] },
        }),
      },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[payout] Failed to send payslip", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
    });
    return {
      status: "error",
      message: `Discord error (${response.status}): ${response.statusText}`,
    };
  }

    // Reset this user's commission history after paying out.
    const resetSuccess = await removeUserSales(supabase, targetRow.id);
    if (!resetSuccess) {
      console.error("[payout] Failed to reset commissions after payout", { userId: targetRow.id });
    }

    revalidatePath("/sales");
    revalidatePath("/sales-register");
    return {
      status: "success",
      message: resetSuccess
        ? "Payslip sent and commission reset."
        : "Payslip sent. Could not reset commission; please reset manually.",
    };
  } catch (error) {
    console.error("[payout] Unexpected error", error);
    return { status: "error", message: "Unexpected error sending payslip." };
  }
};

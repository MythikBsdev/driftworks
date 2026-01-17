import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";

import {
  brandCurrency,
  formatRoleLabel,
  hasManagerLikeAccess,
  commissionUsesProfit,
  isBennys,
} from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";
import { deleteSale, resetAllSales, resetUserSales } from "./actions";
import PayUserButton from "@/components/sales/pay-user-button";

type SalesPageProps = {
  searchParams?: Promise<{
    summary?: string;
    log?: string;
    user?: string;
  }>;
};

type SalesLogRowBase = {
  id: string;
  invoice: string;
  createdAt: string | null;
  subtotal: number;
  discount: number;
  total: number;
  soldBy: string;
};

type SalesLogRow =
  | ({ type: "register" } & SalesLogRowBase)
  | ({ type: "employee" } & SalesLogRowBase);

const SalesPage = async ({ searchParams }: SalesPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasManagerLikeAccess(session.user.role)) {
    redirect("/dashboard");
  }

  const summaryQuery = resolvedSearchParams?.summary?.toLowerCase().trim() ?? "";
  const logQuery = resolvedSearchParams?.log?.toLowerCase().trim() ?? "";
  const selectedUser =
    typeof resolvedSearchParams?.user === "string" && resolvedSearchParams.user.length > 0
      ? resolvedSearchParams.user
      : undefined;

  const supabase = createSupabaseServerClient();

  const [usersResult, employeeSalesResult, commissionRatesResult, salesOrdersResult] =
    await Promise.all([
      supabase
        .from("app_users")
        .select("id, username, full_name, role, bank_account")
        .order("username", { ascending: true }),
      supabase
        .from("employee_sales")
        .select("id, employee_id, invoice_number, amount, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("commission_rates")
        .select("role, rate")
        .order("role", { ascending: true }),
      supabase
        .from("sales_orders")
        .select("id, owner_id, invoice_number, subtotal, discount, total, profit_total, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const users =
    (usersResult.data ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];
  const employeeSales =
    (employeeSalesResult.data ?? []) as Database["public"]["Tables"]["employee_sales"]["Row"][];
  const commissionRates =
    (commissionRatesResult.data ?? []) as Database["public"]["Tables"]["commission_rates"]["Row"][];
  const salesOrders =
    (salesOrdersResult.data ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];

  let salesOrderItems: Database["public"]["Tables"]["sales_order_items"]["Row"][] = [];
  const saleIds = salesOrders.map((order) => order.id).filter(Boolean);
  if (saleIds.length) {
    const { data: saleItemRows } = await supabase
      .from("sales_order_items")
      .select("order_id, total, profit_total, commission_flat_override, quantity")
      .in("order_id", saleIds);

    salesOrderItems =
      (saleItemRows ?? []) as Database["public"]["Tables"]["sales_order_items"]["Row"][];
  }

  const userRoleLookup = new Map(users.map((user) => [user.id, user.role ?? ""]));

  const itemsByOrderId = new Map<
    string,
    Database["public"]["Tables"]["sales_order_items"]["Row"][]
  >();
  salesOrderItems.forEach((item) => {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  });

  const commissionMap = new Map<string, number>();
  commissionRates.forEach((rate) => {
    commissionMap.set(rate.role, rate.rate ?? 0);
  });

  const commissionBaseByUser = new Map<string, number>();
  const commissionTotalByUser = new Map<string, number>();

  const addBase = (userId: string, amount: number) => {
    const current = commissionBaseByUser.get(userId) ?? 0;
    commissionBaseByUser.set(userId, current + amount);
  };

  const addCommission = (userId: string, amount: number) => {
    const current = commissionTotalByUser.get(userId) ?? 0;
    commissionTotalByUser.set(userId, current + amount);
  };

  salesOrders.forEach((order) => {
    const ownerId = order.owner_id;
    if (!ownerId) {
      return;
    }

    const role = userRoleLookup.get(ownerId) ?? "";
    const roleRate = commissionMap.get(role) ?? 0;
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
        addBase(ownerId, base);
        const appliedFlat = item.commission_flat_override;
        if (appliedFlat != null) {
          addCommission(ownerId, appliedFlat * (item.quantity ?? 1) * discountMultiplier);
        } else {
          addCommission(ownerId, base * roleRate);
        }
      });
      return;
    }

    const fallbackBase = commissionUsesProfit ? order.profit_total ?? 0 : order.total ?? 0;
    addBase(ownerId, fallbackBase);
    addCommission(ownerId, fallbackBase * roleRate);
  });

  employeeSales.forEach((entry) => {
    const employeeId = entry.employee_id;
    const role = userRoleLookup.get(employeeId) ?? "";
    const roleRate = commissionMap.get(role) ?? 0;
    const base = entry.amount ?? 0;
    addBase(employeeId, base);
    addCommission(employeeId, base * roleRate);
  });

  const formatter = currencyFormatter(brandCurrency);

  const summaryRows = users
    .map((user) => {
      const commissionBase = commissionBaseByUser.get(user.id) ?? 0;
      const commissionTotal = commissionTotalByUser.get(user.id) ?? 0;
      const roleRate = commissionMap.get(user.role) ?? 0;
      const commissionRate =
        commissionBase > 0 ? commissionTotal / commissionBase : roleRate;
      return {
        id: user.id,
        displayName: user.full_name ?? user.username,
        username: user.username,
        role: user.role,
        commissionBase,
        commissionRate,
        commissionTotal,
        bankAccount: user.bank_account ?? null,
      };
    })
    .filter((row) => {
      if (!summaryQuery) {
        return true;
      }
      return (
        row.displayName.toLowerCase().includes(summaryQuery) ||
        row.username.toLowerCase().includes(summaryQuery)
      );
    })
    .sort((a, b) => b.commissionBase - a.commissionBase);

  const grandTotalCommissionBase = summaryRows.reduce(
    (acc, row) => acc + row.commissionBase,
    0,
  );
  const grandTotalCommission = summaryRows.reduce(
    (acc, row) => acc + row.commissionTotal,
    0,
  );

  const commissionBaseLabel = "Total Sales";
  const csvRows = [
    ["Name", "Role", commissionBaseLabel, "Commission %", "Commission", "Bank Account"],
    ...summaryRows.map((row) => [
      row.displayName,
      formatRoleLabel(row.role),
      row.commissionBase.toFixed(2),
      (row.commissionRate * 100).toFixed(2),
      row.commissionTotal.toFixed(2),
      row.bankAccount ?? "",
    ]),
  ];
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(
    csvRows.map((line) => line.join(",")).join("\n"),
  )}`;

  const userNameLookup = new Map(
    users.map((user) => [user.id, user.full_name ?? user.username]),
  );

  const rawLogRows: SalesLogRow[] = [];

  salesOrders.forEach((entry) => {
    if (selectedUser && entry.owner_id !== selectedUser) {
      return;
    }
    if (typeof entry.id !== "string" || !entry.id.length) {
      return;
    }

    rawLogRows.push({
      type: "register",
      id: entry.id,
      invoice: entry.invoice_number ?? "",
      createdAt: entry.created_at ?? null,
      subtotal: entry.subtotal ?? 0,
      discount: entry.discount ?? 0,
      total: entry.total ?? 0,
      soldBy: entry.owner_id
        ? userNameLookup.get(entry.owner_id) ?? "-"
        : "-",
    });
  });

  employeeSales.forEach((entry) => {
    if (selectedUser && entry.employee_id !== selectedUser) {
      return;
    }
    if (typeof entry.id !== "string" || !entry.id.length) {
      return;
    }

    rawLogRows.push({
      type: "employee",
      id: entry.id,
      invoice: entry.invoice_number ?? "",
      createdAt: entry.created_at ?? null,
      subtotal: entry.amount ?? 0,
      discount: 0,
      total: entry.amount ?? 0,
      soldBy: entry.employee_id
        ? userNameLookup.get(entry.employee_id) ?? "-"
        : "-",
    });
  });

  const logRows = rawLogRows
    .filter((row) => {
      if (!logQuery) {
        return true;
      }
      return (
        row.invoice.toLowerCase().includes(logQuery) ||
        row.id.toLowerCase().includes(logQuery) ||
        row.soldBy.toLowerCase().includes(logQuery)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 50);

  const summaryValue = resolvedSearchParams?.summary ?? "";
  const logValue = resolvedSearchParams?.log ?? "";

  const createSearchParams = () => {
    const params = new URLSearchParams();
    if (summaryValue) {
      params.set("summary", summaryValue.toString());
    }
    if (logValue) {
      params.set("log", logValue.toString());
    }
    return params;
  };

  const clearFilterQuery = createSearchParams().toString();
  const clearFilterHref = clearFilterQuery ? `?${clearFilterQuery}` : ".";
  const selectedUserName = selectedUser
    ? userNameLookup.get(selectedUser) ?? "Selected user"
    : null;
  const summaryCopy = commissionUsesProfit
    ? "Total profit (after discounts) used to calculate commission per user. Item-level fixed rates override role rates when set."
    : "Total sales amount and calculated commission per user since their last summary reset.";

  return (
    <div className="space-y-8">
      <section className="glass-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">User Sales Summary</h2>
            <p className="text-sm text-white/60">
              {summaryCopy}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={csvDataUri} download="sales-summary.csv" className="btn-ghost">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            {session.user.role === "owner" ? (
              <form action={resetAllSales} method="post">
                <button type="submit" className="btn-ghost text-red-300 hover:text-red-100">
                  Reset All
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <form className="max-w-sm" method="get">
            <input type="hidden" name="log" value={logValue} />
            {selectedUser ? (
              <input type="hidden" name="user" value={selectedUser} />
            ) : null}
            <input
              type="search"
              name="summary"
              defaultValue={summaryValue}
              placeholder="Search by username..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium text-left">User</th>
                <th className="px-4 py-3 font-medium text-left">Role</th>
                <th className="px-4 py-3 font-medium text-left">
                  {commissionBaseLabel}
                </th>
                <th className="px-4 py-3 font-medium text-left">Commission</th>
                <th className="px-4 py-3 font-medium text-left">Bank Account</th>
                <th className="px-4 py-3 font-medium text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.length ? (
                summaryRows.map((row) => {
                  const params = createSearchParams();
                  const isSelected = selectedUser === row.id;

                  if (!isSelected) {
                    params.set("user", row.id);
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-white/10 ${isSelected ? "bg-white/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-white">
                        <Link
                          href={`?${params.toString()}`}
                          className={`transition hover:text-brand-accent ${
                            isSelected ? "text-brand-accent" : ""
                          }`}
                        >
                          {row.displayName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {formatRoleLabel(row.role)}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {formatter.format(row.commissionBase)}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {formatter.format(row.commissionTotal)}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {row.bankAccount ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {isBennys ? (
                            <PayUserButton
                              userId={row.id}
                              displayName={row.displayName}
                              commissionTotal={row.commissionTotal}
                              bankAccount={row.bankAccount}
                              currency={brandCurrency}
                            />
                          ) : null}
                          {session.user.role === "owner" ? (
                            <form action={resetUserSales} method="post">
                              <input type="hidden" name="userId" value={row.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/30 hover:text-white"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:text-white disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-white/50"
                    colSpan={5}
                  >
                    No sales have been completed yet or match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
          <span>
            Grand Total {commissionBaseLabel}: {formatter.format(grandTotalCommissionBase)}
          </span>
          <span>
            Grand Total Commission: {formatter.format(grandTotalCommission)}
          </span>
        </div>
      </section>

      <section className="glass-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Detailed Sales Log</h2>
            <p className="text-sm text-white/60">
              {selectedUserName
                ? `Showing transactions completed by ${selectedUserName}.`
                : "A log of the last 50 completed transactions."}
            </p>
          </div>
          <form className="max-w-sm" method="get">
            <input type="hidden" name="summary" value={summaryValue} />
            {selectedUser ? (
              <input type="hidden" name="user" value={selectedUser} />
            ) : null}
            <input
              type="search"
              name="log"
              defaultValue={logValue}
              placeholder="Search by invoice #, username, or sale ID..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </form>
        </div>

        {selectedUser ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white">
            <span>
              Filtering by{" "}
              <span className="font-semibold text-white">
                {selectedUserName ?? "selected user"}
              </span>
            </span>
            <Link
              href={clearFilterHref}
              className="text-brand-accent transition hover:underline"
            >
              Clear filter
            </Link>
          </div>
        ) : null}

        <div className="mt-6 overflow-visible rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium text-left">Invoice #</th>
                <th className="px-4 py-3 font-medium text-left">Sale ID</th>
                <th className="px-4 py-3 font-medium text-left">Date</th>
                <th className="px-4 py-3 font-medium text-left">Sold By</th>
                <th className="px-4 py-3 font-medium text-left">Subtotal</th>
                <th className="px-4 py-3 font-medium text-left">Discount</th>
                <th className="px-4 py-3 font-medium text-left">Total</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logRows.length ? (
                logRows.map((row) => (
                  <tr key={`${row.id}`} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{row.invoice ?? "—"}</td>
                    <td className="px-4 py-3 text-white/60">{row.id}</td>
                    <td className="px-4 py-3 text-white/60">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/60">{row.soldBy}</td>
                    <td className="px-4 py-3 text-white/60">
                      {formatter.format(row.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {formatter.format(row.discount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatter.format(row.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteSale} className="inline-flex">
                        <input type="hidden" name="saleId" value={row.id} />
                        <input type="hidden" name="saleType" value={row.type} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          aria-label="Delete sale"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-white/50"
                    colSpan={8}
                  >
                    No sales have been completed yet or match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SalesPage;

















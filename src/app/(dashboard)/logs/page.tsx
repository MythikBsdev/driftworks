import { redirect } from "next/navigation";
import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";

import { brandCurrency, commissionUsesProfit, formatRoleLabel, isBennys } from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

const WEEKS_TO_SHOW = 6;

type WeeklyRow = {
  userId: string;
  displayName: string;
  role: string;
  sales: number;
  commission: number;
};

const LogsPage = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isBennys) {
    redirect("/dashboard");
  }

  const supabase = createSupabaseServerClient();

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekRanges = Array.from({ length: WEEKS_TO_SHOW }).map((_, index) => {
    const start = subWeeks(thisWeekStart, index);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return { start, end };
  });
  const earliestStart = weekRanges[weekRanges.length - 1]?.start ?? thisWeekStart;

  const [
    { data: usersResult },
    { data: commissionRatesResult },
    { data: salesOrdersResult },
    { data: employeeSalesResult },
    { data: terminationLogsResult },
  ] = await Promise.all([
    supabase.from("app_users").select("id, username, full_name, role").order("username", { ascending: true }),
    supabase.from("commission_rates").select("role, rate"),
    supabase
      .from("sales_orders")
      .select("id, owner_id, subtotal, total, profit_total, created_at")
      .gte("created_at", earliestStart.toISOString()),
    supabase
      .from("employee_sales")
      .select("employee_id, amount, created_at")
      .gte("created_at", earliestStart.toISOString()),
    supabase
      .from("termination_logs")
      .select("id, username, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const users =
    (usersResult ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];
  const commissionRates =
    (commissionRatesResult ?? []) as Database["public"]["Tables"]["commission_rates"]["Row"][];
  const salesOrders =
    (salesOrdersResult ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const employeeSales =
    (employeeSalesResult ?? []) as Database["public"]["Tables"]["employee_sales"]["Row"][];
  const terminationLogs =
    (terminationLogsResult ?? []) as Database["public"]["Tables"]["termination_logs"]["Row"][];

  const roleRateMap = new Map<string, number>();
  commissionRates.forEach((rate) => roleRateMap.set(rate.role, rate.rate ?? 0));

  const userLookup = new Map(users.map((user) => [user.id, user]));

  const saleIds = salesOrders.map((sale) => sale.id).filter(Boolean);
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

  const weekBuckets = weekRanges.map(() => new Map<string, { sales: number; commission: number }>());

  const findWeekIndex = (dateString?: string | null) => {
    if (!dateString) return -1;
    const date = new Date(dateString);
    return weekRanges.findIndex(({ start, end }) => date >= start && date <= end);
  };

  salesOrders.forEach((order) => {
    const weekIndex = findWeekIndex(order.created_at);
    if (weekIndex === -1) return;

    const discountMultiplier =
      order.subtotal && order.subtotal > 0
        ? Math.max(Math.min((order.total ?? 0) / order.subtotal, 1), 0)
        : 0;
    const lineItems = itemsByOrderId.get(order.id) ?? [];
    const targetMap = weekBuckets[weekIndex]!;

    const addForUser = (userId: string, salesAmount: number, commissionAmount: number) => {
      const current = targetMap.get(userId) ?? { sales: 0, commission: 0 };
      current.sales += salesAmount;
      current.commission += commissionAmount;
      targetMap.set(userId, current);
    };

    if (!order.owner_id) {
      return;
    }
    const roleRate = roleRateMap.get(userLookup.get(order.owner_id)?.role ?? "") ?? 0;

    addForUser(order.owner_id, order.total ?? 0, 0);

    if (lineItems.length) {
      lineItems.forEach((item) => {
        const base = commissionUsesProfit
          ? item.profit_total ?? 0
          : (item.total ?? 0) * discountMultiplier;
        const appliedFlat = item.commission_flat_override;
        if (appliedFlat != null) {
          addForUser(
            order.owner_id!,
            0,
            appliedFlat * (item.quantity ?? 1) * discountMultiplier,
          );
        } else {
          addForUser(order.owner_id!, 0, base * roleRate);
        }
      });
    } else {
      const fallbackBase = commissionUsesProfit ? order.profit_total ?? 0 : order.total ?? 0;
      addForUser(order.owner_id, 0, fallbackBase * roleRate);
    }
  });

  employeeSales.forEach((entry) => {
    const weekIndex = findWeekIndex(entry.created_at);
    if (weekIndex === -1) return;
    const targetMap = weekBuckets[weekIndex]!;
    const roleRate = roleRateMap.get(userLookup.get(entry.employee_id)?.role ?? "") ?? 0;

    const current = targetMap.get(entry.employee_id) ?? { sales: 0, commission: 0 };
    current.sales += entry.amount ?? 0;
    current.commission += (entry.amount ?? 0) * roleRate;
    targetMap.set(entry.employee_id, current);
  });

  const formatter = currencyFormatter(brandCurrency);

  const weeklySummaries = weekRanges.map((range, index) => {
    const rows: WeeklyRow[] = Array.from(weekBuckets[index]!.entries()).map(([userId, data]) => {
      const user = userLookup.get(userId);
      return {
        userId,
        displayName: user?.full_name ?? user?.username ?? "Unknown user",
        role: user?.role ?? "Unknown",
        sales: data.sales,
        commission: data.commission,
      };
    });

    rows.sort((a, b) => b.sales - a.sales);

    const label = `${format(range.start, "dd/MM/yy")} - ${format(range.end, "dd/MM/yy")}`;
    return { label, rows };
  });

  return (
    <div className="space-y-8">
      <section className="glass-card grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="muted-label">Weeks Tracked</p>
          <p className="mt-2 text-2xl font-semibold text-white">{weeklySummaries.length}</p>
          <p className="text-xs text-white/60">Rolling snapshots (Monday start).</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="muted-label">Unique Users</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {new Set(users.map((u) => u.id)).size}
          </p>
          <p className="text-xs text-white/60">Across all weeks shown.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="muted-label">Termination Entries</p>
          <p className="mt-2 text-2xl font-semibold text-white">{terminationLogs.length}</p>
          <p className="text-xs text-white/60">Most recent 50.</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Weekly Logs</h2>
            <p className="text-sm text-white/60">
              Expand a week to review sales and commission by user.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {weeklySummaries.map((week, index) => (
            <details
              key={week.label}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              open={index === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-white/80 transition hover:bg-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">{week.label}</p>
                  <p className="text-xs text-white/60">{week.rows.length} users</p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">Toggle</span>
              </summary>
              <div className="border-t border-white/10">
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full text-sm text-white/80">
                    <thead className="sticky top-0 bg-black/40 text-xs uppercase tracking-[0.3em] text-white/50 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">User</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Sales</th>
                        <th className="px-4 py-3 text-left font-medium">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.rows.length ? (
                        week.rows.map((row) => (
                          <tr key={`${week.label}-${row.userId}`} className="border-t border-white/10">
                            <td className="px-4 py-3 text-white">{row.displayName}</td>
                            <td className="px-4 py-3 text-white/60">{formatRoleLabel(row.role)}</td>
                            <td className="px-4 py-3 text-white/70">{formatter.format(row.sales)}</td>
                            <td className="px-4 py-3 font-medium text-white">
                              {formatter.format(row.commission)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-white/60" colSpan={4}>
                            No sales recorded for this week.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Termination Log</h3>
            <p className="text-sm text-white/60">Reasons recorded when users are deleted.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            {terminationLogs.length} entries
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Reason</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {terminationLogs.length ? (
                terminationLogs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{log.username}</td>
                    <td className="px-4 py-3 text-white/70">{log.reason}</td>
                    <td className="px-4 py-3 text-white/60">
                      {log.created_at ? format(new Date(log.created_at), "dd/MM/yy HH:mm") : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-white/60" colSpan={3}>
                    No termination entries recorded yet.
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

export default LogsPage;

import { redirect } from "next/navigation";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";

import { brandCurrency, formatRoleLabel, isBennys } from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

type WeeklyRow = {
  userId: string;
  displayName: string;
  role: string;
  sales: number;
  commission: number;
  bonus: number;
  salary: number;
  net: number;
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
  const anchorStart = new Date(Date.UTC(2026, 0, 12, 0, 0, 0));
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekRanges: { start: Date; end: Date }[] = [];
  for (
    let cursor = anchorStart;
    cursor <= thisWeekStart;
    cursor = addWeeks(cursor, 1)
  ) {
    weekRanges.push({
      start: cursor,
      end: endOfWeek(cursor, { weekStartsOn: 1 }),
    });
  }
  const earliestStart = anchorStart;

  const [
    { data: usersResult },
    { data: payoutLogsResult, error: payoutLogsError },
    { data: terminationLogsResult },
    { data: partsClearLogsResult },
  ] = await Promise.all([
    supabase.from("app_users").select("id, username, full_name, role").order("username", { ascending: true }),
    supabase
      .from("payout_logs")
      .select("user_id, sales_total, commission_total, bonus, salary, created_at, action")
      .eq("action", "reset")
      .gte("created_at", earliestStart.toISOString()),
    supabase
      .from("termination_logs")
      .select("id, username, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("parts_clear_logs")
      .select("id, brand_slug, guild_scope, triggered_by_username, cleared_amount, created_at")
      .eq("brand_slug", "bennys")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const users =
    (usersResult ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];
  const payoutLogs =
    payoutLogsError
      ? []
      : (payoutLogsResult ?? []) as {
          user_id: string | null;
          sales_total: number | null;
          commission_total: number | null;
          bonus: number | null;
          salary: number | null;
          created_at: string | null;
          action: string | null;
        }[];
  const terminationLogs =
    (terminationLogsResult ?? []) as Database["public"]["Tables"]["termination_logs"]["Row"][];
  const partsClearLogs =
    (partsClearLogsResult ?? []) as {
      id: string;
      brand_slug: string | null;
      guild_scope: string | null;
      triggered_by_username: string | null;
      cleared_amount: number | null;
      created_at: string | null;
    }[];

  const userLookup = new Map(users.map((user) => [user.id, user]));

  const weekBuckets = weekRanges.map(
    () => new Map<string, { sales: number; commission: number; bonus: number; salary: number }>(),
  );

  const findWeekIndex = (dateString?: string | null) => {
    if (!dateString) return -1;
    const date = new Date(dateString);
    return weekRanges.findIndex(({ start, end }) => date >= start && date <= end);
  };

  payoutLogs.forEach((log) => {
    const weekIndex = findWeekIndex(log.created_at);
    if (weekIndex === -1) return;
    if (!log.user_id) return;
    const target = weekBuckets[weekIndex]!;
    const current = target.get(log.user_id) ?? { sales: 0, commission: 0, bonus: 0, salary: 0 };
    current.sales += Number(log.sales_total ?? 0);
    current.commission += Number(log.commission_total ?? 0);
    current.bonus += Number(log.bonus ?? 0);
    current.salary += Number(log.salary ?? 0);
    target.set(log.user_id, current);
  });

  const formatter = currencyFormatter(brandCurrency);

  const weeklySummaries = weekRanges.map((range, index) => {
    const salesMap = weekBuckets[index]!;
    const allUserIds = new Set<string>(Array.from(salesMap.keys()));

    const rows: WeeklyRow[] = Array.from(allUserIds).map((userId) => {
      const user = userLookup.get(userId);
      const salesData =
        salesMap.get(userId) ?? { sales: 0, commission: 0, bonus: 0, salary: 0 };
      const bonus = salesData.bonus;
      const salary = salesData.salary;
      const commissionTotal = salesData.commission;
      const net = commissionTotal + bonus + salary;

      return {
        userId,
        displayName: user?.full_name ?? user?.username ?? "Unknown user",
        role: user?.role ?? "Unknown",
        sales: salesData.sales,
        commission: commissionTotal,
        bonus,
        salary,
        net,
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
              Expand a week to review reset totals by user.
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
                        <th className="px-4 py-3 text-left font-medium">Bonus</th>
                        <th className="px-4 py-3 text-left font-medium">Salary</th>
                        <th className="px-4 py-3 text-left font-medium">Net Outgoing</th>
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
                            <td className="px-4 py-3 text-white/70">
                              {formatter.format(row.bonus)}
                            </td>
                            <td className="px-4 py-3 text-white/70">
                              {formatter.format(row.salary)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {formatter.format(row.net)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-white/60" colSpan={7}>
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
            <h3 className="text-lg font-semibold text-white">Parts Clears</h3>
            <p className="text-sm text-white/60">Audit trail when Discord parts purchases are cleared.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            {partsClearLogs.length} entries
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Cleared By</th>
                <th className="px-4 py-3 text-left font-medium">Amount Cleared</th>
                <th className="px-4 py-3 text-left font-medium">Guild Scope</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {partsClearLogs.length ? (
                partsClearLogs.map((entry) => (
                  <tr key={entry.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">
                      {entry.triggered_by_username ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {formatter.format(entry.cleared_amount ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {entry.guild_scope ?? "All"}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {entry.created_at
                        ? format(new Date(entry.created_at), "dd/MM/yy HH:mm")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-white/60" colSpan={3}>
                    No parts clears logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

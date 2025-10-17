import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";


import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";
import { resetAllSales } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  shop_foreman: "Shop Foreman",
  master_tech: "Master Tech",
  mechanic: "Mechanic",
  apprentice: "Apprentice",
};

const formatRole = (role: string) =>
  ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);

type SalesPageProps = {
  searchParams?: {
    summary?: string;
    log?: string;
    user?: string;
  };
};

const SalesPage = async ({ searchParams }: SalesPageProps) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const allowedRoles = new Set(["owner", "manager"]);
  if (!allowedRoles.has(session.user.role)) {
    redirect("/dashboard");
  }

  const summaryQuery = searchParams?.summary?.toLowerCase().trim() ?? "";
  const logQuery = searchParams?.log?.toLowerCase().trim() ?? "";
  const selectedUser =
    typeof searchParams?.user === "string" && searchParams.user.length > 0
      ? searchParams.user
      : undefined;

  const supabase = createSupabaseServerClient();

  const [usersResult, employeeSalesResult, commissionRatesResult, salesOrdersResult] =
    await Promise.all([
      supabase
        .from("app_users")
        .select("id, username, full_name, role")
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
        .select("id, owner_id, invoice_number, subtotal, discount, total, created_at")
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

  const employeeTotals = new Map<string, number>();
  employeeSales.forEach((entry) => {
    const current = employeeTotals.get(entry.employee_id) ?? 0;
    employeeTotals.set(entry.employee_id, current + (entry.amount ?? 0));
  });

  const registerTotals = new Map<string, number>();
  salesOrders.forEach((order) => {
    const current = registerTotals.get(order.owner_id) ?? 0;
    registerTotals.set(order.owner_id, current + (order.total ?? 0));
  });

  const commissionMap = new Map<string, number>();
  commissionRates.forEach((rate) => {
    commissionMap.set(rate.role, rate.rate ?? 0);
  });

  const formatter = currencyFormatter("GBP");

  const summaryRows = users
    .map((user) => {
      const totalSales =
        (registerTotals.get(user.id) ?? 0) +
        (employeeTotals.get(user.id) ?? 0);
      const commissionRate = commissionMap.get(user.role) ?? 0;
      const commissionTotal = totalSales * commissionRate;
      return {
        id: user.id,
        displayName: user.full_name ?? user.username,
        username: user.username,
        role: user.role,
        totalSales,
        commissionRate,
        commissionTotal,
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
    });

  const grandTotalSales = summaryRows.reduce((acc, row) => acc + row.totalSales, 0);
  const grandTotalCommission = summaryRows.reduce(
    (acc, row) => acc + row.commissionTotal,
    0,
  );

  const csvRows = [
    ["Name", "Role", "Total Sales", "Commission %", "Commission"],
    ...summaryRows.map((row) => [
      row.displayName,
      formatRole(row.role),
      row.totalSales.toFixed(2),
      (row.commissionRate * 100).toFixed(2),
      row.commissionTotal.toFixed(2),
    ]),
  ];
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(
    csvRows.map((line) => line.join(",")).join("\n"),
  )}`;

  const userNameLookup = new Map(
    users.map((user) => [user.id, user.full_name ?? user.username]),
  );

  const logRows = [...salesOrders, ...employeeSales]
    .flatMap((entry) => {
      if ("subtotal" in entry) {
        if (selectedUser && entry.owner_id !== selectedUser) {
          return [];
        }
        const ownerName =
          users.find((user) => user.id === entry.owner_id)?.full_name ??
          users.find((user) => user.id === entry.owner_id)?.username ??
          "-";
        return [
          {
            id: entry.id,
            invoice: entry.invoice_number,
            createdAt: entry.created_at,
            subtotal: entry.subtotal ?? 0,
            discount: entry.discount ?? 0,
            total: entry.total ?? 0,
            soldBy: ownerName,
          },
        ];
      }

      if (selectedUser && entry.employee_id !== selectedUser) {
        return [];
      }

      return [
        {
          id: entry.id,
          invoice: entry.invoice_number,
          createdAt: entry.created_at,
          subtotal: entry.amount ?? 0,
          discount: 0,
          total: entry.amount ?? 0,
          soldBy: userNameLookup.get(entry.employee_id) ?? "-",
        },
      ];
    })
    .filter((row) => {
      if (!logQuery) {
        return true;
      }
      return (
        row.invoice?.toLowerCase().includes(logQuery) ||
        row.id?.toLowerCase().includes(logQuery) ||
        row.soldBy?.toLowerCase().includes(logQuery)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 50);

  const summaryValue = searchParams?.summary ?? "";
  const logValue = searchParams?.log ?? "";

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

  return (
    <div className="space-y-8">
      <section className="glass-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">User Sales Summary</h2>
            <p className="text-sm text-white/60">
              Total sales amount and calculated commission per user since their last summary reset.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={csvDataUri} download="sales-summary.csv" className="btn-ghost">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            {session.user.role === "owner" ? (
              <form action={resetAllSales}>
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
                <th className="px-4 py-3 font-medium text-left">Total Sales</th>
                <th className="px-4 py-3 font-medium text-left">Commission</th>
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
                      <td className="px-4 py-3 text-white/60">{formatRole(row.role)}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {formatter.format(row.totalSales)}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {formatter.format(row.commissionTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:text-white disabled:cursor-not-allowed"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset
                        </button>
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
          <span>Grand Total Sales: {formatter.format(grandTotalSales)}</span>
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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
                <th className="px-4 py-3 font-medium text-left">Details</th>
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
                    <td className="px-4 py-3 text-white/60">—</td>
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

















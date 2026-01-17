import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Coins, Percent, UsersRound } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";
import { brandCurrency, commissionUsesProfit } from "@/config/brand-overrides";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [
    salesResult,
    inventoryResult,
    employeeSalesResult,
    commissionRatesResult,
    usersResult,
  ] = await Promise.all([
    supabase
      .from("sales_orders")
      .select("id, owner_id, invoice_number, subtotal, total, profit_total, created_at")
      .eq("archived" as never, false)
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_items")
      .select("id, name, category, price, updated_at")
      .eq("owner_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("employee_sales")
      .select("id, employee_id, amount, created_at")
      .eq("archived" as never, false)
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("commission_rates")
      .select("role, rate")
      .order("role", { ascending: true }),
    supabase
      .from("app_users")
      .select("id, username, role, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const sales =
    (salesResult.data ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const inventory =
    (inventoryResult.data ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];
  const employeeSales =
    (employeeSalesResult.data ?? []) as Database["public"]["Tables"]["employee_sales"]["Row"][];
  const commissionRates =
    (commissionRatesResult.data ??
      []) as Database["public"]["Tables"]["commission_rates"]["Row"][];
  const team =
    (usersResult.data ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

  let salesOrderItems: Database["public"]["Tables"]["sales_order_items"]["Row"][] = [];
  const saleIds = sales.map((sale) => sale.id).filter(Boolean);
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

  const registerRevenue = sum(sales.map((sale) => sale.total ?? 0));
  const employeeRevenue = sum(employeeSales.map((entry) => entry.amount ?? 0));
  const totalRevenue = registerRevenue + employeeRevenue;
  const commissionMap = new Map<string, number>();
  commissionRates.forEach((rate) => {
    if (!rate.role) {
      return;
    }
    commissionMap.set(rate.role, rate.rate ?? 0);
  });

  const userRoleLookup = new Map(team.map((member) => [member.id, member.role ?? ""]));
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

  sales.forEach((sale) => {
    const ownerId = sale.owner_id;
    if (!ownerId) {
      return;
    }

    const role = userRoleLookup.get(ownerId) ?? "";
    const roleRate = commissionMap.get(role) ?? 0;
    const discountMultiplier =
      sale.subtotal && sale.subtotal > 0
        ? Math.max(Math.min((sale.total ?? 0) / sale.subtotal, 1), 0)
        : 0;

    const lineItems = itemsByOrderId.get(sale.id) ?? [];
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

    const fallbackBase = commissionUsesProfit ? sale.profit_total ?? 0 : sale.total ?? 0;
    addBase(ownerId, fallbackBase);
    addCommission(ownerId, fallbackBase * roleRate);
  });

  employeeSales.forEach((entry) => {
    if (!entry.employee_id) {
      return;
    }
    const role = userRoleLookup.get(entry.employee_id) ?? "";
    const roleRate = commissionMap.get(role) ?? 0;
    const base = entry.amount ?? 0;
    addBase(entry.employee_id, base);
    addCommission(entry.employee_id, base * roleRate);
  });

  const totalCommission = team.reduce(
    (acc, member) => acc + (commissionTotalByUser.get(member.id) ?? 0),
    0,
  );

  const latestSales = sales.slice(0, 6);
  const formatter = currencyFormatter(brandCurrency);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="glass-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-transparent opacity-70" />
          <div className="relative flex h-full flex-col gap-3">
            <span className="muted-label">Revenue</span>
            <div className="flex items-start justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight text-white">
                {formatter.format(totalRevenue)}
              </p>
              <span className="rounded-2xl bg-white/10 p-2">
                <Coins className="h-7 w-7 text-brand-primary" />
              </span>
            </div>
            <p className="text-sm text-white/60">
              {latestSales.length
                ? `Last sale ${formatDistanceToNow(new Date(latestSales[0]!.created_at), {
                    addSuffix: true,
                  })}`
                : "No sales yet."}
            </p>
          </div>
        </div>
        <div className="glass-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/30 via-transparent to-transparent opacity-80" />
          <div className="relative flex h-full flex-col gap-3">
            <span className="muted-label">Commission</span>
            <div className="flex items-start justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight text-white">
                {formatter.format(totalCommission)}
              </p>
              <span className="rounded-2xl bg-brand-primary/20 p-2">
                <Percent className="h-7 w-7 text-brand-primary" />
              </span>
            </div>
            <p className="text-sm text-white/60">Based on current roles.</p>
          </div>
        </div>
        <div className="glass-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent opacity-70" />
          <div className="relative flex h-full flex-col gap-3">
            <span className="muted-label">Team</span>
            <div className="flex items-start justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight text-white">
                {team.length}
              </p>
              <span className="rounded-2xl bg-white/10 p-2">
                <UsersRound className="h-7 w-7 text-white/80" />
              </span>
            </div>
            <p className="text-sm text-white/60">Admins included.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Latest Sales</h2>
            <span className="muted-label">Recent 6</span>
          </div>
          <ul className="space-y-3 text-sm">
            {latestSales.length ? (
              latestSales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {sale.invoice_number ?? sale.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatDistanceToNow(new Date(sale.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatter.format(sale.total ?? 0)}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
                No sales recorded yet. Complete a sale from the register to see
                activity here.
              </li>
            )}
          </ul>
        </div>

        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Recent Catalogue Updates
            </h2>
            <span className="muted-label">Newest first</span>
          </div>
          <ul className="space-y-3 text-sm">
            {inventory.length ? (
              inventory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/45">{item.category}</p>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p className="text-sm font-semibold text-white">
                      {formatter.format(item.price ?? 0)}
                    </p>
                    <p>
                      {formatDistanceToNow(new Date(item.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
                Add your first catalogue item from the catalogue tab.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

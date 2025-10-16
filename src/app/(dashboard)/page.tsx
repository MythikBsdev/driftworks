import Link from "next/link";
import { redirect } from "next/navigation";
import { subDays } from "date-fns";
import { AlertTriangle, BarChart2, CalendarClock, CircleDollarSign } from "lucide-react";

import StatCard from "@/components/dashboard/stat-card";
import InvoiceStatusBadge from "@/components/invoices/status-badge";
import InvoiceTable, { type InvoiceRow } from "@/components/invoices/invoice-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";

const DashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invoiceRows } = await supabase
    .from("invoices")
    .select(
      `id, created_at, status, total, currency, due_date, issue_date, invoice_number,
       client:clients(name, company)`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, company, email, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const invoices = invoiceRows ?? [];
  const clients = clientRows ?? [];
  const defaultCurrency = invoices[0]?.currency ?? "USD";
  const formatter = currencyFormatter(defaultCurrency);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const sentInvoices = invoices.filter((invoice) => invoice.status === "sent");
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue");
  const draftInvoices = invoices.filter((invoice) => invoice.status === "draft");

  const totalCollected = sum(paidInvoices.map((invoice) => invoice.total ?? 0));
  const outstandingBalance = sum([...sentInvoices, ...overdueInvoices].map((invoice) => invoice.total ?? 0));
  const overdueBalance = sum(overdueInvoices.map((invoice) => invoice.total ?? 0));

  const today = new Date();
  const last30 = subDays(today, 30);
  const prev30 = subDays(last30, 30);

  const periodRevenue = paidInvoices.filter((invoice) => new Date(invoice.created_at) >= last30);
  const prevPeriodRevenue = paidInvoices.filter((invoice) => {
    const created = new Date(invoice.created_at);
    return created < last30 && created >= prev30;
  });

  const periodTotal = sum(periodRevenue.map((invoice) => invoice.total ?? 0));
  const prevPeriodTotal = sum(prevPeriodRevenue.map((invoice) => invoice.total ?? 0));
  const deltaPercentage = prevPeriodTotal
    ? (((periodTotal - prevPeriodTotal) / prevPeriodTotal) * 100).toFixed(1)
    : null;

  const recentInvoices: InvoiceRow[] = invoices.slice(0, 6).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    client: invoice.client?.name ?? "Unnamed client",
    dueDate: invoice.due_date,
    total: invoice.total ?? 0,
    currency: invoice.currency ?? defaultCurrency,
    status: invoice.status as InvoiceStatus,
  }));

  const upcomingInvoices = [...sentInvoices, ...overdueInvoices]
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const clientSummary = clients.map((client) => {
    const clientInvoices = invoices.filter((invoice) => invoice.client?.name === client.name);
    const totalBilled = sum(clientInvoices.map((invoice) => invoice.total ?? 0));
    const activeInvoices = clientInvoices.filter((invoice) => invoice.status !== "paid").length;

    return {
      id: client.id,
      name: client.name,
      company: client.company,
      totalBilled,
      activeInvoices,
    };
  });

  const activity = invoices.slice(0, 5).map((invoice) => ({
    id: invoice.id,
    title: `${invoice.invoice_number} for ${invoice.client?.name ?? "Unknown"}`,
    timestamp: new Date(invoice.created_at).toLocaleString(),
    status: invoice.status as InvoiceStatus,
  }));

  return (
    <div className="space-y-10">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Collected"
          value={formatter.format(totalCollected)}
          delta={deltaPercentage ? `${deltaPercentage}%` : undefined}
          trend={deltaPercentage && Number(deltaPercentage) < 0 ? "down" : "up"}
          icon={<CircleDollarSign className="h-6 w-6" />}
          footer="Total payments marked as paid"
        />
        <StatCard
          title="Outstanding"
          value={formatter.format(outstandingBalance)}
          delta={`${sentInvoices.length + overdueInvoices.length} open`}
          trend="up"
          icon={<CalendarClock className="h-6 w-6" />}
          footer="Invoices awaiting payment"
        />
        <StatCard
          title="Overdue"
          value={formatter.format(overdueBalance)}
          delta={`${overdueInvoices.length} invoices`}
          trend={overdueInvoices.length ? "down" : "up"}
          icon={<AlertTriangle className="h-6 w-6" />}
          footer="Follow up with clients soon"
        />
        <StatCard
          title="Drafts"
          value={`${draftInvoices.length}`}
          delta={draftInvoices.length ? `${draftInvoices.length} in progress` : undefined}
          trend="up"
          icon={<BarChart2 className="h-6 w-6" />}
          footer="Finish drafts to send invoices"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent invoices</h2>
            <Link href="/invoices" className="text-sm text-white/60 hover:text-white">
              View all
            </Link>
          </div>
          <InvoiceTable invoices={recentInvoices} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming payments</h2>
            <span className="text-sm text-white/40">Next 30 days</span>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-5">
            {upcomingInvoices.length ? (
              upcomingInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{invoice.invoice_number}</p>
                      <p className="text-xs text-white/50">{invoice.client?.name ?? "Client"}</p>
                    </div>
                    <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                    <span>
                      {new Date(invoice.due_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>{currencyFormatter(invoice.currency ?? defaultCurrency).format(invoice.total ?? 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/50">
                No upcoming payments due in the next 30 days.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Client snapshot</h2>
            <Link href="/clients" className="text-sm text-white/60 hover:text-white">
              Manage clients
            </Link>
          </div>
          <ul className="space-y-3">
            {clientSummary.length ? (
              clientSummary.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{client.name}</p>
                    <p className="text-xs text-white/45">{client.company ?? "Independent"}</p>
                  </div>
                  <div className="text-right text-xs text-white/60">
                    <p className="text-sm font-semibold text-white">
                      {formatter.format(client.totalBilled)}
                    </p>
                    <p>{client.activeInvoices} active</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
                Add clients to start tracking invoices and activity.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <ul className="space-y-3 text-sm">
            {activity.length ? (
              activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-primary" />
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.timestamp}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
                Activity will appear here once invoices are created.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
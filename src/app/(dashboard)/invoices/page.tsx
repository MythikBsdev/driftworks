import { redirect } from "next/navigation";

import InvoiceList, { type InvoiceWithClient } from "@/components/invoices/invoice-list";
import InvoiceStatusBadge from "@/components/invoices/status-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";

const InvoicesPage = async () => {
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
      `id, invoice_number, status, total, currency, issue_date, due_date, created_at,
       client:clients(name, company)`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const invoices: InvoiceWithClient[] = (invoiceRows ?? []).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    status: invoice.status as InvoiceStatus,
    clientName: invoice.client?.name ?? "Unnamed client",
    company: invoice.client?.company,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    total: invoice.total ?? 0,
    currency: invoice.currency ?? "USD",
  }));

  const defaultCurrency = invoices[0]?.currency ?? "USD";
  const formatter = currencyFormatter(defaultCurrency);

  const totals = {
    draft: sum(invoices.filter((invoice) => invoice.status === "draft").map((invoice) => invoice.total)),
    sent: sum(invoices.filter((invoice) => invoice.status === "sent").map((invoice) => invoice.total)),
    paid: sum(invoices.filter((invoice) => invoice.status === "paid").map((invoice) => invoice.total)),
    overdue: sum(invoices.filter((invoice) => invoice.status === "overdue").map((invoice) => invoice.total)),
  };

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-8 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Invoices</p>
            <h1 className="text-3xl font-semibold text-white">Invoice management</h1>
            <p className="text-sm text-white/50">{invoices.length} total invoices on record.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {([
            { label: "Draft", status: "draft" },
            { label: "Sent", status: "sent" },
            { label: "Paid", status: "paid" },
            { label: "Overdue", status: "overdue" },
          ] as const).map((item) => (
            <div key={item.status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">{item.label}</p>
                  <p className="mt-2 text-sm text-white/60">
                    {invoices.filter((invoice) => invoice.status === item.status).length} invoices
                  </p>
                </div>
                <InvoiceStatusBadge status={item.status} />
              </div>
              <p className="mt-3 text-xl font-semibold text-white">{formatter.format(totals[item.status])}</p>
            </div>
          ))}
        </div>
      </div>

      <InvoiceList invoices={invoices} />
    </div>
  );
};

export default InvoicesPage;
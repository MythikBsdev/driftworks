import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, DollarSign, Mail, MapPin, Phone } from "lucide-react";

import InvoiceStatusBadge from "@/components/invoices/status-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, InvoiceStatus } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

const ClientDetailPage = async ({ params }: { params: { id: string } }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: client }, { data: invoices }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company, email, phone, address, notes, created_at")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, currency, due_date, issue_date")
      .eq("client_id", params.id)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const clientRecord =
    client as Database["public"]["Tables"]["clients"]["Row"] | null;

  if (!clientRecord) {
    notFound();
  }

  const clientInvoices =
    (invoices ?? []) as Database["public"]["Tables"]["invoices"]["Row"][];
  const defaultCurrency = clientInvoices[0]?.currency ?? "USD";
  const formatter = currencyFormatter(defaultCurrency);
  const outstanding = clientInvoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((acc, invoice) => acc + (invoice.total ?? 0), 0);
  const lastInvoiceDate = clientInvoices[0]?.issue_date;

  return (
    <div className="space-y-8">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Client</p>
          <h1 className="text-3xl font-semibold text-white">{clientRecord.name}</h1>
          <p className="mt-2 text-sm text-white/50">{clientRecord.company ?? "Independent"}</p>
          <div className="mt-6 grid gap-3 text-sm text-white/70">
            {clientRecord.email ? (
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {clientRecord.email}
              </span>
            ) : null}
            {clientRecord.phone ? (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {clientRecord.phone}
              </span>
            ) : null}
            {clientRecord.address ? (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {clientRecord.address}
              </span>
            ) : null}
            <span className="flex items-center gap-2 text-white/60">
              <Calendar className="h-4 w-4" />{" "}
              Joined {new Date(clientRecord.created_at ?? Date.now()).toLocaleDateString()}
            </span>
          </div>
          {clientRecord.notes ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <h2 className="text-xs uppercase tracking-[0.35em] text-white/50">Notes</h2>
              <p className="mt-2 whitespace-pre-line">{clientRecord.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#111]/85 p-6">
            <h2 className="text-lg font-semibold text-white">Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-white/60">
              <div className="flex items-center justify-between">
                <span>Total invoices</span>
                <span className="font-semibold text-white">{clientInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outstanding</span>
                <span className="flex items-center gap-1 font-semibold text-white">
                  <DollarSign className="h-4 w-4" />
                  {formatter.format(outstanding)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last invoice</span>
                <span>{lastInvoiceDate ? new Date(lastInvoiceDate).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Invoices</h2>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f]/85">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Invoice</span>
            <span>Issued</span>
            <span>Due</span>
            <span className="text-right">Total</span>
          </div>
          <ul className="divide-y divide-white/5 text-sm">
            {clientInvoices.length ? (
              clientInvoices.map((invoice) => (
                <li key={invoice.id} className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] items-center gap-4 px-6 py-4">
                  <div className="space-y-1">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-white hover:text-brand-accent">
                      {invoice.invoice_number}
                    </Link>
                    <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                  </div>
                  <span className="text-white/60">
                    {new Date(invoice.issue_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-white/60">
                    {new Date(invoice.due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-right font-semibold text-white">
                    {currencyFormatter(invoice.currency ?? defaultCurrency).format(invoice.total ?? 0)}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-6 py-10 text-center text-sm text-white/60">
                No invoices on record for this client yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;

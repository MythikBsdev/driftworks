import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";

import InvoiceStatusBadge from "@/components/invoices/status-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

const InvoiceDetailPage = async ({ params }: { params: { id: string } }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      `id, invoice_number, status, total, subtotal, tax, currency, notes, issue_date, due_date,
       client:clients(id, name, company, email, phone, address),
       items:invoice_items(description, quantity, unit_price, amount)`
    )
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!invoice) {
    redirect("/invoices");
  }

  const formatter = currencyFormatter(invoice.currency ?? "USD");

  return (
    <div className="space-y-8">
      <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Invoice</p>
            <h1 className="text-3xl font-semibold text-white">{invoice.invoice_number}</h1>
            <p className="mt-2 text-sm text-white/50">{invoice.client?.name ?? "Unnamed client"}</p>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/70"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm text-white/70">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
                  <tr>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Unit price</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoice.items?.length ? (
                    invoice.items.map((item, index) => (
                      <tr key={`${item.description}-${index}`}>
                        <td className="px-4 py-3 text-white">{item.description}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatter.format(item.unit_price ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-white">{formatter.format(item.amount ?? 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-white/60">
                        No line items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
                <FileText className="h-4 w-4" /> Summary
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Issue date</span>
                  <span className="text-white/50">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Due date</span>
                  <span className="text-white/50">{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatter.format(invoice.subtotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span>{formatter.format(invoice.tax ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatter.format(invoice.total ?? 0)}</span>
                </div>
              </div>
            </div>
            {invoice.notes ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                <h2 className="text-xs uppercase tracking-[0.3em] text-white/40">Notes</h2>
                <p className="mt-2 whitespace-pre-line">{invoice.notes}</p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <h2 className="text-xs uppercase tracking-[0.3em] text-white/40">Bill to</h2>
              <p className="mt-2 text-white">{invoice.client?.name}</p>
              <p>{invoice.client?.company}</p>
              <p>{invoice.client?.email}</p>
              <p>{invoice.client?.phone}</p>
              <p>{invoice.client?.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;

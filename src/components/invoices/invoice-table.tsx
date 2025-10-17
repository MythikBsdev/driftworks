import Link from "next/link";

import type { InvoiceStatus } from "@/lib/supabase/types";
import { cn, currencyFormatter } from "@/lib/utils";

import InvoiceStatusBadge from "./status-badge";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  client: string;
  dueDate: string;
  total: number;
  currency: string;
  status: InvoiceStatus;
};

const InvoiceTable = ({ invoices }: { invoices: InvoiceRow[] }) => {
  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center">
        <p className="text-lg font-medium text-white">No invoices yet</p>
        <p className="text-sm text-white/50">
          Start invoicing clients to see them appear here.
        </p>
        <Link
          href="/invoices/new"
          className="mt-4 rounded-xl border border-brand-primary/60 bg-brand-primary/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
        >
          Create invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]/90 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-white/10 px-6 py-4 muted-label">
        <span>Invoice</span>
        <span>Client</span>
        <span>Due date</span>
        <span className="text-right">Total</span>
      </div>
      <ul className="divide-y divide-white/5 text-sm">
        {invoices.map((invoice) => {
          const formatter = currencyFormatter(invoice.currency);
          return (
            <li key={invoice.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4">
              <div className="space-y-1">
                <Link href={`/invoices/${invoice.id}`} className="font-medium text-white hover:text-brand-accent">
                  {invoice.invoiceNumber}
                </Link>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="flex items-center text-white/70">{invoice.client}</div>
              <div className={cn("flex items-center", invoice.status === "overdue" ? "text-red-300" : "text-white/60")}> 
                {new Date(invoice.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <div className="flex items-center justify-end text-white">
                {formatter.format(invoice.total)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export type { InvoiceRow };
export default InvoiceTable;

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";

import type { InvoiceStatus } from "@/lib/supabase/types";
import { cn, currencyFormatter } from "@/lib/utils";
import InvoiceStatusBadge from "./status-badge";

type InvoiceWithClient = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  company?: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
};

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const InvoiceList = ({ invoices }: { invoices: InvoiceWithClient[] }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesQuery = [invoice.invoiceNumber, invoice.clientName, invoice.company]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query.toLowerCase()));

      const matchesStatus = status === "all" ? true : invoice.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition",
                status === filter.value
                  ? "border-brand-primary/70 bg-brand-primary/20 text-brand-accent"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-brand-primary/40 hover:text-white",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Filter className="h-4 w-4" />
          {filtered.length} showing
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoices or clients"
            className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-3 py-2 text-sm text-white shadow-inner outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f]/90 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
        <div className="grid grid-cols-[1.4fr_1.2fr_1fr_1fr_0.7fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.28em] text-white/40">
          <span>Invoice</span>
          <span>Client</span>
          <span>Issued</span>
          <span>Due</span>
          <span className="text-right">Total</span>
        </div>
        <ul className="divide-y divide-white/5 text-sm">
          {filtered.map((invoice) => {
            const formatter = currencyFormatter(invoice.currency);
            return (
              <li key={invoice.id} className="grid grid-cols-[1.4fr_1.2fr_1fr_1fr_0.7fr] items-center gap-4 px-6 py-4">
                <div className="space-y-1">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-white hover:text-brand-accent">
                    {invoice.invoiceNumber}
                  </Link>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div>
                  <p className="font-medium text-white">{invoice.clientName}</p>
                  <p className="text-xs text-white/50">{invoice.company ?? "Independent"}</p>
                </div>
                <p className="text-white/60">
                  {new Date(invoice.issueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-white/60">
                  {new Date(invoice.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-right font-semibold text-white">{formatter.format(invoice.total)}</p>
              </li>
            );
          })}
        </ul>
        {!filtered.length ? (
          <div className="px-6 py-10 text-center text-sm text-white/50">
            No invoices match your filters yet.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export type { InvoiceWithClient };
export default InvoiceList;
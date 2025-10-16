"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { createInvoice, type InvoiceFormState } from "@/app/(dashboard)/actions";
import type { InvoiceStatus } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

type ClientOption = {
  id: string;
  name: string;
  company?: string | null;
};

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type NewInvoiceFormProps = {
  clients: ClientOption[];
  suggestedInvoiceNumber: string;
  currency?: string;
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-brand-primary/60 bg-brand-primary/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Saving invoice..." : "Save invoice"}
    </button>
  );
};

const NewInvoiceForm = ({ clients, suggestedInvoiceNumber, currency = "USD" }: NewInvoiceFormProps) => {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [state, formAction] = useFormState<InvoiceFormState, FormData>(createInvoice, {
    status: "idle",
  });

  useEffect(() => {
    if (state?.status === "success") {
      router.push("/invoices");
    }
  }, [router, state?.status]);

  const subtotal = useMemo(() => sum(items.map((item) => item.quantity * item.unitPrice)), [items]);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const formatter = currencyFormatter(currency);

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== id)));
  };

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="currency" value={currency} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        )}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="invoice_number">
            Invoice number
          </label>
          <input
            id="invoice_number"
            name="invoice_number"
            defaultValue={suggestedInvoiceNumber}
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="client_id">
            Client
          </label>
          <select
            id="client_id"
            name="client_id"
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id} className="bg-[#121212]">
                {client.name} {client.company ? `— ${client.company}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="issue_date">
            Issue date
          </label>
          <input
            id="issue_date"
            name="issue_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="due_date">
            Due date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="draft"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#121212]">
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/80" htmlFor="notes">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Payment terms, bank details, or custom message"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Line items</h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-brand-primary hover:text-brand-accent"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/40">Description</label>
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.id, { description: event.target.value })}
                  placeholder={`Item ${index + 1}`}
                  className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/40">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/40">Unit price</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  {formatter.format(item.quantity * item.unitPrice)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:border-red-500/60 hover:bg-red-500/20 disabled:opacity-40"
                  disabled={items.length === 1}
                  aria-label="Remove line item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-white/60">
          <p>Subtotal: {formatter.format(subtotal)}</p>
          <p>Tax (15%): {formatter.format(tax)}</p>
          <p className="text-base font-semibold text-white">Total: {formatter.format(total)}</p>
        </div>
        <div className="w-full max-w-sm">
          <SubmitButton />
          {state?.status === "error" ? (
            <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {state.message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
};

export default NewInvoiceForm;
"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  addEmployeeSale,
  type EmployeeSaleFormState,
} from "@/app/(dashboard)/employee-sales/actions";
import {
  brandCurrency,
  filterHighlightShadow,
  formatCategoryLabel,
  inventoryFilters,
} from "@/config/brand-overrides";
import { cn, currencyFormatter } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type EmployeeRow = Pick<Database["public"]["Tables"]["app_users"]["Row"], "id" | "username" | "full_name">;
type CatalogRow = Pick<
  Database["public"]["Tables"]["inventory_items"]["Row"],
  "id" | "name" | "category" | "price" | "profit" | "commission_flat_override"
>;
type DiscountRow = Pick<Database["public"]["Tables"]["discounts"]["Row"], "id" | "name" | "percentage">;

type Props = {
  employees: EmployeeRow[];
  catalogItems: CatalogRow[];
  discounts: DiscountRow[];
};

const initialState: EmployeeSaleFormState = { status: "idle" };
const FILTERS = inventoryFilters;
const DEFAULT_FILTER = FILTERS[FILTERS.length - 1]?.value ?? "All";

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Processing..." : "Add Sale"}
    </button>
  );
};

const EmployeeSaleBoard = ({ employees, catalogItems, discounts }: Props) => {
  const [filter, setFilter] = useState<string>(DEFAULT_FILTER);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<
    Array<{
      itemId: string;
      name: string;
      category: string;
      price: number;
      profit: number;
      commissionFlatOverride: number | null;
      quantity: number;
    }>
  >([]);

  const [state, formAction] = useFormState(addEmployeeSale, initialState);

  useEffect(() => {
    if (state.status === "success") {
      setCart([]);
      setInvoiceNumber("");
      setEmployeeId("");
      setSelectedDiscountId(null);
      setNotes("");
      setFilter(DEFAULT_FILTER);
    }
  }, [state.status]);

  const filteredItems = useMemo(() => {
    if (filter === "All") {
      return catalogItems;
    }
    return catalogItems.filter(
      (item) => (item.category ?? "").toLowerCase() === filter.toLowerCase(),
    );
  }, [filter, catalogItems]);

  const formatter = currencyFormatter(brandCurrency);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const selectedDiscount = selectedDiscountId
    ? discounts.find((discount) => discount.id === selectedDiscountId) ?? null
    : null;
  const discountAmount = selectedDiscount
    ? Math.round((subtotal * (selectedDiscount.percentage ?? 0) + Number.EPSILON) * 100) /
      100
    : 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const addToCart = (item: CatalogRow) => {
    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        {
          itemId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          profit: item.profit ?? 0,
          commissionFlatOverride: item.commission_flat_override ?? null,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((current) => current.filter((line) => line.itemId !== itemId));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Select Items</h2>
          <button
            type="button"
            onClick={() => setCart([])}
            className="text-xs uppercase tracking-[0.35em] text-white/40 transition hover:text-white/70"
          >
            Clear Cart
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.35em] text-white/40">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-full border border-white/10 px-3 py-1 text-xs transition backdrop-blur",
                filter === option.value
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
              style={filter === option.value ? { boxShadow: filterHighlightShadow } : undefined}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                className="flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-white/20 hover:bg-white/10"
              >
                <span className="text-sm font-semibold text-white">
                  {item.name}
                </span>
                <span className="muted-label">
                  {formatCategoryLabel(item.category)}
                </span>
                <span className="text-sm text-white/70">
                  {formatter.format(item.price)}
                </span>
                {item.commission_flat_override != null ? (
                  <span className="text-[11px] text-amber-200/80">
                    Fixed commission {formatter.format(item.commission_flat_override)}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/50">
              No items available in this category.
            </p>
          )}
        </div>
      </div>

      <form action={formAction} className="glass-card space-y-5">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Employee Sale</h2>
            <p className="text-sm text-white/60">
              Build a cart and assign it to an employee.
            </p>
          </div>
          <label className="muted-label" htmlFor="employeeId">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="select-dark w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="" disabled>
              Select an employee
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name ?? employee.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="muted-label" htmlFor="invoiceNumber">
            Invoice Number
          </label>
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            name="invoiceNumber"
            required
            placeholder="Enter invoice number (e.g., #EMP001)"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <input type="hidden" name="items" value={JSON.stringify(cart)} />

        <div className="space-y-2">
          <label className="muted-label" htmlFor="discountId">
            Discount
          </label>
          <select
            id="discountId"
            name="discountId"
            value={selectedDiscountId ?? ""}
            onChange={(event) =>
              setSelectedDiscountId(event.target.value ? event.target.value : null)
            }
            className="select-dark w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="">No discount</option>
            {discounts.map((discount) => (
              <option key={discount.id} value={discount.id}>
                {discount.name} ({(discount.percentage * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cart.length ? (
                cart.map((line) => (
                  <tr key={line.itemId} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">{line.name}</td>
                    <td className="px-4 py-3">{line.quantity}</td>
                    <td className="px-4 py-3">
                      {formatter.format(line.price)}
                    </td>
                    <td className="px-4 py-3">
                      {formatter.format(line.price * line.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.itemId)}
                        className="text-xs uppercase tracking-[0.3em] text-red-400 transition hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-white/50"
                    colSpan={5}
                  >
                    Cart is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatter.format(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Discount</span>
            <span>-{formatter.format(discountAmount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg font-semibold text-white">
            <span>Total</span>
            <span>{formatter.format(total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="muted-label" htmlFor="notes">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Additional details..."
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        {state.status === "error" ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Employee sale added.
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  );
};

export default EmployeeSaleBoard;

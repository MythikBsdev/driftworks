"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  completeSale,
  type CompleteSaleState,
} from "@/app/(dashboard)/sales-register/actions";
import { cn, currencyFormatter } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type Discount = {
  id: string;
  name: string;
  percentage: number;
};

type SalesRegisterBoardProps = {
  items: InventoryItem[];
  discounts: Discount[];
};

const initialState: CompleteSaleState = { status: "idle" };

const CompleteSaleButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Processing..." : "Complete Sale"}
    </button>
  );
};

const FILTERS = ["Normal", "Employee", "LEO", "All"];

const SalesRegisterBoard = ({ items, discounts }: SalesRegisterBoardProps) => {
  const [filter, setFilter] = useState<string>("All");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(
    null,
  );
  const [cart, setCart] = useState<
    Array<{ itemId: string; name: string; price: number; quantity: number }>
  >([]);

  const [state, formAction] = useFormState(completeSale, initialState);

  useEffect(() => {
    if (state.status === "success") {
      setCart([]);
      setInvoiceNumber("");
      setSelectedDiscountId(null);
    }
  }, [state.status]);

  const filteredItems = useMemo(() => {
    if (filter === "All") {
      return items;
    }
    return items.filter(
      (item) => item.category.toLowerCase() === filter.toLowerCase(),
    );
  }, [filter, items]);

  const formatter = currencyFormatter("GBP");
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const selectedDiscount = selectedDiscountId
    ? discounts.find((discount) => discount.id === selectedDiscountId) ?? null
    : null;
  const discountAmount = selectedDiscount
    ? subtotal * (selectedDiscount.percentage ?? 0)
    : 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const addToCart = (item: InventoryItem) => {
    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        { itemId: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((current) => current.filter((line) => line.itemId !== itemId));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6">
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
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-full border border-white/10 px-3 py-1 text-xs transition",
                filter === option
                  ? "bg-red-600 text-white shadow-[0_10px_25px_rgba(255,22,22,0.35)]"
                  : "text-white/60 hover:border-red-500/60 hover:text-white",
              )}
            >
              {option}
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
                className="flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-brand-primary/60 hover:bg-brand-primary/10"
              >
                <span className="text-sm font-semibold text-white">
                  {item.name}
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                  {item.category}
                </span>
                <span className="text-sm text-white/70">
                  {formatter.format(item.price)}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/50">
              No items available in this category.
            </p>
          )}
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6"
      >
        <div>
          <h2 className="text-xl font-semibold text-white">Current Sale</h2>
          <p className="text-xs text-white/50">Invoice Number</p>
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            name="invoiceNumber"
            required
            placeholder="Enter invoice number (e.g., #DW001)"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <input type="hidden" name="items" value={JSON.stringify(cart)} />
        <div className="space-y-2">
          <label
            className="text-xs uppercase tracking-[0.3em] text-white/40"
            htmlFor="discountId"
          >
            Discount
          </label>
          <select
            id="discountId"
            name="discountId"
            value={selectedDiscountId ?? ""}
            onChange={(event) =>
              setSelectedDiscountId(
                event.target.value ? event.target.value : null,
              )
            }
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="">No discount</option>
            {discounts.map((discount) => (
              <option key={discount.id} value={discount.id}>
                {discount.name} ({(discount.percentage * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
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

        {state.status === "error" ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Sale completed successfully.
          </p>
        ) : null}

        <CompleteSaleButton />
      </form>
    </div>
  );
};

export default SalesRegisterBoard;



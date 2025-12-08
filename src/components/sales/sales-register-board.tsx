"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  completeSale,
  type CompleteSaleState,
} from "@/app/(dashboard)/sales-register/actions";
import { brand } from "@/config/brands";
import {
  brandCurrency,
  filterHighlightShadow,
  formatCategoryLabel,
  inventoryFilters,
} from "@/config/brand-overrides";
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
type LoyaltyAction = "none" | "stamp" | "double" | "redeem";
type LoyaltyStatus = {
  cid: string;
  stampCount: number;
  ready: boolean;
};

const CompleteSaleButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Processing..." : "Complete Sale"}
    </button>
  );
};

const FILTERS = inventoryFilters;
const DEFAULT_FILTER = FILTERS[FILTERS.length - 1]?.value ?? "All";
const LOYALTY_ENABLED = brand.slug !== "lscustoms";
const LOYALTY_OPTIONS: { value: LoyaltyAction; label: string }[] = [
  { value: "none", label: "No Loyalty Action" },
  { value: "stamp", label: "Add Loyalty Stamp" },
  { value: "double", label: "Add Double Stamp Tuesday (2 stamps)" },
  { value: "redeem", label: "Redeem Free 10th Sale" },
];

const SalesRegisterBoard = ({ items, discounts }: SalesRegisterBoardProps) => {
  const [filter, setFilter] = useState<string>(DEFAULT_FILTER);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [cid, setCid] = useState("");
  const [loyaltyAction, setLoyaltyAction] = useState<LoyaltyAction>("none");
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
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
      setCid("");
      setLoyaltyAction("none");
      setLoyaltyStatus(null);
      setLoyaltyMessage(null);
      setLoyaltyLoading(false);
      setSelectedDiscountId(null);
    }
  }, [state.status]);

  useEffect(() => {
    if (!LOYALTY_ENABLED) return;

    const normalizedCid = cid.trim().toUpperCase();
    if (!normalizedCid.length) {
      setLoyaltyStatus(null);
      setLoyaltyMessage(null);
      setLoyaltyLoading(false);
      setLoyaltyAction((current) => (current === "redeem" ? "none" : current));
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchLoyaltyStatus = async () => {
      setLoyaltyLoading(true);
      try {
        const response = await fetch(
          `/api/loyalty-status?cid=${encodeURIComponent(normalizedCid)}`,
          { cache: "no-store", signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error((await response.json())?.error ?? "Unable to load loyalty status");
        }

        const payload = (await response.json()) as LoyaltyStatus;
        if (cancelled) {
          return;
        }

        setLoyaltyStatus(payload);
        setLoyaltyMessage(
          payload.ready
            ? "This CID can redeem a free 10th sale."
            : `This CID currently has ${payload.stampCount}/9 stamps.`,
        );
        setLoyaltyAction((current) =>
          current === "redeem" && !payload.ready ? "none" : current,
        );
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") {
          return;
        }
        setLoyaltyStatus(null);
        setLoyaltyMessage("Unable to fetch loyalty info right now.");
        setLoyaltyAction((current) => (current === "redeem" ? "none" : current));
      } finally {
        if (!cancelled) {
          setLoyaltyLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchLoyaltyStatus, 400);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [cid]);

  const filteredItems = useMemo(() => {
    if (filter === "All") {
      return items;
    }
    return items.filter(
      (item) => (item.category ?? "").toLowerCase() === filter.toLowerCase(),
    );
  }, [filter, items]);

  const formatter = currencyFormatter(brandCurrency);
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const selectedDiscount = selectedDiscountId
    ? discounts.find((discount) => discount.id === selectedDiscountId) ?? null
    : null;
  const discountAmount = selectedDiscount
    ? Math.round(
        (subtotal * (selectedDiscount.percentage ?? 0) + Number.EPSILON) * 100,
      ) / 100
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
        <div>
          <h2 className="text-xl font-semibold text-white">Current Sale</h2>
          <p className="text-sm text-white/60">
            Generate an invoice number to track this sale.
          </p>
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            name="invoiceNumber"
            required
            placeholder="Enter invoice number (e.g., #DW001)"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <div className="space-y-4">
          {LOYALTY_ENABLED ? (
            <>
              <div className="space-y-2">
                <label className="muted-label" htmlFor="cid">
                  Customer ID (CID)
                </label>
                <input
                  id="cid"
                  name="cid"
                  value={cid}
                  onChange={(event) => setCid(event.target.value)}
                  placeholder="Enter CID (e.g., 1234)"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div className="space-y-2">
                <label className="muted-label" htmlFor="loyaltyAction">
                  Loyalty action
                </label>
                <select
                  id="loyaltyAction"
                  name="loyaltyAction"
                  value={loyaltyAction}
                  onChange={(event) =>
                    setLoyaltyAction(event.target.value as LoyaltyAction)
                  }
                  className="select-dark w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                  disabled={!cid.trim().length}
                >
                  {LOYALTY_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={
                        option.value === "redeem" && !loyaltyStatus?.ready
                      }
                    >
                      {option.value === "redeem" && !loyaltyStatus?.ready
                        ? "Redeem free 10th sale (requires 9 stamps)"
                        : option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/50">
                  {cid.trim().length === 0
                    ? "Track 9 paid visits to unlock a free 10th sale for that CID. Use Double Stamp Tuesday to apply two stamps during promos."
                    : loyaltyLoading
                      ? "Checking loyalty progress..."
                      : loyaltyMessage ?? "This CID does not have any loyalty stamps yet."}
                </p>
              </div>
            </>
          ) : (
            <input type="hidden" name="loyaltyAction" value="none" />
          )}
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
              setSelectedDiscountId(
                event.target.value ? event.target.value : null,
              )
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

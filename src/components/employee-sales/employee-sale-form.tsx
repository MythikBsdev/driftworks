"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  addEmployeeSale,
  type EmployeeSaleFormState,
} from "@/app/(dashboard)/employee-sales/actions";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

type EmployeeRow = Pick<Database["public"]["Tables"]["app_users"]["Row"], "id" | "username" | "full_name">;
type CatalogRow = Pick<Database["public"]["Tables"]["inventory_items"]["Row"], "id" | "name" | "price">;

type Props = {
  employees: EmployeeRow[];
  catalogItems: CatalogRow[];
  currency: string;
};

const initialState: EmployeeSaleFormState = { status: "idle" };

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Adding..." : "Add Sale"}
    </button>
  );
};

const EmployeeSaleForm = ({ employees, catalogItems, currency }: Props) => {
  const [state, formAction] = useFormState(addEmployeeSale, initialState);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [manualAmount, setManualAmount] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const formatter = useMemo(() => currencyFormatter(currency), [currency]);

  const totalFromCatalog = useMemo(() => {
    const priceLookup = new Map(catalogItems.map((item) => [item.id, item.price ?? 0]));
    return selectedCatalogIds.reduce(
      (sum, id) => sum + (priceLookup.get(id) ?? 0),
      0,
    );
  }, [catalogItems, selectedCatalogIds]);

  const amountValue = selectedCatalogIds.length
    ? totalFromCatalog.toFixed(2)
    : manualAmount;
  const isCatalogAmount = selectedCatalogIds.length > 0;

  const handleCatalogChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions).map((option) => option.value);
    setSelectedCatalogIds(options.filter(Boolean));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualAmount(event.target.value);
  };

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setSelectedCatalogIds([]);
      setManualAmount("");
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label className="muted-label" htmlFor="invoiceNumber">
          Invoice Number
        </label>
        <input
          id="invoiceNumber"
          name="invoiceNumber"
          required
          placeholder="e.g., #EMP001"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        />
      </div>

      <div className="space-y-2">
        <label className="muted-label" htmlFor="catalogItemIds">
          Catalogue Items
        </label>
        <select
          id="catalogItemIds"
          name="catalogItemIds"
          multiple
          value={selectedCatalogIds}
          onChange={handleCatalogChange}
          className="h-32 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        >
          {catalogItems.map((item) => (
            <option key={item.id} value={item.id} className="bg-[#101010]">
              {item.name} — {formatter.format(item.price ?? 0)}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/45">
          Select one or more catalogue items to auto-fill the amount.
        </p>
      </div>

      <div className="space-y-2">
        <label className="muted-label" htmlFor="amount">
          Amount ({currency})
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={amountValue}
          onChange={handleAmountChange}
          readOnly={isCatalogAmount}
          placeholder="e.g., 150.00"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40 read-only:cursor-not-allowed"
        />
        <p className="text-xs text-white/45">
          {isCatalogAmount
            ? "Amount is calculated from selected catalogue items."
            : "Enter a custom amount or select catalogue items to set it automatically."}
        </p>
      </div>

      <div className="space-y-2">
        <label className="muted-label" htmlFor="employeeId">
          Employee
        </label>
        <select
          id="employeeId"
          name="employeeId"
          required
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        >
          <option value="" disabled>
            Select an employee
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id} className="bg-[#101010]">
              {employee.full_name ?? employee.username}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="muted-label" htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
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
  );
};

export default EmployeeSaleForm;

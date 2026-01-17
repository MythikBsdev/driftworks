"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { payUser, type PayUserState } from "@/app/(dashboard)/sales/actions";
import { currencyFormatter } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PayUserButtonProps = {
  userId: string;
  displayName: string;
  commissionTotal: number;
  bankAccount?: string | null;
  currency: string;
};

const initialState: PayUserState = { status: "idle" };

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full justify-center bg-emerald-600 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Sending..." : "Confirm Payslip"}
    </button>
  );
};

export const PayUserButton = ({
  userId,
  displayName,
  commissionTotal,
  bankAccount,
  currency,
}: PayUserButtonProps) => {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(payUser, initialState);
  const formatter = useMemo(() => currencyFormatter(currency), [currency]);

  useEffect(() => {
    if (state.status === "error" || state.status === "success") {
      setOpen(true);
    }
  }, [state.status]);

  return (
    <details
      className="relative"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white [&::-webkit-details-marker]:hidden",
        )}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
      >
        Pay
      </summary>
      <form
        action={formAction}
        className="absolute right-0 z-50 mt-3 w-80 space-y-3 rounded-2xl border border-white/10 bg-black/90 p-4 text-left shadow-[0_25px_60px_-35px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      >
        <input type="hidden" name="userId" value={userId} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-white/60">Commission due</p>
          <p className="text-lg font-semibold text-white">{formatter.format(commissionTotal)}</p>
        </div>

        <div className="space-y-1">
          <label className="muted-label" htmlFor={`bonus-${userId}`}>
            Bonus (optional)
          </label>
          <input
            id={`bonus-${userId}`}
            name="bonus"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
          />
          <p className="text-xs text-white/50">
            Net total = commission + bonus. Sent to the linked payslip channel.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-white/70">
          <p className="font-semibold text-white">Bank account</p>
          <p className="truncate">{bankAccount ?? "Not provided"}</p>
        </div>

        {state.status === "error" ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-200">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </details>
  );
};

export default PayUserButton;

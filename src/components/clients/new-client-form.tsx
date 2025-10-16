"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { createClient, type ClientFormState } from "@/app/(dashboard)/actions";

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Saving..." : "Add client"}
    </button>
  );
};

const NewClientForm = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<ClientFormState, FormData>(createClient, {
    status: "idle",
  });

  useEffect(() => {
    if (state?.status === "success") {
      formRef.current?.reset();
    }
  }, [state?.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="name">
            Client name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Driftworks South"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="company">
            Company
          </label>
          <input
            id="company"
            name="company"
            placeholder="Company name"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="client@company.com"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="+1 555 0100"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            placeholder="Street, City, Postal code"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Project references, preferences, etc."
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/40">Clients will sync instantly with Supabase.</p>
        <SubmitButton />
      </div>
      {state?.status === "error" ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.message}
        </p>
      ) : null}
      {state?.status === "success" ? (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Client saved successfully.
        </p>
      ) : null}
    </form>
  );
};

export default NewClientForm;
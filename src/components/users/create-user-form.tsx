"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  createUserAccount,
  type CreateUserState,
} from "@/app/(dashboard)/manage-users/actions";
import { roleOptions, defaultRoleValue, isBennys } from "@/config/brand-overrides";

const initialState: CreateUserState = { status: "idle" };

const generatePassword = () => {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < 10; i += 1) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Adding..." : "Add User"}
    </button>
  );
};

const CreateUserForm = () => {
  const [state, formAction] = useFormState(createUserAccount, initialState);
  const [generatedPassword, setGeneratedPassword] =
    useState(generatePassword());

  useEffect(() => {
    if (state.status === "success") {
      (
        document.getElementById("create-user-form") as HTMLFormElement | null
      )?.reset();
      setGeneratedPassword(generatePassword());
    }
  }, [state.status]);

  const handleRegenerate = () => {
    setGeneratedPassword(generatePassword());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
    } catch (error) {
      console.error("Clipboard copy failed", error);
    }
  };

  return (
    <form id="create-user-form" action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          className="muted-label"
          htmlFor="username"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          placeholder="e.g., brice"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        />
      </div>

      <div className="space-y-2">
        <label
          className="muted-label"
          htmlFor="password"
        >
          Password
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <input
            id="password"
            name="password"
            type="text"
            value={generatedPassword}
            onChange={(event) => setGeneratedPassword(event.target.value)}
            required
            className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white whitespace-nowrap"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {isBennys ? (
        <div className="space-y-2">
          <label className="muted-label" htmlFor="bankAccount">
            Bank Account #
          </label>
          <input
            id="bankAccount"
            name="bankAccount"
            placeholder="Enter payout account"
            maxLength={64}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
          <p className="text-xs text-white/45">
            Used for payroll reports; leave blank if not applicable.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          className="muted-label"
          htmlFor="role"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaultRoleValue}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#101010]">
              {option.label}
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
          placeholder="Add private notes for this user"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        />
        <p className="text-xs text-white/45">Visible only in the admin area.</p>
      </div>

      {state.status === "error" ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          User created successfully.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
};

export default CreateUserForm;



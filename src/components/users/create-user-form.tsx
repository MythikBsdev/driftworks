"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  createUserAccount,
  type CreateUserState,
} from "@/app/(dashboard)/manage-users/actions";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "mechanic", label: "Mechanic" },
  { value: "sales", label: "Sales" },
  { value: "apprentice", label: "Apprentice" },
];

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
      className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-70"
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
          className="text-xs uppercase tracking-[0.3em] text-white/40"
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
          className="text-xs uppercase tracking-[0.3em] text-white/40"
          htmlFor="password"
        >
          Password
        </label>
        <div className="flex items-center gap-2">
          <input
            id="password"
            name="password"
            type="text"
            value={generatedPassword}
            onChange={(event) => setGeneratedPassword(event.target.value)}
            required
            className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="text-xs uppercase tracking-[0.3em] text-white/40"
          htmlFor="role"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="apprentice"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#101010]">
              {option.label}
            </option>
          ))}
        </select>
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

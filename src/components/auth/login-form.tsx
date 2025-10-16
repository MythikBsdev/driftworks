"use client";

import { useFormState, useFormStatus } from "react-dom";

import { login, type LoginFormState } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";

const initialState: LoginFormState = {};

type LoginFormProps = {
  redirectTo?: string;
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={cn(
        "w-full rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition",
        "bg-brand-primary text-white shadow-[0_10px_30px_rgba(255,22,22,0.35)]",
        "hover:bg-brand-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        pending && "cursor-wait opacity-80",
      )}
      disabled={pending}
    >
      {pending ? "Signing In..." : "Login"}
    </button>
  );
};

const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const [state, formAction] = useFormState<LoginFormState, FormData>(login, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80" htmlFor="email">
          Username or email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="brice@driftworks.com"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/60"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/60"
        />
      </div>
      {state?.error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
};

export { LoginForm };
export default LoginForm;
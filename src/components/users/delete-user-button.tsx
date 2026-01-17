"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { deleteUserAccount } from "@/app/(dashboard)/manage-users/actions";
import { cn } from "@/lib/utils";

const initialState = { status: "idle" as const };

type DeleteUserButtonProps = {
  userId: string;
  disabled?: boolean;
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
};

export const DeleteUserButton = ({ userId, disabled }: DeleteUserButtonProps) => {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(deleteUserAccount, initialState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            action={formAction}
            className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-black/90 p-5 text-left shadow-[0_25px_60px_-20px_rgba(0,0,0,0.85)]"
          >
            <input type="hidden" name="userId" value={userId} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Confirm termination</p>
                <p className="text-xs text-white/60">Provide a reason to log this termination.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-white/60 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-1">
              <label className="muted-label" htmlFor={`reason-${userId}`}>
                Reason
              </label>
              <textarea
                id={`reason-${userId}`}
                name="reason"
                required
                minLength={3}
                rows={3}
                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/40"
              />
            </div>

            {state.status === "error" ? (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                {(state as any).message ?? "Unable to delete user."}
              </p>
            ) : null}

            <SubmitButton />
          </form>
        </div>
      ) : null}
    </>
  );
};

export default DeleteUserButton;

"use client";

import { useTransition } from "react";

import { signOut } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/utils";

const LogoutButton = () => {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut())}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition",
        "hover:border-red-500/60 hover:bg-red-500/20 hover:text-white",
        pending && "cursor-wait opacity-70",
      )}
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
};

export default LogoutButton;
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ClearAllButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all parts purchases? This cannot be undone.",
    );
    if (!confirmed) return;

    setPending(true);
    try {
      const response = await fetch("/api/parts/clear", { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      router.refresh();
    } catch (error) {
      console.error("[parts] Failed to clear purchases", error);
      alert("Unable to clear purchases right now. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Clearing..." : "Clear all"}
    </button>
  );
};

export default ClearAllButton;

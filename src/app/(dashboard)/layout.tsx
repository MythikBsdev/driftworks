import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOut } from "@/app/(dashboard)/actions";
import DashboardTabs from "@/components/layout/dashboard-tabs";
import { getSession } from "@/lib/auth/session";

const TABS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Sales Register", href: "/sales-register" },
  { label: "Sales", href: "/sales" },
  { label: "Inventory", href: "/inventory" },
  { label: "Manage Users", href: "/manage-users" },
  { label: "Manage Discounts", href: "/manage-discounts" },
  { label: "Manage Commissions", href: "/manage-commissions" },
  { label: "Add Employee Sale", href: "/employee-sales" },
];

const toTitleCase = (value: string | null | undefined) =>
  value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "User";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const displayName = session.user.full_name ?? session.user.username;
  const roleLabel = toTitleCase(session.user.role);

  const logout = async () => {
    "use server";
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/5 bg-[#050505]/95 px-6 py-6 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-white/60">
              Welcome, {displayName} ({roleLabel})!
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,22,22,0.35)] transition hover:bg-red-500"
            >
              Logout
            </button>
          </form>
        </div>
        <div className="mt-6">
          <DashboardTabs tabs={TABS} />
        </div>
      </header>
      <main className="px-6 pb-16 pt-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {children}
        </div>
      </main>
      <footer className="pb-8 text-center text-xs uppercase tracking-[0.4em] text-white/30">
        Created by MythikBs
      </footer>
    </div>
  );
};

export default DashboardLayout;


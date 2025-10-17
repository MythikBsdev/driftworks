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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_100%_0%,rgba(255,91,91,0.18),transparent),radial-gradient(40%_60%_at_0%_85%,rgba(99,102,241,0.18),transparent)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-10 sm:px-10">
        <header className="glass-panel px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="muted-label">Control Centre</span>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-white/60">
                You&apos;re signed in as <span className="font-medium text-white">{roleLabel}</span>. Monitor sales,
                manage your catalog, and keep the team moving.
              </p>
            </div>
            <form action={logout} className="flex items-center justify-end">
              <button type="submit" className="btn-ghost">
                Logout
              </button>
            </form>
          </div>
          <div className="mt-6">
            <DashboardTabs tabs={TABS} />
          </div>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-8">
          {children}
        </main>

        <footer className="mt-12 pb-6 text-center text-xs uppercase tracking-[0.4em] text-white/30">
          Created by MythikBs
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;

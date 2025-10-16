import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarClock,
  ClipboardCheck,
  FileText,
  PackageSearch,
  UsersRound,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currencyFormatter, sum } from "@/lib/utils";

const ManagementPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [invoiceQuery, clientQuery, teamQuery] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, status, total, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("clients")
      .select("id, name, company, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("created_at", { ascending: true }),
  ]);

  const invoices = invoiceQuery.data ?? [];
  const clients = clientQuery.data ?? [];
  const team = teamQuery.data ?? [];

  const outstanding = invoices.filter((invoice) => invoice.status !== "paid");
  const outstandingTotal = sum(
    outstanding.map((invoice) => invoice.total ?? 0),
  );
  const formatter = currencyFormatter("USD");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-white/40">
              Control
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Operations command center
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Monitor finances, customers, and team activity from a single
              viewport.
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/85 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            <FileText className="h-4 w-4" />
            Create invoice
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Open invoices
            </p>
            <div className="mt-3 flex items-center gap-3">
              <FileText className="h-10 w-10 rounded-2xl bg-brand-primary/20 p-2 text-brand-primary" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {outstanding.length}
                </p>
                <p className="text-xs text-white/50">Awaiting payment</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Balance
            </p>
            <div className="mt-3 flex items-center gap-3">
              <CalendarClock className="h-10 w-10 rounded-2xl bg-emerald-500/20 p-2 text-emerald-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {formatter.format(outstandingTotal)}
                </p>
                <p className="text-xs text-white/50">Projected income</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Clients
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ClipboardCheck className="h-10 w-10 rounded-2xl bg-sky-500/20 p-2 text-sky-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {clients.length}
                </p>
                <p className="text-xs text-white/50">Recent partners</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Team
            </p>
            <div className="mt-3 flex items-center gap-3">
              <UsersRound className="h-10 w-10 rounded-2xl bg-purple-500/20 p-2 text-purple-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {team.length}
                </p>
                <p className="text-xs text-white/50">Members onboarded</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Recent financial activity
            </h2>
            <Link
              href="/invoices"
              className="text-sm text-white/60 hover:text-white"
            >
              View invoices
            </Link>
          </div>
          <ul className="space-y-3">
            {invoices.length ? (
              invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">
                      Invoice {invoice.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-white/45">{invoice.status}</p>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p className="text-sm font-semibold text-white">
                      {formatter.format(invoice.total ?? 0)}
                    </p>
                    <p>
                      {invoice.updated_at
                        ? formatDistanceToNow(new Date(invoice.updated_at), {
                            addSuffix: true,
                          })
                        : "—"}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
                Financial activity will appear after your first invoice.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Quick access</h2>
            <PackageSearch className="h-4 w-4 text-white/60" />
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <Link
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-brand-primary/60 hover:text-white"
              href="/products"
            >
              Manage catalog
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">
                Products
              </span>
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-brand-primary/60 hover:text-white"
              href="/users"
            >
              Assign permissions
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">
                Users
              </span>
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-brand-primary/60 hover:text-white"
              href="/invoices"
            >
              Reconcile invoices
              <span className="text-xs uppercase tracking-[0.35em] text-white/40">
                Finance
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ManagementPage;

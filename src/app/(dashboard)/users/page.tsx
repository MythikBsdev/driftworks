import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UsersPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, created_at")
    .order("created_at", { ascending: false });

  const team = profiles ?? [];
  const totalUsers = team.length;
  const adminCount = team.filter((member) => member.role === "admin").length;
  const staffCount = team.filter((member) => member.role === "staff").length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-white/40">
              Team
            </p>
            <h1 className="text-3xl font-semibold text-white">
              People & access control
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {totalUsers
                ? `${totalUsers} active ${totalUsers === 1 ? "member" : "members"}`
                : "No users on record yet."}
            </p>
          </div>
          <Link
            href="https://app.supabase.com/project"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/85 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            <UserPlus className="h-4 w-4" />
            Invite user
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Total
            </p>
            <div className="mt-3 flex items-center gap-3">
              <UsersRound className="h-10 w-10 rounded-2xl bg-brand-primary/20 p-2 text-brand-primary" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {totalUsers}
                </p>
                <p className="text-xs text-white/50">Licensed members</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Administrators
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 rounded-2xl bg-emerald-500/20 p-2 text-emerald-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {adminCount}
                </p>
                <p className="text-xs text-white/50">Global access</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Operations
            </p>
            <div className="mt-3 flex items-center gap-3">
              <UsersRound className="h-10 w-10 rounded-2xl bg-sky-500/20 p-2 text-sky-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {staffCount}
                </p>
                <p className="text-xs text-white/50">Staff & collaborators</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Directory</h2>
          <span className="text-xs uppercase tracking-[0.35em] text-white/40">
            Newest first
          </span>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Name</span>
            <span>Username</span>
            <span className="text-center">Role</span>
            <span className="text-right">Joined</span>
          </div>
          <ul className="divide-y divide-white/5">
            {team.length ? (
              team.map((member) => (
                <li
                  key={member.id}
                  className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">
                      {member.full_name ?? "Pending profile"}
                    </p>
                    <p className="text-xs text-white/45">{member.id}</p>
                  </div>
                  <p className="text-white/65">{member.username ?? "—"}</p>
                  <span className="text-center text-xs uppercase tracking-[0.3em] text-white/60">
                    {member.role ?? "viewer"}
                  </span>
                  <span className="text-right text-xs text-white/45">
                    {member.created_at
                      ? formatDistanceToNow(new Date(member.created_at), {
                          addSuffix: true,
                        })
                      : "Unknown"}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-6 py-12 text-center text-sm text-white/50">
                No users yet. Invite your first teammate to unlock collaboration
                tools.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default UsersPage;

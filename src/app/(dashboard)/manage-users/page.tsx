import { redirect } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";

import CreateUserForm from "@/components/users/create-user-form";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

import {
  deleteUserAccount,
  resetUserPassword,
  updateUserRole,
} from "./actions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  mechanic: "Mechanic",
  sales: "Sales",
  apprentice: "Apprentice",
};

const formatRole = (role: string) =>
  ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);

const ManageUsersPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: users } = await supabase
    .from("app_users")
    .select("id, username, full_name, role, created_at")
    .order("username", { ascending: true });

  const userRows =
    (users ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

  const canManage = session.user.role === "owner";

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="glass-card">
        <h2 className="text-xl font-semibold text-white">Add New User</h2>
        <p className="mt-1 text-sm text-white/60">
          Add a new user to the system with a specific role.
        </p>
        <div className="mt-6">
          {canManage ? (
            <CreateUserForm />
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
              Owner access is required to create new users.
            </p>
          )}
        </div>
      </section>

      <section className="glass-card space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Existing Users</h2>
            <p className="text-sm text-white/60">
              View, edit, or remove accounts associated with your workspace.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-center font-medium">Set Password</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRows.length ? (
                userRows.map((user) => {
                  const isSelf = user.id === session.user.id;
                  const joined = user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown";
                  return (
                    <tr key={user.id} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-white">
                            {user.full_name ?? user.username}
                          </p>
                          <p className="text-sm text-white/60">@{user.username}</p>
                          <p className="muted-label">Joined {joined}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {canManage ? (
                          <form action={updateUserRole} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40 dark:bg-black"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                              ))}
                            </select>
                            <button type="submit" className="btn-ghost px-3 py-2 text-xs">
                              Save
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm text-white/70">{formatRole(user.role)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {canManage ? (
                          <form action={resetUserPassword} className="flex items-center gap-2 justify-center sm:justify-start">
                            <input type="hidden" name="userId" value={user.id} />
                            <input
                              type="password"
                              name="password"
                              minLength={8}
                              required
                              placeholder="New password"
                              autoComplete="new-password"
                              className="w-48 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                            />
                            <button type="submit" className="btn-ghost px-3 py-2 text-xs">
                              <KeyRound className="h-4 w-4" />
                              Set
                            </button>
                          </form>
                        ) : (
                          <span className="text-sm text-white/50">Owner access required</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        {canManage ? (
                          <form action={deleteUserAccount} className="inline-flex">
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isSelf}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </form>
                        ) : (
                          <span className="text-sm text-white/50">Owner access required</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-white/60" colSpan={4}>
                    No users defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManageUsersPage;

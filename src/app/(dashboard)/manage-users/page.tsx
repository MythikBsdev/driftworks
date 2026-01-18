import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { Edit3 } from "lucide-react";

import CreateUserForm from "@/components/users/create-user-form";
import {
  formatRoleLabel,
  canManageUsers,
  roleOptions,
} from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

import { updateUserAccount, updateUserRole } from "./actions";
import DeleteUserButton from "@/components/users/delete-user-button";

const ManageUsersPage = async () => {
  // Ensure latest session and role data for every request.
  noStore();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: users } = await supabase
    .from("app_users")
    .select("id, username, full_name, bank_account, role, created_at, notes")
    .order("username", { ascending: true });

  const userRows =
    (users ?? []) as (Database["public"]["Tables"]["app_users"]["Row"] & {
      notes?: string | null;
    })[];

  const canManage = canManageUsers(session.user.role);

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

        <div className="overflow-visible rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
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
                          {user.notes ? (
                            <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                              <p className="font-semibold text-white/80">Notes</p>
                              <p className="whitespace-pre-wrap break-all text-white/80">
                                {user.notes}
                              </p>
                            </div>
                          ) : null}
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
                              {roleOptions.map(({ value, label }) => (
                                <option key={value} value={value} className="bg-[#101010]">
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="btn-ghost px-3 py-2 text-xs">
                              Save
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm text-white/70">
                            {formatRoleLabel(user.role)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-3">
                            <details className="relative">
                              <summary className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/40 p-2 text-white/70 transition hover:border-white/20 hover:text-white [&::-webkit-details-marker]:hidden">
                                <span className="sr-only">Edit {user.username}</span>
                                <Edit3 className="h-4 w-4" />
                              </summary>
                              <form
                                action={updateUserAccount}
                                className="absolute right-0 z-10 mt-3 w-80 space-y-3 rounded-2xl border border-white/10 bg-black/85 p-4 text-left shadow-[0_25px_60px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl"
                              >
                                <input type="hidden" name="userId" value={user.id} />
                                <div className="space-y-1">
                                  <label className="muted-label" htmlFor={`password-${user.id}`}>
                                    New Password
                                  </label>
                                  <input
                                    id={`password-${user.id}`}
                                    name="password"
                                    type="password"
                                    minLength={8}
                                    placeholder="Leave blank to keep current"
                                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="muted-label" htmlFor={`bank-${user.id}`}>
                                    Bank Account #
                                  </label>
                                  <input
                                    id={`bank-${user.id}`}
                                    name="bankAccount"
                                    defaultValue={user.bank_account ?? ""}
                                    placeholder="Enter payout account"
                                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                                  />
                                  <p className="text-xs text-white/45">
                                    This value shows in sales summary for payouts.
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="muted-label" htmlFor={`notes-${user.id}`}>
                                    Notes
                                  </label>
                                  <textarea
                                    id={`notes-${user.id}`}
                                    name="notes"
                                    rows={3}
                                    defaultValue={user.notes ?? ""}
                                    placeholder="Add private notes for this user"
                                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                                  />
                                  <p className="text-xs text-white/45">
                                    Visible only in this admin view.
                                  </p>
                                </div>
                                <button type="submit" className="btn-primary w-full justify-center">
                                  Save changes
                                </button>
                              </form>
                            </details>

                            <DeleteUserButton userId={user.id} disabled={isSelf} />
                          </div>
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



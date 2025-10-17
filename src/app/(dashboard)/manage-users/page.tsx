import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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

        <div className="space-y-4">
          {userRows.length ? (
            userRows.map((user) => {
              const isSelf = user.id === session.user.id;
              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <p className="text-lg font-semibold text-white">
                        {user.full_name ?? user.username}
                      </p>
                      <p className="text-sm text-white/60">@{user.username}</p>
                      <p className="muted-label">
                        Joined{" "}
                        {user.created_at
                          ? formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                            })
                          : "unknown"}
                      </p>
                    </div>
                    <div className="text-sm text-white/70">
                      <span className="muted-label">Current Role</span>
                      <p className="text-base font-medium text-white">
                        {formatRole(user.role)}
                      </p>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="mt-6 space-y-4">
                      <form
                        action={updateUserRole}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="btn-ghost w-full justify-center sm:w-auto"
                        >
                          Update Role
                        </button>
                      </form>

                      <form
                        action={resetUserPassword}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="password"
                          name="password"
                          minLength={8}
                          required
                          placeholder="New password"
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                        />
                        <button
                          type="submit"
                          className="btn-ghost w-full justify-center sm:w-auto"
                        >
                          <KeyRound className="h-4 w-4" />
                          <span>Set Password</span>
                        </button>
                      </form>

                      <form
                        action={deleteUserAccount}
                        className="flex justify-end"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSelf}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete User
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p className="text-sm text-white/60">No users defined yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManageUsersPage;

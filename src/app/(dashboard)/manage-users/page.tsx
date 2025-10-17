import { redirect } from "next/navigation";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

import CreateUserForm from "@/components/users/create-user-form";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

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
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
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

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
        <h2 className="text-xl text-white">Existing Users</h2>
        <p className="text-sm text-white/60">View and manage roles for existing users.</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <table className="w-full text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium text-left">Username</th>
                <th className="px-4 py-3 font-medium text-left">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRows.length ? (
                userRows.map((user) => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      {user.full_name ?? user.username}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {formatRole(user.role)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-white disabled:cursor-not-allowed"
                          title="Edit user (coming soon)"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed"
                          title="Reset password (coming soon)"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-red-300 transition hover:text-red-200 disabled:cursor-not-allowed"
                          title="Remove user (coming soon)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-white/50"
                    colSpan={3}
                  >
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


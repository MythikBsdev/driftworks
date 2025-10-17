import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

import { createInventoryItem, deleteInventoryItem } from "./actions";

const categories = ["Normal", "Employee", "LEO"];

const InventoryPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("id, name, category, price, description, updated_at")
    .eq("owner_id", session.user.id)
    .order("updated_at", { ascending: false });

  const inventoryItems =
    (inventory ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];

  const formatter = currencyFormatter("GBP");

  const createItem = async (formData: FormData) => {
    "use server";
    await createInventoryItem({ status: "idle" }, formData);
  };

  const removeItem = async (formData: FormData) => {
    "use server";
    await deleteInventoryItem(formData);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="glass-card">
        <h2 className="text-xl font-semibold text-white">Add New Item</h2>
        <p className="mt-1 text-sm text-white/60">
          Add a new product or service to the sales register.
        </p>
        <form action={createItem} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="name"
            >
              Item Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g., Racing Seat"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="category"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue="Normal"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                  className="bg-[#101010]"
                >
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="description"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="e.g., High-performance racing seat for track use."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="price"
            >
              Item Price (£)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g., 350.00"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full justify-center"
          >
            Add Item
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
        <h2 className="text-xl font-semibold text-white">Current Inventory</h2>
        <p className="text-sm text-white/60">
          View, edit, or delete existing items.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <table className="w-full text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.length ? (
                inventoryItems.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{item.name}</td>
                    <td className="px-4 py-3 text-white/60">{item.category}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatter.format(item.price ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {new Date(
                        item.updated_at ?? item.created_at ?? Date.now(),
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs uppercase tracking-[0.3em] text-red-400 transition hover:text-red-300"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-white/50"
                    colSpan={5}
                  >
                    No items in inventory.
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

export default InventoryPage;



















import { redirect } from "next/navigation";
import { Edit3 } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "./actions";

const categories = ["Normal", "Employee", "LEO"];

const InventoryPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const allowedRoles = new Set(["owner", "manager"]);
  if (!allowedRoles.has(session.user.role)) {
    redirect("/dashboard");
  }

  const supabase = createSupabaseServerClient();
  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("id, name, category, price, description, updated_at, created_at")
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

  const updateItem = async (formData: FormData) => {
    "use server";
    await updateInventoryItem({ status: "idle" }, formData);
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
            <label className="muted-label" htmlFor="name">
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
            <label className="muted-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue="Normal"
              className="select-dark w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="bg-[#101010]">
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="muted-label" htmlFor="description">
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
            <label className="muted-label" htmlFor="price">
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
          <button type="submit" className="btn-primary w-full justify-center">
            Add Item
          </button>
        </form>
      </section>

      <section className="glass-card">
        <h2 className="text-xl font-semibold text-white">Current Catalogue</h2>
        <p className="text-sm text-white/60">
          View, edit, or delete existing items.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-white/70">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
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
                      ).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <details className="relative">
                          <summary className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/40 p-2 text-white/70 transition hover:border-white/20 hover:text-white [&::-webkit-details-marker]:hidden">
                            <span className="sr-only">Edit {item.name}</span>
                            <Edit3 className="h-4 w-4" />
                          </summary>
                          <form
                            action={updateItem}
                            className="absolute right-0 z-10 mt-3 w-80 space-y-3 rounded-2xl border border-white/10 bg-black/85 p-4 text-left shadow-[0_25px_60px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl"
                          >
                            <input type="hidden" name="itemId" value={item.id} />

                            <div className="space-y-1">
                              <label htmlFor={`name-${item.id}`} className="muted-label">
                                Item Name
                              </label>
                              <input
                                id={`name-${item.id}`}
                                name="name"
                                defaultValue={item.name ?? ""}
                                required
                                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                              />
                            </div>

                            <div className="space-y-1">
                              <label htmlFor={`category-${item.id}`} className="muted-label">
                                Category
                              </label>
                              <select
                                id={`category-${item.id}`}
                                name="category"
                                defaultValue={item.category ?? "Normal"}
                                className="select-dark w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                              >
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label htmlFor={`description-${item.id}`} className="muted-label">
                                Description
                              </label>
                              <textarea
                                id={`description-${item.id}`}
                                name="description"
                                rows={3}
                                defaultValue={item.description ?? ""}
                                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                              />
                            </div>

                            <div className="space-y-1">
                              <label htmlFor={`price-${item.id}`} className="muted-label">
                                Price
                              </label>
                              <input
                                id={`price-${item.id}`}
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item.price ?? 0}
                                required
                                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
                              />
                            </div>

                            <button type="submit" className="btn-primary w-full justify-center">
                              Save changes
                            </button>
                          </form>
                        </details>

                        <form action={removeItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-xs uppercase tracking-[0.3em] text-red-400 transition hover:text-red-300"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
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

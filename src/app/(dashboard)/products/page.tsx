import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Package2, PackagePlus, Sparkles, TrendingUp } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currencyFormatter } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  updatedAt: string;
};

const sampleProducts: Product[] = [
  {
    id: "DW-PRO-001",
    name: "Carbon Fiber Aero Wing",
    price: 1299,
    stock: 8,
    status: "active",
    updatedAt: "2025-10-10T08:00:00Z",
  },
  {
    id: "DW-PRO-017",
    name: "Forged Performance Wheel Set",
    price: 1899,
    stock: 14,
    status: "active",
    updatedAt: "2025-10-14T12:30:00Z",
  },
  {
    id: "DW-PRO-024",
    name: "Track Alignment Kit",
    price: 549,
    stock: 4,
    status: "draft",
    updatedAt: "2025-09-30T09:45:00Z",
  },
  {
    id: "DW-PRO-031",
    name: "Hydraulic Handbrake Assembly",
    price: 799,
    stock: 2,
    status: "active",
    updatedAt: "2025-10-15T06:20:00Z",
  },
];

const ProductsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const formatter = currencyFormatter("USD");
  const totalCatalog = sampleProducts.length;
  const activeCount = sampleProducts.filter(
    (product) => product.status === "active",
  ).length;
  const lowStockCount = sampleProducts.filter(
    (product) => product.stock < 5,
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-white/40">
              Catalog
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Product inventory
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Keep an eye on availability, pricing, and launch status in real
              time.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/85 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            <PackagePlus className="h-4 w-4" />
            New product
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Catalog size
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Package2 className="h-10 w-10 rounded-2xl bg-brand-primary/20 p-2 text-brand-primary" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {totalCatalog}
                </p>
                <p className="text-xs text-white/50">Total SKUs</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Active listings
            </p>
            <div className="mt-3 flex items-center gap-3">
              <TrendingUp className="h-10 w-10 rounded-2xl bg-emerald-500/20 p-2 text-emerald-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {activeCount}
                </p>
                <p className="text-xs text-white/50">Live on site</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Low stock
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Sparkles className="h-10 w-10 rounded-2xl bg-red-500/20 p-2 text-red-300" />
              <div>
                <p className="text-3xl font-semibold text-white">
                  {lowStockCount}
                </p>
                <p className="text-xs text-white/50">Need replenishment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Product pipeline</h2>
          <span className="text-xs uppercase tracking-[0.35em] text-white/40">
            Updated live
          </span>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Product</span>
            <span>Price</span>
            <span className="text-center">Status</span>
            <span className="text-right">Updated</span>
          </div>
          <ul className="divide-y divide-white/5">
            {sampleProducts.map((product) => (
              <li
                key={product.id}
                className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] items-center gap-4 px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-xs text-white/45">{product.id}</p>
                </div>
                <p className="text-white/70">
                  {formatter.format(product.price)}
                </p>
                <span className="text-center text-xs uppercase tracking-[0.3em] text-white/60">
                  {product.status}
                </span>
                <span className="text-right text-xs text-white/45">
                  {formatDistanceToNow(new Date(product.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;

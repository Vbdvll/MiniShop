import { ArrowLeft, Save } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateProduct } from "@/app/dashboard/products/product-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier le produit",
};

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const [{ productId }, { error }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/dashboard");

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, price_xof, reference, status")
    .eq("id", productId)
    .eq("shop_id", shop.id)
    .neq("status", "archived")
    .maybeSingle();

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Retour aux produits
        </Link>
        <div className="mt-6 rounded-[2rem] border border-ink/8 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
          <p className="mt-2 leading-7 text-ink/55">
            Mettez à jour le prix, la description ou la disponibilité.
          </p>
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </div>
          )}
          <form action={updateProduct} className="mt-7 space-y-5">
            <input type="hidden" name="productId" value={product.id} />
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Nom du produit</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={product.name}
                className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Prix en FCFA</span>
              <input
                name="price"
                inputMode="numeric"
                required
                defaultValue={product.price_xof}
                className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Disponibilité</span>
              <select
                name="status"
                defaultValue={product.status}
                className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              >
                <option value="active">Disponible</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Description</span>
              <textarea
                name="description"
                maxLength={1000}
                rows={4}
                defaultValue={product.description ?? ""}
                className="w-full resize-none rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Référence</span>
              <input
                name="reference"
                maxLength={50}
                defaultValue={product.reference ?? ""}
                className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 uppercase outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <button
              type="submit"
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-extrabold text-white"
            >
              <Save size={18} aria-hidden="true" />
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

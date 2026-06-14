import { Archive, ArrowLeft, ImageIcon, Package, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { archiveProduct } from "@/app/dashboard/products/product-actions";
import { formatXofPrice } from "@/lib/product";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Produits",
};

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const message = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) redirect("/dashboard/boutique");

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, price_xof, status, reference, product_images(storage_path, position)",
    )
    .eq("shop_id", shop.id)
    .neq("status", "archived")
    .order("position")
    .order("position", { referencedTable: "product_images" });

  const catalog = products ?? [];

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Retour au tableau de bord
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-700">{shop.name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Vos produits</h1>
            <p className="mt-2 text-ink/50">{catalog.length} produit(s) sur 30</p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-extrabold text-white"
          >
            <Plus size={18} aria-hidden="true" />
            Ajouter un produit
          </Link>
        </div>

        {message.success && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {message.success}
          </div>
        )}
        {message.error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {message.error}
          </div>
        )}

        {catalog.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Package size={25} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Votre catalogue est vide</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">
              Ajoutez un premier produit. Vous pourrez le modifier ou l’archiver ensuite.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((product) => {
              const firstImage = product.product_images?.[0];
              const imageUrl = firstImage
                ? supabase.storage
                    .from("product-images")
                    .getPublicUrl(firstImage.storage_path).data.publicUrl
                : null;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-sm"
                >
                  <div className="aspect-square bg-cream">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-ink/20">
                        <ImageIcon size={38} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold">{product.name}</h2>
                        <p className="mt-1 font-extrabold text-emerald-700">
                          {formatXofPrice(product.price_xof)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {product.status === "out_of_stock" ? "Rupture" : "Actif"}
                      </span>
                    </div>
                    {product.reference && (
                      <p className="mt-3 text-xs font-medium text-ink/40">
                        Réf. {product.reference}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-5">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Modifier
                      </Link>
                      <form action={archiveProduct}>
                        <input type="hidden" name="productId" value={product.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 text-sm font-bold text-red-700"
                        >
                          <Archive size={16} aria-hidden="true" />
                          Archiver
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

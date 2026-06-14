import { ImageIcon, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { ShareShopButton } from "@/components/share-shop-button";
import { formatXofPrice } from "@/lib/product";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ shopSlug: string }>;
};

async function getPublishedShop(slug: string) {
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, description, whatsapp_number, address")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return { supabase, shop };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shopSlug } = await params;
  const { shop } = await getPublishedShop(shopSlug);

  if (!shop) {
    return { title: "Boutique introuvable" };
  }

  const description =
    shop.description ?? `Découvrez tous les produits de ${shop.name} et commandez sur WhatsApp.`;

  return {
    title: shop.name,
    description,
    alternates: { canonical: `/${shop.slug}` },
    openGraph: {
      title: shop.name,
      description,
      type: "website",
      locale: "fr_SN",
    },
  };
}

export default async function PublicShopPage({ params }: PageProps) {
  const { shopSlug } = await params;
  const { supabase, shop } = await getPublishedShop(shopSlug);
  if (!shop) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price_xof, reference, status, product_images(storage_path, position)",
    )
    .eq("shop_id", shop.id)
    .in("status", ["active", "out_of_stock"])
    .order("position")
    .order("position", { referencedTable: "product_images" });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const shopUrl = `${siteUrl}/${shop.slug}`;
  const whatsappNumber = shop.whatsapp_number.replace(/\D/g, "");

  return (
    <main className="min-h-screen bg-[#f8f6f0] text-ink">
      <header className="border-b border-ink/8 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <ShareShopButton shopName={shop.name} url={shopUrl} variant="light" />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
        <div className="flex items-start gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-sm sm:size-20">
            <ShoppingBag size={30} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{shop.name}</h1>
            {shop.address && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink/50">
                <MapPin size={15} aria-hidden="true" />
                {shop.address}
              </p>
            )}
          </div>
        </div>
        {shop.description && (
          <p className="mt-5 max-w-2xl leading-7 text-ink/60">{shop.description}</p>
        )}

        <div className="mt-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Catalogue
            </p>
            <h2 className="mt-1 text-2xl font-bold">Nos produits</h2>
          </div>
          <span className="text-sm font-semibold text-ink/40">
            {products?.length ?? 0} produit{products?.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {(products ?? []).map((product) => {
            const firstImage = product.product_images?.[0];
            const imageUrl = firstImage
              ? supabase.storage
                  .from("product-images")
                  .getPublicUrl(firstImage.storage_path).data.publicUrl
              : null;
            const productUrl = `${shopUrl}#${product.slug}`;
            const message = [
              "Bonjour, je souhaite commander :",
              `Produit : ${product.name}`,
              `Prix : ${formatXofPrice(product.price_xof)}`,
              product.reference ? `Référence : ${product.reference}` : null,
              `Lien : ${productUrl}`,
            ]
              .filter(Boolean)
              .join("\n");
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            const unavailable = product.status === "out_of_stock";

            return (
              <article
                id={product.slug}
                key={product.id}
                className="flex scroll-mt-5 flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm sm:rounded-3xl"
              >
                <div className="aspect-square bg-cream">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-ink/20">
                      <ImageIcon size={36} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-5">
                  <h3 className="font-bold leading-5 sm:text-lg">{product.name}</h3>
                  <p className="mt-1 text-sm font-extrabold text-emerald-700 sm:text-base">
                    {formatXofPrice(product.price_xof)}
                  </p>
                  {product.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/50 sm:text-sm">
                      {product.description}
                    </p>
                  )}
                  {unavailable ? (
                    <span className="mt-auto pt-4 text-center text-xs font-extrabold text-red-700">
                      Rupture de stock
                    </span>
                  ) : (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] px-2 py-2.5 text-center text-xs font-extrabold text-white transition hover:bg-[#1fbd5b] sm:text-sm"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      Commander
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-ink/8 bg-white px-4 py-6 text-center text-xs font-medium text-ink/40">
        Catalogue créé avec MiniShop
      </footer>
    </main>
  );
}

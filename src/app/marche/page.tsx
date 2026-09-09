import {
  ArrowRight,
  ImageIcon,
  MapPin,
  MessageCircle,
  Search,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ProductPreviewModal } from "@/components/product-preview-modal";
import { formatXofPrice } from "@/lib/product";
import { createClient } from "@/lib/supabase/server";
import { createWhatsAppOrderUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Marché Central",
  description:
    "Découvrez les boutiques et produits de vendeurs sénégalais, puis commandez directement sur WhatsApp.",
  openGraph: {
    title: "Marché Central",
    description:
      "Découvrez des boutiques sénégalaises et commandez directement sur WhatsApp.",
    locale: "fr_SN",
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function MarketPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const search = q.trim().slice(0, 80);
  const filterSearch = search
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const supabase = await createClient();

  let shopsQuery = supabase
    .from("shops")
    .select("id, name, slug, description, address")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(12);
  if (filterSearch) {
    shopsQuery = shopsQuery.or(
      `name.ilike.%${filterSearch}%,description.ilike.%${filterSearch}%,address.ilike.%${filterSearch}%`,
    );
  }

  let productsQuery = supabase
    .from("products")
    .select(
      "id, name, slug, description, price_xof, reference, status, product_images(storage_path, position), shops!inner(name, slug, whatsapp_number, address, status)",
    )
    .eq("shops.status", "published")
    .in("status", ["active", "out_of_stock"])
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "product_images" })
    .limit(24);
  if (filterSearch) {
    productsQuery = productsQuery.or(
      `name.ilike.%${filterSearch}%,description.ilike.%${filterSearch}%,reference.ilike.%${filterSearch}%`,
    );
  }

  const [{ data: shops }, { data: products }] = await Promise.all([
    shopsQuery,
    productsQuery,
  ]);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const resultCount = (shops?.length ?? 0) + (products?.length ?? 0);

  return (
    <main className="min-h-screen bg-[#f8f6f0] text-ink">
      <header className="border-b border-ink/8 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Logo />
          <Link
            href="/inscription"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-extrabold text-white"
          >
            Vendre ici
          </Link>
        </div>
      </header>

      <section className="border-b border-ink/8 bg-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            Marché Central
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
            Plusieurs boutiques, une seule promenade.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-white/65">
            Découvrez les produits de vendeurs sénégalais et contactez-les directement
            sur WhatsApp.
          </p>
          <form action="/marche" method="get" className="relative mt-7 max-w-2xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Rechercher un produit ou une boutique"
              className="min-h-14 w-full rounded-2xl bg-white py-3 pl-12 pr-28 font-medium text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-emerald-400/25"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-extrabold text-white"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        {search && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink/55">
              {resultCount} résultat{resultCount === 1 ? "" : "s"} pour{" "}
              <strong className="text-ink">« {search} »</strong>
            </p>
            <Link href="/marche" className="text-sm font-extrabold text-emerald-700">
              Effacer la recherche
            </Link>
          </div>
        )}

        {(shops?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  Boutiques
                </p>
                <h2 className="mt-1 text-2xl font-bold">À découvrir</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(shops ?? []).map((shop) => (
                <Link
                  key={shop.id}
                  href={`/${shop.slug}`}
                  className="group rounded-3xl border border-ink/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Store size={22} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-bold">{shop.name}</span>
                      {shop.address && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-ink/45">
                          <MapPin size={13} aria-hidden="true" />
                          {shop.address}
                        </span>
                      )}
                    </span>
                  </div>
                  {shop.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink/50">
                      {shop.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700">
                    Visiter la boutique
                    <ArrowRight
                      size={15}
                      className="transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(products?.length ?? 0) > 0 && (
          <section className={(shops?.length ?? 0) > 0 ? "mt-12" : ""}>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                Produits
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {search ? "Résultats produits" : "Ajoutés récemment"}
              </h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {(products ?? []).map((product) => {
                const shop = Array.isArray(product.shops)
                  ? product.shops[0]
                  : product.shops;
                if (!shop) return null;

                const productImages = (product.product_images ?? [])
                  .filter((image) => Boolean(image?.storage_path))
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                const images = productImages.map((image) => ({
                  url: supabase.storage
                    .from("product-images")
                    .getPublicUrl(image.storage_path).data.publicUrl,
                  position: image.position ?? 0,
                }));

                const productUrl = `${siteUrl}/${shop.slug}#${product.slug}`;
                const unavailable = product.status === "out_of_stock";
                const whatsappUrl = createWhatsAppOrderUrl(shop.whatsapp_number, {
                  name: product.name,
                  priceXof: product.price_xof,
                  reference: product.reference,
                  url: productUrl,
                });

                const previewProduct = {
                  name: product.name,
                  description: product.description,
                  priceLabel: formatXofPrice(product.price_xof),
                  reference: product.reference,
                  shopName: shop.name,
                  status: unavailable ? "out_of_stock" : "active",
                  images,
                  whatsappUrl,
                } as const;

                return (
                  <article
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm sm:rounded-3xl"
                  >
                    <ProductPreviewModal product={previewProduct}>
                      <div className="cursor-pointer">
                        <div className="aspect-square bg-cream">
                          {images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={images[0].url}
                              alt={product.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-ink/20">
                              <ImageIcon size={36} aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        <div className="p-3 pb-0 sm:p-5 sm:pb-0">
                          <Link
                            href={`/${shop.slug}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate text-[11px] font-extrabold uppercase tracking-wide text-emerald-700"
                          >
                            {shop.name}
                          </Link>
                          <h3 className="mt-1 font-bold leading-5 sm:text-lg">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm font-extrabold text-ink sm:text-base">
                            {formatXofPrice(product.price_xof)}
                          </p>
                        </div>
                      </div>
                    </ProductPreviewModal>

                    <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
                      {unavailable ? (
                        <span className="mt-auto pt-1 text-center text-xs font-extrabold text-red-700">
                          Rupture de stock
                        </span>
                      ) : (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] px-2 py-2.5 text-xs font-extrabold text-white sm:text-sm"
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
        )}

        {resultCount === 0 && (
          <div className="rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
            <Search size={30} className="mx-auto text-ink/25" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Aucun résultat trouvé</h2>
            <p className="mt-2 text-sm text-ink/50">
              Essayez un autre produit, une ville ou un nom de boutique.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

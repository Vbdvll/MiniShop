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

type ProductRow = {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_xof: number;
  reference: string | null;
  status: "active" | "out_of_stock";
  product_images: Array<{
    storage_path: string;
    position: number;
  }>;
};

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  address: string | null;
};

export default async function MarketPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const search = q.trim().slice(0, 80);
  const filterSearch = search
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const supabase = await createClient();

  /*
   * IMPORTANT:
   * We deliberately avoid a shops!inner(...) nested relation here.
   * The public /marche page must remain robust even if the generated
   * Supabase relationship metadata changes.
   */
  let shopsQuery = supabase
    .from("shops")
    .select("id, name, slug, description, whatsapp_number, address")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(12);

  if (filterSearch) {
    shopsQuery = shopsQuery.or(
      `name.ilike.%${filterSearch}%,description.ilike.%${filterSearch}%,address.ilike.%${filterSearch}%`,
    );
  }

  const { data: shopData, error: shopsError } = await shopsQuery;

  if (shopsError) {
    console.error("[market] shops query failed", shopsError);
  }

  const visibleShops = (shopData ?? []) as ShopRow[];
  const matchingShopIds = visibleShops.map((shop) => shop.id);

  let productData: ProductRow[] = [];

  if (!filterSearch) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, shop_id, name, slug, description, price_xof, reference, status, product_images(storage_path, position)",
      )
      .in("status", ["active", "out_of_stock"])
      .order("created_at", { ascending: false })
      .order("position", { referencedTable: "product_images" })
      .limit(24);

    if (error) {
      console.error("[market] products query failed", error);
    } else {
      productData = (data ?? []) as ProductRow[];
    }
  } else {
    const productQueries: Promise<{
      data: ProductRow[] | null;
      error: unknown;
    }>[] = [];

    /* Produits correspondant au texte recherché. */
    productQueries.push(
      supabase
        .from("products")
        .select(
          "id, shop_id, name, slug, description, price_xof, reference, status, product_images(storage_path, position)",
        )
        .in("status", ["active", "out_of_stock"])
        .or(
          `name.ilike.%${filterSearch}%,description.ilike.%${filterSearch}%,reference.ilike.%${filterSearch}%`,
        )
        .order("created_at", { ascending: false })
        .order("position", { referencedTable: "product_images" })
        .limit(24)
        .then(({ data, error }) => ({
          data: (data ?? []) as ProductRow[],
          error,
        })),
    );

    /* Si la recherche correspond à une boutique, ses produits restent visibles. */
    if (matchingShopIds.length > 0) {
      productQueries.push(
        supabase
          .from("products")
          .select(
            "id, shop_id, name, slug, description, price_xof, reference, status, product_images(storage_path, position)",
          )
          .in("status", ["active", "out_of_stock"])
          .in("shop_id", matchingShopIds)
          .order("created_at", { ascending: false })
          .order("position", { referencedTable: "product_images" })
          .limit(24)
          .then(({ data, error }) => ({
            data: (data ?? []) as ProductRow[],
            error,
          })),
      );
    }

    const results = await Promise.all(productQueries);

    const ids = new Set<string>();

    for (const result of results) {
      if (result.error) {
        console.error("[market] search products query failed", result.error);
        continue;
      }

      for (const product of result.data) {
        if (!ids.has(product.id)) {
          ids.add(product.id);
          productData.push(product);
        }
      }
    }

    productData = productData.slice(0, 24);
  }

  /*
   * Les produits doivent appartenir à une boutique publiée.
   * On récupère leurs boutiques en une seconde requête robuste.
   */
  const productShopIds = Array.from(
    new Set(productData.map((product) => product.shop_id)),
  );

  let productShops: ShopRow[] = [];

  if (productShopIds.length > 0) {
    const { data, error } = await supabase
      .from("shops")
      .select("id, name, slug, description, whatsapp_number, address")
      .eq("status", "published")
      .in("id", productShopIds);

    if (error) {
      console.error("[market] product shops query failed", error);
    } else {
      productShops = (data ?? []) as ShopRow[];
    }
  }

  const shopById = new Map<string, ShopRow>(
    [...visibleShops, ...productShops].map((shop) => [shop.id, shop]),
  );

  const products = productData.filter((product) =>
    shopById.has(product.shop_id),
  );

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  const resultCount =
    visibleShops.length + products.length;

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
            <Link
              href="/marche"
              className="text-sm font-extrabold text-emerald-700"
            >
              Effacer la recherche
            </Link>
          </div>
        )}

        {visibleShops.length > 0 && (
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
              {visibleShops.map((shop) => (
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
                      <span className="block truncate text-lg font-bold">
                        {shop.name}
                      </span>
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

        {products.length > 0 && (
          <section className={visibleShops.length > 0 ? "mt-12" : ""}>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                Produits
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {search ? "Résultats produits" : "Ajoutés récemment"}
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const shop = shopById.get(product.shop_id);
                if (!shop) return null;

                const images = [...(product.product_images ?? [])]
                  .filter((image) => Boolean(image?.storage_path))
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map((image) => ({
                    url: supabase.storage
                      .from("product-images")
                      .getPublicUrl(image.storage_path).data.publicUrl,
                    position: image.position ?? 0,
                  }));

                const imageUrl = images[0]?.url ?? null;
                const productUrl = `${siteUrl}/${shop.slug}#${product.slug}`;
                const unavailable = product.status === "out_of_stock";
                const whatsappUrl = createWhatsAppOrderUrl(
                  shop.whatsapp_number,
                  {
                    name: product.name,
                    priceXof: product.price_xof,
                    reference: product.reference,
                    url: productUrl,
                  },
                );

                const previewProduct = {
                  name: product.name,
                  description: product.description,
                  priceLabel: formatXofPrice(product.price_xof),
                  reference: product.reference,
                  shopName: shop.name,
                  status: unavailable ? "out_of_stock" : "active",
                  images,
                  whatsappUrl,
                };

                return (
                  <article
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm sm:rounded-3xl"
                  >
                    <ProductPreviewModal product={previewProduct}>
                      <div className="aspect-square bg-cream">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
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
                    </ProductPreviewModal>

                    <div className="flex flex-1 flex-col p-3 sm:p-5">
                      <Link
                        href={`/${shop.slug}`}
                        className="truncate text-[11px] font-extrabold uppercase tracking-wide text-emerald-700"
                      >
                        {shop.name}
                      </Link>

                      <ProductPreviewModal product={previewProduct}>
                        <h3 className="mt-1 cursor-pointer font-bold leading-5 hover:text-emerald-700 sm:text-lg">
                          {product.name}
                        </h3>
                      </ProductPreviewModal>

                      <p className="mt-1 text-sm font-extrabold text-ink sm:text-base">
                        {formatXofPrice(product.price_xof)}
                      </p>

                      {unavailable ? (
                        <span className="mt-auto pt-4 text-center text-xs font-extrabold text-red-700">
                          Rupture de stock
                        </span>
                      ) : (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] px-2 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#1fbd5b] sm:text-sm"
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

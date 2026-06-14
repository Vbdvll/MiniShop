import {
  ArrowRight,
  CheckCircle2,
  Eye,
  LogOut,
  Package,
  Plus,
  Settings,
  Share2,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth-actions";
import { publishShop } from "@/app/dashboard/shop-actions";
import { Logo } from "@/components/logo";
import { ShareShopButton } from "@/components/share-shop-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  let productCount = 0;
  if (shop) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id)
      .neq("status", "archived");
    productCount = count ?? 0;
  }

  const checklist = [
    { label: "Créer votre compte", done: true, href: null },
    {
      label: "Compléter le profil de la boutique",
      done: Boolean(shop),
      href: "/dashboard/boutique",
    },
    {
      label: "Ajouter votre premier produit",
      done: productCount > 0,
      href: shop ? "/dashboard/products/new" : null,
    },
    {
      label: "Publier et partager votre lien",
      done: shop?.status === "published",
      href: null,
    },
  ];
  const completedSteps = checklist.filter((item) => item.done).length;
  const progress = completedSteps * 25;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const publicShopUrl = shop ? `${siteUrl}/${shop.slug}` : null;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-ink">
      <header className="border-b border-ink/8 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink/55 sm:block">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="grid size-10 place-items-center rounded-xl border border-ink/10 text-ink/60 transition hover:bg-cream hover:text-ink"
                aria-label="Se déconnecter"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:px-12">
        <aside className="hidden lg:block">
          <nav className="space-y-1" aria-label="Navigation du tableau de bord">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl bg-emerald-700 px-3 py-3 text-sm font-bold text-white"
            >
              <Store size={18} aria-hidden="true" />
              Accueil
            </Link>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink/55 transition hover:bg-white hover:text-ink"
            >
              <Package size={18} aria-hidden="true" />
              Produits
            </Link>
            {shop?.status === "published" ? (
              <Link
                href={`/${shop.slug}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink/55 transition hover:bg-white hover:text-ink"
              >
                <Eye size={18} aria-hidden="true" />
                Voir la boutique
              </Link>
            ) : (
              <span className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink/35">
                <Eye size={18} aria-hidden="true" />
                Voir la boutique
              </span>
            )}
            <Link
              href="/dashboard/boutique"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-ink/55 transition hover:bg-white hover:text-ink"
            >
              <Settings size={18} aria-hidden="true" />
              Profil boutique
            </Link>
          </nav>
        </aside>

        <section>
          {success && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {success}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-700">
                {shop ? shop.name : "Bonjour"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {shop ? "Votre boutique prend forme" : "Créons votre boutique"}
              </h1>
              <p className="mt-2 text-ink/55">
                Complétez ces étapes pour partager votre catalogue.
              </p>
            </div>
            {shop ? (
              <Link
                href="/dashboard/products/new"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-extrabold text-white shadow-md shadow-emerald-900/10"
              >
                <Plus size={18} aria-hidden="true" />
                Ajouter un produit
              </Link>
            ) : (
              <Link
                href="/dashboard/boutique"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-extrabold text-white shadow-md shadow-emerald-900/10"
              >
                Créer ma boutique
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-ink/8 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">Mise en route</p>
                  <p className="mt-1 text-sm text-ink/50">
                    {completedSteps} étape{completedSteps > 1 ? "s" : ""} sur 4 terminée
                    {completedSteps > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  {progress} %
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/7">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-6 space-y-3">
                {checklist.map((item) => {
                  const content = (
                    <>
                      <span className="flex items-center gap-3 font-semibold">
                        <CheckCircle2
                          size={20}
                          className={item.done ? "text-emerald-600" : "text-ink/20"}
                          aria-hidden="true"
                        />
                        {item.label}
                      </span>
                      {!item.done && <ArrowRight size={17} className="text-ink/35" />}
                    </>
                  );

                  return item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-ink/7 px-4 py-3.5 transition hover:border-emerald-600/30 hover:bg-emerald-50/40"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-ink/7 px-4 py-3.5"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl bg-ink p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                  <Share2 size={22} aria-hidden="true" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                  {shop?.status === "published" ? "Publiée" : "Brouillon"}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold">Votre lien boutique</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {shop?.status === "published"
                  ? "Votre catalogue est en ligne et prêt à être partagé."
                  : shop
                    ? "Votre adresse est réservée. Publiez dès que votre catalogue est prêt."
                    : "Créez votre profil pour réserver votre adresse MiniShop."}
              </p>
              <div className="mt-6 break-all rounded-2xl border border-white/10 bg-white/7 p-4 text-sm font-semibold text-white/70">
                {publicShopUrl ?? `${siteUrl}/votre-boutique`}
              </div>
              {shop?.status === "published" && publicShopUrl ? (
                <ShareShopButton shopName={shop.name} url={publicShopUrl} />
              ) : shop && productCount > 0 ? (
                <form action={publishShop}>
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-xl bg-white px-4 py-3 font-extrabold text-ink transition hover:bg-cream"
                  >
                    Publier ma boutique
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 font-bold text-white/40"
                >
                  Ajouter un produit pour publier
                </button>
              )}
            </article>
          </div>

          <article className="mt-5 rounded-3xl border border-dashed border-ink/15 bg-white/55 px-6 py-10 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Package size={25} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold">
              {productCount === 0
                ? "Aucun produit pour le moment"
                : `${productCount} produit${productCount > 1 ? "s" : ""} dans votre catalogue`}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">
              Ajoutez votre premier produit avec une photo, un nom et un prix. Cela prend
              moins d’une minute.
            </p>
            {shop ? (
              <Link
                href="/dashboard/products"
                className="mt-5 inline-flex items-center gap-2 font-extrabold text-emerald-700"
              >
                Gérer mes produits
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/dashboard/boutique"
                className="mt-5 inline-flex items-center gap-2 font-extrabold text-emerald-700"
              >
                Créer d’abord ma boutique
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

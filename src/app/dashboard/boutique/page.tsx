import { ArrowLeft, Link2, MapPin, MessageCircle, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { saveShop } from "@/app/dashboard/shop-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profil boutique",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ShopProfilePage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("name, slug, description, whatsapp_number, address")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Retour au tableau de bord
        </Link>

        <div className="mt-6 rounded-[2rem] border border-ink/8 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Store size={23} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            {shop ? "Modifier votre boutique" : "Créer votre boutique"}
          </h1>
          <p className="mt-2 leading-7 text-ink/55">
            Ces informations seront visibles par vos clients sur votre catalogue.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </div>
          )}

          <form action={saveShop} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Nom de la boutique</span>
              <span className="relative block">
                <Store
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={shop?.name ?? ""}
                  placeholder="Fatou Cosmétiques"
                  className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Lien de la boutique</span>
              <span className="relative block">
                <Link2
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  name="slug"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={shop?.slug ?? ""}
                  placeholder="fatou-cosmetiques"
                  className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </span>
              <span className="mt-2 block text-xs text-ink/45">
                Utilisez un nom court, sans espace. Les accents seront retirés automatiquement.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Numéro WhatsApp</span>
              <span className="relative block">
                <MessageCircle
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  name="whatsappNumber"
                  type="tel"
                  required
                  defaultValue={shop?.whatsapp_number ?? ""}
                  placeholder="77 123 45 67"
                  className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Description <span className="font-normal text-ink/40">(facultatif)</span>
              </span>
              <textarea
                name="description"
                maxLength={500}
                rows={4}
                defaultValue={shop?.description ?? ""}
                placeholder="Présentez votre activité et vos produits en quelques phrases."
                className="w-full resize-none rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Localisation <span className="font-normal text-ink/40">(facultatif)</span>
              </span>
              <span className="relative block">
                <MapPin
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  name="address"
                  maxLength={200}
                  defaultValue={shop?.address ?? ""}
                  placeholder="Dakar, Sénégal"
                  className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </span>
            </label>

            <button
              type="submit"
              className="min-h-13 w-full rounded-2xl bg-emerald-700 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
            >
              {shop ? "Enregistrer les modifications" : "Créer ma boutique"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

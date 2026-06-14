import { ArrowLeft, PackagePlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter un produit",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProductPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
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

  if (!shop) {
    redirect("/dashboard/boutique?error=Créez votre boutique avant d'ajouter un produit.");
  }

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
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <PackagePlus size={23} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Ajouter un produit</h1>
          <p className="mt-2 leading-7 text-ink/55">
            Une photo claire, un nom et un prix suffisent pour commencer.
          </p>
          <ProductForm error={error} />
        </div>
      </div>
    </main>
  );
}

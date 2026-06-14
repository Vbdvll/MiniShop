"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { normalizeSenegalPhone, slugifyShopName } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

const shopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  slug: z
    .string()
    .trim()
    .min(2, "Le lien de boutique est trop court.")
    .max(80, "Le lien de boutique est trop long."),
  whatsappNumber: z.string().trim().min(8, "Le numéro WhatsApp est obligatoire."),
  description: z
    .string()
    .trim()
    .max(500, "La description ne peut pas dépasser 500 caractères."),
  address: z.string().trim().max(200, "L'adresse ne peut pas dépasser 200 caractères."),
});

function redirectWithError(message: string): never {
  redirect(`/dashboard/boutique?error=${encodeURIComponent(message)}`);
}

export async function saveShop(formData: FormData) {
  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    whatsappNumber: formData.get("whatsappNumber"),
    description: formData.get("description") ?? "",
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0].message);
  }

  const slug = slugifyShopName(parsed.data.slug);
  const whatsappNumber = normalizeSenegalPhone(parsed.data.whatsappNumber);

  if (slug.length < 2) {
    redirectWithError("Choisissez un lien contenant au moins 2 lettres ou chiffres.");
  }

  if (!whatsappNumber) {
    redirectWithError(
      "Saisissez un numéro valide, par exemple 77 123 45 67 ou +221 77 123 45 67.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const shop = {
    owner_id: user.id,
    name: parsed.data.name,
    slug,
    whatsapp_number: whatsappNumber,
    description: parsed.data.description || null,
    address: parsed.data.address || null,
  };

  const query = existingShop
    ? supabase.from("shops").update(shop).eq("id", existingShop.id)
    : supabase.from("shops").insert(shop);
  const { error } = await query;

  if (error) {
    if (error.code === "23505") {
      redirectWithError("Ce lien de boutique est déjà utilisé. Essayez un autre nom.");
    }

    redirectWithError("Impossible d'enregistrer la boutique pour le moment.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/boutique");
  redirect("/dashboard?success=Profil de boutique enregistré.");
}

export async function publishShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) {
    redirect("/dashboard/boutique?error=Créez votre boutique avant de la publier.");
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .in("status", ["active", "out_of_stock"]);

  if ((count ?? 0) === 0) {
    redirect("/dashboard/products?error=Ajoutez au moins un produit avant de publier.");
  }

  const { error } = await supabase
    .from("shops")
    .update({ status: "published" })
    .eq("id", shop.id);

  if (error) {
    redirect("/dashboard?error=Impossible de publier la boutique pour le moment.");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${shop.slug}`);
  redirect("/dashboard?success=Boutique publiée. Votre lien est maintenant accessible.");
}

"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseXofPrice, slugifyProductName } from "@/lib/product";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(120, "Le nom ne peut pas dépasser 120 caractères."),
  price: z.string().trim().min(1, "Le prix est obligatoire."),
  description: z
    .string()
    .trim()
    .max(1000, "La description ne peut pas dépasser 1000 caractères."),
  reference: z
    .string()
    .trim()
    .max(50, "La référence ne peut pas dépasser 50 caractères."),
});

function redirectWithError(message: string): never {
  redirect(`/dashboard/products/new?error=${encodeURIComponent(message)}`);
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description") ?? "",
    reference: formData.get("reference") ?? "",
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0].message);
  }

  const price = parseXofPrice(parsed.data.price);
  if (price === null) {
    redirectWithError("Saisissez un prix valide en FCFA.");
  }

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const widths = formData.getAll("imageWidth").map(Number);
  const heights = formData.getAll("imageHeight").map(Number);

  if (images.length > 3) {
    redirectWithError("Un produit ne peut pas contenir plus de 3 images.");
  }

  const invalidImage = images.some(
    (image) => image.type !== "image/webp" || image.size > 500_000,
  );
  if (invalidImage) {
    redirectWithError("Une image est invalide ou dépasse la limite de 500 Ko.");
  }

  if (
    widths.length !== images.length ||
    heights.length !== images.length ||
    widths.some((value) => !Number.isInteger(value) || value < 1 || value > 4096) ||
    heights.some((value) => !Number.isInteger(value) || value < 1 || value > 4096)
  ) {
    redirectWithError("Les dimensions d'une image sont invalides.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) {
    redirect("/dashboard/boutique?error=Créez votre boutique avant d'ajouter un produit.");
  }

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .neq("status", "archived");

  if ((count ?? 0) >= 30) {
    redirectWithError("Votre boutique a atteint la limite de 30 produits.");
  }

  const baseSlug = slugifyProductName(parsed.data.name);
  const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      shop_id: shop.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      price_xof: price,
      reference: parsed.data.reference.toUpperCase() || null,
      status: "active",
      position: count ?? 0,
    })
    .select("id")
    .single();

  if (productError || !product) {
    redirectWithError("Impossible de créer ce produit pour le moment.");
  }

  const uploadedPaths: string[] = [];
  try {
    for (const [index, image] of images.entries()) {
      const storagePath = `${user.id}/${product.id}/${randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, image, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }
      uploadedPaths.push(storagePath);

      const { error: metadataError } = await supabase.from("product_images").insert({
        product_id: product.id,
        storage_path: storagePath,
        width: widths[index],
        height: heights[index],
        byte_size: image.size,
        alt_text: parsed.data.name,
        position: index,
      });

      if (metadataError) {
        throw metadataError;
      }
    }
  } catch {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("product-images").remove(uploadedPaths);
    }
    await supabase.from("products").delete().eq("id", product.id);
    redirectWithError("Le produit n'a pas pu être enregistré avec ses images.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?success=Produit ajouté au catalogue.");
}

export async function archiveProduct(formData: FormData) {
  const productId = z.uuid().safeParse(formData.get("productId"));
  if (!productId.success) {
    redirect("/dashboard/products?error=Produit invalide.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!shop) {
    redirect("/dashboard");
  }

  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId.data)
    .eq("shop_id", shop.id);

  if (error) {
    redirect("/dashboard/products?error=Impossible d'archiver ce produit.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products?success=Produit archivé.");
}

export async function updateProduct(formData: FormData) {
  const productId = z.uuid().safeParse(formData.get("productId"));
  const parsed = productSchema.extend({
    status: z.enum(["active", "out_of_stock"]),
  }).safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description") ?? "",
    reference: formData.get("reference") ?? "",
    status: formData.get("status"),
  });

  if (!productId.success) {
    redirect("/dashboard/products?error=Produit invalide.");
  }
  if (!parsed.success) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        parsed.error.issues[0].message,
      )}`,
    );
  }

  const price = parseXofPrice(parsed.data.price);
  if (price === null) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        "Saisissez un prix valide en FCFA.",
      )}`,
    );
  }

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

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_xof: price,
      reference: parsed.data.reference.toUpperCase() || null,
      status: parsed.data.status,
    })
    .eq("id", productId.data)
    .eq("shop_id", shop.id);

  if (error) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        "Impossible de modifier ce produit.",
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId.data}/edit`);
  redirect("/dashboard/products?success=Produit mis à jour.");
}

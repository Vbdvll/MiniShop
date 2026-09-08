"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseXofPrice, slugifyProductName } from "@/lib/product";
import { createClient } from "@/lib/supabase/server";

/*
 * Limite maximale d'une image envoyée au serveur.
 *
 * Supabase Storage doit également être configuré avec une limite
 * compatible avec cette valeur.
 */
const MAX_IMAGE_BYTES = 500_000;

/*
 * Limite maximale du nombre d'images par produit.
 */
const MAX_IMAGES = 3;

/*
 * Dimensions maximales acceptées.
 */
const MAX_IMAGE_DIMENSION = 4096;

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(120, "Le nom ne peut pas dépasser 120 caractères."),

  price: z
    .string()
    .trim()
    .min(1, "Le prix est obligatoire."),

  description: z
    .string()
    .trim()
    .max(
      1000,
      "La description ne peut pas dépasser 1000 caractères.",
    ),

  reference: z
    .string()
    .trim()
    .max(
      50,
      "La référence ne peut pas dépasser 50 caractères.",
    ),
});

/**
 * Redirige vers le formulaire avec un message d'erreur.
 */
function redirectWithError(
  message: string,
): never {
  redirect(
    `/dashboard/products/new?error=${encodeURIComponent(
      message,
    )}`,
  );
}

/**
 * Création d'un produit.
 */
export async function createProduct(
  formData: FormData,
) {
  /*
   * -----------------------------
   * 1. Validation du formulaire
   * -----------------------------
   */
  const parsed =
    productSchema.safeParse({
      name: formData.get("name"),
      price: formData.get("price"),
      description:
        formData.get("description") ?? "",
      reference:
        formData.get("reference") ?? "",
    });

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0].message,
    );
  }

  /*
   * -----------------------------
   * 2. Validation du prix
   * -----------------------------
   */
  const price =
    parseXofPrice(
      parsed.data.price,
    );

  if (price === null) {
    redirectWithError(
      "Saisissez un prix valide en FCFA.",
    );
  }

  /*
   * -----------------------------
   * 3. Récupération des images
   * -----------------------------
   *
   * On accepte uniquement les vrais fichiers.
   */
  const images =
    formData
      .getAll("images")
      .filter(
        (
          entry,
        ): entry is File =>
          entry instanceof File &&
          entry.size > 0,
      );

  /*
   * Les dimensions sont envoyées par product-form.tsx
   * après compression.
   */
  const widths =
    formData
      .getAll("imageWidth")
      .map(Number);

  const heights =
    formData
      .getAll("imageHeight")
      .map(Number);

  /*
   * -----------------------------
   * 4. Nombre maximum d'images
   * -----------------------------
   */
  if (
    images.length > MAX_IMAGES
  ) {
    redirectWithError(
      `Un produit ne peut pas contenir plus de ${MAX_IMAGES} images.`,
    );
  }

  /*
   * -----------------------------
   * 5. Validation serveur des images
   * -----------------------------
   *
   * Très important :
   * même si le navigateur compresse les images,
   * le serveur doit refaire toutes les vérifications.
   */
  const invalidImage =
    images.some(
      (image) =>
        image.type !== "image/webp" ||
        image.size <= 0 ||
        image.size >
          MAX_IMAGE_BYTES,
    );

  if (invalidImage) {
    redirectWithError(
      "Une image est invalide ou dépasse la limite de 500 Ko.",
    );
  }

  /*
   * -----------------------------
   * 6. Validation des dimensions
   * -----------------------------
   */
  const invalidDimensions =
    widths.length !==
      images.length ||
    heights.length !==
      images.length ||
    widths.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 1 ||
        value >
          MAX_IMAGE_DIMENSION,
    ) ||
    heights.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 1 ||
        value >
          MAX_IMAGE_DIMENSION,
    );

  if (invalidDimensions) {
    redirectWithError(
      "Les dimensions d'une image sont invalides.",
    );
  }

  /*
   * -----------------------------
   * 7. Client Supabase
   * -----------------------------
   */
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  /*
   * -----------------------------
   * 8. Récupération de la boutique
   * -----------------------------
   */
  const { data: shop } =
    await supabase
      .from("shops")
      .select("id")
      .eq(
        "owner_id",
        user.id,
      )
      .maybeSingle();

  if (!shop) {
    redirect(
      "/dashboard/boutique?error=Créez votre boutique avant d'ajouter un produit.",
    );
  }

  /*
   * -----------------------------
   * 9. Limite de produits
   * -----------------------------
   */
  const { count } =
    await supabase
      .from("products")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "shop_id",
        shop.id,
      )
      .neq(
        "status",
        "archived",
      );

  if (
    (count ?? 0) >= 30
  ) {
    redirectWithError(
      "Votre boutique a atteint la limite de 30 produits.",
    );
  }

  /*
   * -----------------------------
   * 10. Génération du slug
   * -----------------------------
   */
  const baseSlug =
    slugifyProductName(
      parsed.data.name,
    );

  const slug =
    `${baseSlug}-${randomUUID().slice(
      0,
      6,
    )}`;

  /*
   * -----------------------------
   * 11. Création du produit
   * -----------------------------
   */
  const {
    data: product,
    error: productError,
  } =
    await supabase
      .from("products")
      .insert({
        shop_id:
          shop.id,

        name:
          parsed.data.name,

        slug,

        description:
          parsed.data.description ||
          null,

        price_xof:
          price,

        reference:
          parsed.data.reference
            .toUpperCase() ||
          null,

        status:
          "active",

        position:
          count ?? 0,
      })
      .select("id")
      .single();

  if (
    productError ||
    !product
  ) {
    redirectWithError(
      "Impossible de créer ce produit pour le moment.",
    );
  }

  /*
   * -----------------------------
   * 12. Upload des images
   * -----------------------------
   *
   * On garde la liste des fichiers déjà uploadés
   * pour pouvoir effectuer un rollback si une image échoue.
   */
  const uploadedPaths: string[] =
    [];

  try {
    for (
      const [
        index,
        image,
      ] of images.entries()
    ) {
      /*
       * Double sécurité avant upload.
       */
      if (
        image.type !==
          "image/webp" ||
        image.size >
          MAX_IMAGE_BYTES
      ) {
        throw new Error(
          "Image invalide.",
        );
      }

      /*
       * Nom unique dans Supabase Storage.
       */
      const storagePath =
        `${user.id}/${product.id}/${randomUUID()}.webp`;

      /*
       * Upload vers le bucket.
       */
      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "product-images",
          )
          .upload(
            storagePath,
            image,
            {
              contentType:
                "image/webp",

              upsert:
                false,
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * On mémorise le chemin
       * pour pouvoir supprimer l'image en cas d'échec.
       */
      uploadedPaths.push(
        storagePath,
      );

      /*
       * -----------------------------
       * Enregistrement des métadonnées
       * -----------------------------
       */
      const {
        error:
          metadataError,
      } =
        await supabase
          .from(
            "product_images",
          )
          .insert({
            product_id:
              product.id,

            storage_path:
              storagePath,

            width:
              widths[index],

            height:
              heights[index],

            byte_size:
              image.size,

            alt_text:
              parsed.data
                .name,

            position:
              index,
          });

      if (metadataError) {
        throw metadataError;
      }
    }
  } catch {
    /*
     * -----------------------------
     * 13. Rollback
     * -----------------------------
     *
     * Si une image échoue :
     * - suppression des images déjà uploadées ;
     * - suppression du produit ;
     * - retour au formulaire avec erreur.
     */
    if (
      uploadedPaths.length >
      0
    ) {
      await supabase.storage
        .from(
          "product-images",
        )
        .remove(
          uploadedPaths,
        );
    }

    await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        product.id,
      );

    redirectWithError(
      "Le produit n'a pas pu être enregistré avec ses images.",
    );
  }

  /*
   * -----------------------------
   * 14. Rafraîchissement des pages
   * -----------------------------
   */
  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/dashboard/products",
  );

  /*
   * -----------------------------
   * 15. Redirection
   * -----------------------------
   */
  redirect(
    "/dashboard/products?success=Produit ajouté au catalogue.",
  );
}

/**
 * Archive un produit.
 */
export async function archiveProduct(
  formData: FormData,
) {
  const productId =
    z
      .uuid()
      .safeParse(
        formData.get(
          "productId",
        ),
      );

  if (
    !productId.success
  ) {
    redirect(
      "/dashboard/products?error=Produit invalide.",
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } =
    await supabase
      .from("shops")
      .select("id")
      .eq(
        "owner_id",
        user.id,
      )
      .maybeSingle();

  if (!shop) {
    redirect(
      "/dashboard",
    );
  }

  const { error } =
    await supabase
      .from("products")
      .update({
        status:
          "archived",
      })
      .eq(
        "id",
        productId.data,
      )
      .eq(
        "shop_id",
        shop.id,
      );

  if (error) {
    redirect(
      "/dashboard/products?error=Impossible d'archiver ce produit.",
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/dashboard/products",
  );

  redirect(
    "/dashboard/products?success=Produit archivé.",
  );
}

/**
 * Modifie un produit existant.
 */
export async function updateProduct(
  formData: FormData,
) {
  const productId =
    z
      .uuid()
      .safeParse(
        formData.get(
          "productId",
        ),
      );

  const parsed =
    productSchema
      .extend({
        status:
          z.enum([
            "active",
            "out_of_stock",
          ]),
      })
      .safeParse({
        name:
          formData.get(
            "name",
          ),

        price:
          formData.get(
            "price",
          ),

        description:
          formData.get(
            "description",
          ) ?? "",

        reference:
          formData.get(
            "reference",
          ) ?? "",

        status:
          formData.get(
            "status",
          ),
      });

  if (
    !productId.success
  ) {
    redirect(
      "/dashboard/products?error=Produit invalide.",
    );
  }

  if (
    !parsed.success
  ) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        parsed.error.issues[0]
          .message,
      )}`,
    );
  }

  const price =
    parseXofPrice(
      parsed.data.price,
    );

  if (price === null) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        "Saisissez un prix valide en FCFA.",
      )}`,
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: shop } =
    await supabase
      .from("shops")
      .select("id")
      .eq(
        "owner_id",
        user.id,
      )
      .maybeSingle();

  if (!shop) {
    redirect(
      "/dashboard",
    );
  }

  const { error } =
    await supabase
      .from("products")
      .update({
        name:
          parsed.data.name,

        description:
          parsed.data
            .description ||
          null,

        price_xof:
          price,

        reference:
          parsed.data.reference
            .toUpperCase() ||
          null,

        status:
          parsed.data.status,
      })
      .eq(
        "id",
        productId.data,
      )
      .eq(
        "shop_id",
        shop.id,
      );

  if (error) {
    redirect(
      `/dashboard/products/${productId.data}/edit?error=${encodeURIComponent(
        "Impossible de modifier ce produit.",
      )}`,
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/dashboard/products",
  );

  revalidatePath(
    `/dashboard/products/${productId.data}/edit`,
  );

  redirect(
    "/dashboard/products?success=Produit mis à jour.",
  );
}

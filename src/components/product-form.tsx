"use client";

import { ImagePlus, LoaderCircle, PackagePlus, X } from "lucide-react";
import { useState, useTransition } from "react";

import { createProduct } from "@/app/dashboard/products/product-actions";

type PreparedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

const MAX_IMAGES = 3;

// Limite maximale de dimensions générées.
const MAX_DIMENSION = 1600;

// Limites de taille.
const MAX_IMAGE_BYTES = 500_000;
const TARGET_IMAGE_BYTES = 350_000;

// Marge de sécurité pour éviter un rejet à 500 Ko côté serveur/storage.
const SAFE_IMAGE_BYTES = 490_000;

async function compressImage(source: File): Promise<{
  file: File;
  width: number;
  height: number;
}> {
  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(source);

    let width = bitmap.width;
    let height = bitmap.height;

    // Première réduction si l'image est très grande.
    const initialScale = Math.min(
      1,
      MAX_DIMENSION / Math.max(width, height),
    );

    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    /*
     * Stratégie :
     * 1. On conserve d'abord une bonne résolution.
     * 2. On baisse progressivement la qualité WebP.
     * 3. Si ce n'est toujours pas assez petit, on réduit la résolution.
     * 4. On recommence.
     */
    for (let resizeAttempt = 0; resizeAttempt < 10; resizeAttempt += 1) {
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Impossible de préparer cette image.");
      }

      context.drawImage(bitmap, 0, 0, width, height);

      // On garde le meilleur candidat sous la limite de sécurité.
      let safeCandidate: Blob | null = null;

      /*
       * Qualités essayées :
       *
       * 0.86
       * 0.78
       * 0.70
       * 0.62
       * 0.54
       * 0.46
       * 0.38
       * 0.30
       * 0.22
       */
      for (let qualityIndex = 0; qualityIndex < 9; qualityIndex += 1) {
        const quality = Math.max(
          0.22,
          0.86 - qualityIndex * 0.08,
        );

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            resolve,
            "image/webp",
            quality,
          );
        });

        if (!blob) {
          continue;
        }

        // Objectif idéal atteint.
        if (blob.size <= TARGET_IMAGE_BYTES) {
          const baseName =
            source.name.replace(/\.[^.]+$/, "") || "produit";

          return {
            file: new File(
              [blob],
              `${baseName}.webp`,
              {
                type: "image/webp",
              },
            ),
            width,
            height,
          };
        }

        /*
         * Image acceptable mais au-dessus de la cible.
         * On garde la meilleure candidate et on continue
         * pour essayer d'obtenir encore mieux.
         */
        if (blob.size <= SAFE_IMAGE_BYTES) {
          safeCandidate = blob;
        }
      }

      /*
       * On a trouvé une image sous la limite de sécurité.
       * On peut l'envoyer.
       */
      if (safeCandidate) {
        const baseName =
          source.name.replace(/\.[^.]+$/, "") || "produit";

        return {
          file: new File(
            [safeCandidate],
            `${baseName}.webp`,
            {
              type: "image/webp",
            },
          ),
          width,
          height,
        };
      }

      /*
       * Toujours trop grosse.
       *
       * On réduit maintenant les dimensions de 20 %,
       * puis on recommence toute la procédure.
       */
      const nextWidth = Math.max(
        480,
        Math.round(width * 0.8),
      );

      const nextHeight = Math.max(
        480,
        Math.round(height * 0.8),
      );

      if (
        nextWidth === width &&
        nextHeight === height
      ) {
        break;
      }

      width = nextWidth;
      height = nextHeight;
    }

    /*
     * Dernier essai avec une résolution déjà fortement réduite
     * et une qualité basse.
     */
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Impossible de préparer cette image.");
    }

    context.drawImage(
      bitmap,
      0,
      0,
      width,
      height,
    );

    const finalBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        resolve,
        "image/webp",
        0.18,
      );
    });

    if (!finalBlob || finalBlob.size > MAX_IMAGE_BYTES) {
      throw new Error(
        "Cette image ne peut pas être suffisamment compressée. Essayez une autre image.",
      );
    }

    const baseName =
      source.name.replace(/\.[^.]+$/, "") || "produit";

    return {
      file: new File(
        [finalBlob],
        `${baseName}.webp`,
        {
          type: "image/webp",
        },
      ),
      width,
      height,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Impossible de préparer cette image.",
    );
  } finally {
    bitmap?.close();
  }
}

export function ProductForm({
  error,
}: {
  error?: string;
}) {
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  async function prepareImages(
    files: FileList | null,
  ) {
    if (!files) {
      return;
    }

    setImageError("");
    setIsPreparing(true);

    try {
      const availableSlots =
        MAX_IMAGES - images.length;

      const selected = Array.from(files).slice(
        0,
        availableSlots,
      );

      const prepared = await Promise.all(
        selected.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error(
              "Sélectionnez uniquement des images.",
            );
          }

          const compressed = await compressImage(file);

          return {
            ...compressed,
            previewUrl: URL.createObjectURL(
              compressed.file,
            ),
          };
        }),
      );

      setImages((current) => [
        ...current,
        ...prepared,
      ]);
    } catch (caughtError) {
      setImageError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de préparer les images.",
      );
    } finally {
      setIsPreparing(false);
    }
  }

  function removeImage(index: number) {
    setImages((current) => {
      const image = current[index];

      if (image) {
        URL.revokeObjectURL(
          image.previewUrl,
        );
      }

      return current.filter(
        (_, itemIndex) => itemIndex !== index,
      );
    });
  }

  function submitProduct(formData: FormData) {
    images.forEach((image) => {
      formData.append(
        "images",
        image.file,
      );

      formData.append(
        "imageWidth",
        String(image.width),
      );

      formData.append(
        "imageHeight",
        String(image.height),
      );
    });

    startTransition(() => {
      void createProduct(formData);
    });
  }

  return (
    <form
      action={submitProduct}
      className="mt-7 space-y-5"
    >
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold">
            Photos du produit
          </span>

          <span className="text-xs font-medium text-ink/40">
            {images.length}/3
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.previewUrl}
              className="relative aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt={`Aperçu ${index + 1}`}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink/80 text-white"
                aria-label={`Retirer l'image ${index + 1}`}
              >
                <X
                  size={15}
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-emerald-700/35 bg-emerald-50/40 text-center text-emerald-700 transition hover:bg-emerald-50">
              <span className="flex flex-col items-center gap-2 px-2 text-xs font-bold">
                {isPreparing ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={22}
                    aria-hidden="true"
                  />
                ) : (
                  <ImagePlus
                    size={22}
                    aria-hidden="true"
                  />
                )}

                {isPreparing
                  ? "Compression..."
                  : "Ajouter"}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={isPreparing}
                onChange={(event) => {
                  void prepareImages(
                    event.target.files,
                  );

                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>

        {imageError && (
          <p className="mt-2 text-sm font-medium text-red-700">
            {imageError}
          </p>
        )}

        <p className="mt-2 text-xs leading-5 text-ink/45">
          Jusqu’à 3 photos. Elles sont automatiquement
          allégées avant l’envoi.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          Nom du produit
        </span>

        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="Savon au karité"
          className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          Prix en FCFA
        </span>

        <input
          name="price"
          type="text"
          inputMode="numeric"
          required
          placeholder="5 000"
          className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          Description{" "}
          <span className="font-normal text-ink/40">
            (facultatif)
          </span>
        </span>

        <textarea
          name="description"
          maxLength={1000}
          rows={4}
          placeholder="Décrivez les bénéfices, la taille ou la matière."
          className="w-full resize-none rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          Référence{" "}
          <span className="font-normal text-ink/40">
            (facultatif)
          </span>
        </span>

        <input
          name="reference"
          maxLength={50}
          placeholder="SAV-001"
          className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/35 px-4 py-3 uppercase outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
        />
      </label>

      <button
        type="submit"
        disabled={
          isPreparing || isSubmitting
        }
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle
            className="animate-spin"
            size={19}
            aria-hidden="true"
          />
        ) : (
          <PackagePlus
            size={19}
            aria-hidden="true"
          />
        )}

        {isSubmitting
          ? "Publication..."
          : "Publier le produit"}
      </button>
    </form>
  );
}

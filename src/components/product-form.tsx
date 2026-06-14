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
const MAX_DIMENSION = 1400;
const TARGET_BYTES = 350_000;

async function compressImage(source: File) {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Impossible de préparer cette image.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    quality -= 0.1;
  } while (blob && blob.size > TARGET_BYTES && quality >= 0.42);

  if (!blob || blob.size > 500_000) {
    throw new Error("Cette image reste trop lourde après compression.");
  }

  const baseName = source.name.replace(/\.[^.]+$/, "") || "produit";
  return {
    file: new File([blob], `${baseName}.webp`, { type: "image/webp" }),
    width,
    height,
  };
}

export function ProductForm({ error }: { error?: string }) {
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  async function prepareImages(files: FileList | null) {
    if (!files) return;
    setImageError("");
    setIsPreparing(true);

    try {
      const availableSlots = MAX_IMAGES - images.length;
      const selected = Array.from(files).slice(0, availableSlots);
      const prepared = await Promise.all(
        selected.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error("Sélectionnez uniquement des images.");
          }
          const compressed = await compressImage(file);
          return {
            ...compressed,
            previewUrl: URL.createObjectURL(compressed.file),
          };
        }),
      );
      setImages((current) => [...current, ...prepared]);
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
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function submitProduct(formData: FormData) {
    images.forEach((image) => {
      formData.append("images", image.file);
      formData.append("imageWidth", String(image.width));
      formData.append("imageHeight", String(image.height));
    });

    startTransition(() => {
      void createProduct(formData);
    });
  }

  return (
    <form action={submitProduct} className="mt-7 space-y-5">
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
          <span className="text-sm font-bold">Photos du produit</span>
          <span className="text-xs font-medium text-ink/40">{images.length}/3</span>
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
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-emerald-700/35 bg-emerald-50/40 text-center text-emerald-700 transition hover:bg-emerald-50">
              <span className="flex flex-col items-center gap-2 px-2 text-xs font-bold">
                {isPreparing ? (
                  <LoaderCircle className="animate-spin" size={22} aria-hidden="true" />
                ) : (
                  <ImagePlus size={22} aria-hidden="true" />
                )}
                {isPreparing ? "Compression..." : "Ajouter"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={isPreparing}
                onChange={(event) => {
                  void prepareImages(event.target.files);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>
        {imageError && <p className="mt-2 text-sm font-medium text-red-700">{imageError}</p>}
        <p className="mt-2 text-xs leading-5 text-ink/45">
          Jusqu’à 3 photos. Elles sont automatiquement allégées avant l’envoi.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">Nom du produit</span>
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
        <span className="mb-2 block text-sm font-bold">Prix en FCFA</span>
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
          Description <span className="font-normal text-ink/40">(facultatif)</span>
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
          Référence <span className="font-normal text-ink/40">(facultatif)</span>
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
        disabled={isPreparing || isSubmitting}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={19} aria-hidden="true" />
        ) : (
          <PackagePlus size={19} aria-hidden="true" />
        )}
        {isSubmitting ? "Publication..." : "Publier le produit"}
      </button>
    </form>
  );
}

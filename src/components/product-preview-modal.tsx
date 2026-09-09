"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type ProductPreviewImage = {
  url: string;
  position: number;
};

type ProductPreview = {
  name: string;
  description?: string | null;
  priceLabel: string;
  reference?: string | null;
  shopName: string;
  status: "active" | "out_of_stock";
  images: ProductPreviewImage[];
  whatsappUrl: string;
};

type ProductPreviewModalProps = {
  product: ProductPreview;
  children: ReactNode;
};

export function ProductPreviewModal({
  product,
  children,
}: ProductPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const images = product.images;
  const currentImage = images[activeImage] ?? null;

  const openModal = () => {
    setActiveImage(0);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const showPreviousImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const showNextImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, images.length]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/15"
        aria-label={`Voir ${product.name}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Détails de ${product.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="relative flex h-[92dvh] max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl lg:flex-row">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-30 grid size-9 place-items-center rounded-full bg-ink/75 text-white shadow-md backdrop-blur transition hover:bg-ink sm:right-4 sm:top-4 sm:size-10"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="flex h-[39dvh] min-h-0 shrink-0 flex-col bg-[#f4f1e9] sm:h-[46dvh] lg:h-auto lg:w-[58%] lg:shrink">
              <div className="relative flex min-h-0 flex-1 items-center justify-center px-5 py-4 sm:px-8 sm:py-6">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage.url}
                    alt={product.name}
                    className="h-full w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-sm font-semibold text-ink/30">
                    Aucune image disponible
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Image précédente"
                      className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md sm:left-5 sm:size-11"
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Image suivante"
                      className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md sm:right-5 sm:size-11"
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="shrink-0 border-t border-ink/8 bg-white/80 px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="flex gap-2 overflow-x-auto pb-0.5">
                    {images.map((image, index) => (
                      <button
                        key={`${image.position}-${image.url}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Voir l'image ${index + 1}`}
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-cream sm:h-16 sm:w-16 ${
                          activeImage === index
                            ? "border-emerald-700"
                            : "border-transparent"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:w-[42%]">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 sm:px-7 sm:pt-7 lg:px-8 lg:pt-8">
                <p className="pr-10 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
                  {product.shopName}
                </p>

                <h2 className="mt-2 pr-8 text-[1.4rem] font-bold leading-tight tracking-tight sm:text-2xl lg:text-3xl">
                  {product.name}
                </h2>

                <p className="mt-3 text-2xl font-extrabold text-emerald-700 sm:mt-4 sm:text-3xl">
                  {product.priceLabel}
                </p>

                <div
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${
                    product.status === "out_of_stock"
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {product.status === "out_of_stock"
                    ? "Rupture de stock"
                    : "Disponible"}
                </div>

                <div className="mt-6 border-t border-ink/8 pt-5 sm:mt-7 sm:pt-6">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink/55">
                    Description
                  </h3>

                  {product.description ? (
                    <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-ink/60 sm:text-sm sm:leading-7">
                      {product.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-ink/40">
                      Aucune description renseignée pour ce produit.
                    </p>
                  )}
                </div>

                {product.reference && (
                  <div className="mt-5 border-t border-ink/8 pt-5 sm:mt-6 sm:pt-6">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                      Référence
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {product.reference}
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-ink/8 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:py-4 lg:px-8">
                {product.status === "out_of_stock" ? (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink/5 px-5 py-3 text-sm font-extrabold text-ink/50"
                  >
                    Fermer
                  </button>
                ) : (
                  <a
                    href={product.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-green-900/10 transition hover:bg-[#1fbd5b]"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Commander sur WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-2 flex min-h-9 w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-ink/45 transition hover:bg-ink/5 hover:text-ink"
                >
                  Continuer mes achats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

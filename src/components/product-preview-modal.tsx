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

export function ProductPreviewModal({ product, children }: ProductPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = product.images;
  const currentImage = images[activeIndex] ?? images[0] ?? null;

  function openModal() {
    setActiveIndex(0);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function previousImage() {
    if (images.length < 2) return;
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function nextImage() {
    if (images.length < 2) return;
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") previousImage();
      if (event.key === "ArrowRight") nextImage();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, images.length]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20"
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
              className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full bg-ink/75 text-white backdrop-blur transition hover:bg-ink sm:right-4 sm:top-4"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <section className="flex h-[40dvh] max-h-[360px] min-h-0 shrink-0 flex-col bg-[#f4f1e9] sm:h-[46dvh] sm:max-h-none lg:h-auto lg:w-[58%]">
              <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage.url}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-sm font-semibold text-ink/30">
                    Aucune image disponible
                  </p>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousImage}
                      aria-label="Image précédente"
                      className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg sm:left-5 sm:size-10"
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Image suivante"
                      className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg sm:right-5 sm:size-10"
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-ink/8 bg-white/75 px-3 py-2.5 sm:px-4 sm:py-3">
                  {images.map((image, index) => (
                    <button
                      key={`${image.position}-${image.url}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Voir l'image ${index + 1}`}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-cream sm:h-16 sm:w-16 ${
                        activeIndex === index
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
              )}
            </section>

            <section className="flex min-h-0 flex-1 flex-col lg:w-[42%]">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5 sm:px-7 sm:pb-7 sm:pt-7 lg:px-8">
                <p className="pr-12 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
                  {product.shopName}
                </p>

                <h2 className="mt-2 pr-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {product.name}
                </h2>

                <p className="mt-3 text-2xl font-extrabold text-emerald-700 sm:text-3xl">
                  {product.priceLabel}
                </p>

                <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                  {product.status === "out_of_stock"
                    ? "Rupture de stock"
                    : "Disponible"}
                </div>

                <div className="mt-6 border-t border-ink/8 pt-5 sm:mt-7 sm:pt-6">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink/50">
                    Description
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/65 sm:text-[15px] sm:leading-7">
                    {product.description ||
                      "Aucune description renseignée pour ce produit."}
                  </p>
                </div>

                {product.reference && (
                  <div className="mt-6 border-t border-ink/8 pt-5 sm:mt-7 sm:pt-6">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink/50">
                      Référence
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink">
                      {product.reference}
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-ink/8 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:p-6">
                {product.status === "out_of_stock" ? (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="min-h-12 w-full rounded-2xl bg-ink/5 px-5 py-3 text-sm font-extrabold text-ink/50"
                  >
                    Fermer
                  </button>
                ) : (
                  <a
                    href={product.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeModal}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-green-900/10 transition hover:bg-[#1fbd5b]"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Commander sur WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-2 min-h-10 w-full rounded-xl px-4 py-2 text-sm font-bold text-ink/45 transition hover:bg-ink/5 hover:text-ink"
                >
                  Continuer mes achats
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

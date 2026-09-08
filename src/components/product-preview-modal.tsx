"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProductPreviewImage = {
  url: string;
  position: number;
};

type ProductPreviewModalProps = {
  product: {
    name: string;
    description?: string | null;
    priceLabel: string;
    reference?: string | null;
    shopName: string;
    status: "active" | "out_of_stock";
    images: ProductPreviewImage[];
    whatsappUrl: string;
  };
  children: React.ReactNode;
};

export function ProductPreviewModal({
  product,
  children,
}: ProductPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const images =
    product.images.length > 0
      ? product.images
      : [];

  const currentImage =
    images[activeImage] ?? images[0];

  function openModal() {
    setActiveImage(0);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function showPreviousImage() {
    if (images.length <= 1) {
      return;
    }

    setActiveImage((current) =>
      current === 0
        ? images.length - 1
        : current - 1,
    );
  }

  function showNextImage() {
    if (images.length <= 1) {
      return;
    }

    setActiveImage((current) =>
      current === images.length - 1
        ? 0
        : current + 1,
    );
  }

  /*
   * Fermeture avec la touche Échap.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        closeModal();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    /*
     * Empêche le scroll de la page derrière le modal.
     */
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, images.length]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="block w-full text-left"
        aria-label={`Voir les détails de ${product.name}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Détails du produit ${product.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[90vh] lg:flex-row">
            {/* Bouton fermer */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full bg-ink/80 text-white shadow-lg backdrop-blur transition hover:bg-ink"
            >
              <X
                size={19}
                aria-hidden="true"
              />
            </button>

            {/* Galerie */}
            <div className="flex min-h-0 flex-1 flex-col bg-[#f4f1e9] lg:w-[58%]">
              <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage.url}
                    alt={product.name}
                    className="max-h-[58vh] w-full rounded-2xl object-contain sm:max-h-[64vh]"
                  />
                ) : (
                  <div className="grid min-h-64 place-items-center text-sm font-semibold text-ink/30">
                    Aucune image disponible
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Image précédente"
                      className="absolute left-5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg transition hover:scale-105"
                    >
                      <ChevronLeft
                        size={22}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Image suivante"
                      className="absolute right-5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-lg transition hover:scale-105"
                    >
                      <ChevronRight
                        size={22}
                        aria-hidden="true"
                      />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-ink/8 bg-white/70 p-3 sm:p-4">
                  {images.map(
                    (image, index) => (
                      <button
                        key={`${image.position}-${image.url}`}
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            index,
                          )
                        }
                        aria-label={`Voir l'image ${
                          index + 1
                        }`}
                        className={[
                          "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-cream transition sm:h-20 sm:w-20",
                          activeImage === index
                            ? "border-emerald-700"
                            : "border-transparent",
                        ].join(" ")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Informations produit */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7 lg:w-[42%] lg:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                {product.shopName}
              </p>

              <h2 className="mt-2 pr-10 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {product.name}
              </h2>

              <p className="mt-4 text-2xl font-extrabold text-emerald-700 sm:text-3xl">
                {product.priceLabel}
              </p>

              {product.status ===
              "out_of_stock" ? (
                <div className="mt-4 inline-flex w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700">
                  Rupture de stock
                </div>
              ) : (
                <div className="mt-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                  Disponible
                </div>
              )}

              <div className="mt-7 border-t border-ink/8 pt-6">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink/60">
                  Description
                </h3>

                {product.description ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/60 sm:text-base">
                    {product.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink/40">
                    Aucune description renseignée
                    pour ce produit.
                  </p>
                )}
              </div>

              {product.reference && (
                <div className="mt-6 border-t border-ink/8 pt-6">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink/45">
                    Référence
                  </p>

                  <p className="mt-1 text-sm font-bold text-ink">
                    {product.reference}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-8">
                {product.status ===
                "out_of_stock" ? (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex min-h-13 w-full items-center justify-center rounded-2xl border border-ink/10 bg-ink/5 px-5 py-3.5 text-sm font-extrabold text-ink/50"
                  >
                    Fermer
                  </button>
                ) : (
                  <a
                    href={product.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-green-900/10 transition hover:bg-[#1fbd5b]"
                    onClick={closeModal}
                  >
                    <MessageCircle
                      size={19}
                      aria-hidden="true"
                    />
                    Commander sur WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-ink/50 transition hover:bg-ink/5 hover:text-ink"
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

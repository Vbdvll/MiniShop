"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

type ShareShopButtonProps = {
  shopName: string;
  url: string;
  variant?: "light" | "dark";
};

export function ShareShopButton({
  shopName,
  url,
  variant = "dark",
}: ShareShopButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shopName,
          text: `Découvrez le catalogue de ${shopName}`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Closing the native share sheet is a normal user action.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={
        variant === "dark"
          ? "mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-extrabold text-ink transition hover:bg-cream"
          : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-sm"
      }
    >
      {copied ? <Check size={17} aria-hidden="true" /> : <Share2 size={17} aria-hidden="true" />}
      {copied ? "Lien copié" : "Partager la boutique"}
    </button>
  );
}

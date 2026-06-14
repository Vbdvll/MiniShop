import { ShoppingBag } from "lucide-react";
import Link from "next/link";

type LogoProps = {
  inverted?: boolean;
};

export function Logo({ inverted = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${
        inverted ? "text-white" : "text-ink"
      }`}
      aria-label="MiniShop, accueil"
    >
      <span
        className={`grid size-9 place-items-center rounded-xl ${
          inverted ? "bg-white text-ink" : "bg-emerald-700 text-white"
        }`}
      >
        <ShoppingBag size={19} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-xl">MiniShop</span>
    </Link>
  );
}

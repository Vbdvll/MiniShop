"use client";

import { Home, Package, Plus, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/products/new", label: "Ajouter", icon: Plus, action: true },
  { href: "/dashboard/boutique", label: "Boutique", icon: Store },
];

export function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile du tableau de bord"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(19,36,29,0.08)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active =
            item.exact || item.action
              ? pathname === item.href
              : pathname.startsWith(item.href) &&
                pathname !== "/dashboard/products/new";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition ${
                active ? "text-emerald-700" : "text-ink/45"
              }`}
            >
              <span
                className={`grid place-items-center transition ${
                  item.action
                    ? "absolute -top-6 size-12 rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                    : active
                      ? "rounded-xl bg-emerald-50 p-1.5"
                      : "p-1.5"
                }`}
              >
                <Icon size={item.action ? 23 : 20} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className={item.action ? "mt-7" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

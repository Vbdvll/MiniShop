"use client";

import { Home, Package, Plus, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: Home,
    exact: true,
    position: "col-start-1",
  },
  {
    href: "/dashboard/products",
    label: "Produits",
    icon: Package,
    position: "col-start-2",
  },
  {
    href: "/dashboard/boutique",
    label: "Boutique",
    icon: Store,
    position: "col-start-4",
  },
  {
    href: "/marche",
    label: "Marché",
    icon: ShoppingBag,
    position: "col-start-5",
  },
];

export function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile du tableau de bord"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(19,36,29,0.08)] backdrop-blur lg:hidden"
    >
      <div className="relative mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${item.position} flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition ${
                active ? "text-emerald-700" : "text-ink/45"
              }`}
            >
              <span
                className={`grid place-items-center transition ${
                  active ? "rounded-xl bg-emerald-50 p-1.5" : "p-1.5"
                }`}
              >
                <Icon size={20} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/dashboard/products/new"
          aria-current={
            pathname === "/dashboard/products/new" ? "page" : undefined
          }
          className="absolute left-1/2 top-0 flex min-h-14 -translate-x-1/2 flex-col items-center justify-center text-[11px] font-bold text-ink/55"
        >
          <span className="absolute -top-6 grid size-12 place-items-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
            <Plus size={23} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span className="mt-7">Ajouter</span>
        </Link>
      </div>
    </nav>
  );
}

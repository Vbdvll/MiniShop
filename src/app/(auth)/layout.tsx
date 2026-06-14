import { MessageCircle, PackageCheck, Share2 } from "lucide-react";

import { Logo } from "@/components/logo";

const points = [
  { icon: PackageCheck, label: "Jusqu'à 30 produits au lancement" },
  { icon: Share2, label: "Un lien simple à partager partout" },
  { icon: MessageCircle, label: "Les demandes arrivent sur WhatsApp" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-7xl px-5 py-5 sm:px-8 lg:px-12">
        <Logo />
      </header>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-12 pt-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:pt-14">
        <section className="hidden lg:block">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            MiniShop Sénégal
          </p>
          <h2 className="mt-4 max-w-lg text-5xl font-bold leading-[1.05] tracking-[-0.04em]">
            Votre catalogue reste visible, même quand vos statuts disparaissent.
          </h2>
          <div className="mt-8 space-y-4">
            {points.map((point) => (
              <div key={point.label} className="flex items-center gap-3 font-semibold text-ink/70">
                <span className="grid size-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <point.icon size={19} aria-hidden="true" />
                </span>
                {point.label}
              </div>
            ))}
          </div>
        </section>
        <section className="flex justify-center lg:justify-end">{children}</section>
      </div>
    </main>
  );
}

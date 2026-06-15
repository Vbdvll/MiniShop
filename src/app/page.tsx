import {
  ArrowRight,
  Check,
  MessageCircle,
  PackagePlus,
  Share2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const benefits = [
  {
    icon: PackagePlus,
    title: "Ajoutez vos produits",
    description: "Photos, prix et description. Votre catalogue prend forme en quelques minutes.",
  },
  {
    icon: Share2,
    title: "Partagez un seul lien",
    description: "Publiez-le sur WhatsApp, Instagram, Facebook ou TikTok.",
  },
  {
    icon: MessageCircle,
    title: "Recevez les demandes",
    description: "Vos clients choisissent un produit et vous écrivent directement sur WhatsApp.",
  },
];

const products = [
  { name: "Huile de baobab", price: "5 000 F", tone: "bg-[#f2c98a]" },
  { name: "Savon karité", price: "3 500 F", tone: "bg-[#d9a56b]" },
  { name: "Lait corporel", price: "7 500 F", tone: "bg-[#ecd8bd]" },
  { name: "Brume parfumée", price: "4 500 F", tone: "bg-[#c9826e]" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-cream text-ink">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navigation principale">
          <Link
            href="/marche"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70 sm:inline-flex"
          >
            Explorer le marché
          </Link>
          <Link
            href="/connexion"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/70"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Créer ma boutique
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:pb-28 lg:pt-16">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow-sm">
            <Sparkles size={15} aria-hidden="true" />
            Pensé pour les vendeurs sur WhatsApp
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Tous vos produits.
            <span className="block text-emerald-700">Un seul lien.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70 sm:text-xl">
            Créez votre catalogue en ligne, partagez-le partout et laissez vos clients
            commander directement sur WhatsApp.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Créer ma boutique gratuitement
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="#exemple"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-ink/15 bg-white/70 px-6 py-3.5 font-bold transition hover:bg-white"
            >
              Voir un exemple
            </a>
          </div>
          <Link
            href="/marche"
            className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 sm:hidden"
          >
            Explorer Marché Central
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink/60">
            {["Sans application", "Sans paiement en ligne", "Prêt en quelques minutes"].map(
              (item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check size={15} className="text-emerald-700" aria-hidden="true" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div id="exemple" className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-sun/35 blur-3xl" />
          <div className="absolute -right-12 bottom-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="phone-shell relative mx-auto w-[min(100%,360px)] rotate-[1.5deg] rounded-[2.6rem] border-[7px] border-ink bg-white p-2 shadow-2xl shadow-ink/20">
            <div className="overflow-hidden rounded-[2rem] bg-[#fffdf8]">
              <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-ink" />
              <div className="px-4 pb-5 pt-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-full bg-emerald-700 text-white">
                    <ShoppingBag size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold">Fatou Cosmétiques</p>
                    <p className="text-xs text-ink/55">Beauté naturelle • Dakar</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-5 text-ink/65">
                  Des soins naturels sélectionnés avec amour pour votre peau.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {products.map((product, index) => (
                    <article
                      key={product.name}
                      className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm"
                    >
                      <div className={`relative aspect-square ${product.tone}`}>
                        <div className="absolute inset-x-5 bottom-0 top-8 rounded-t-[45%] bg-white/65 shadow-inner" />
                        <div className="absolute inset-x-8 bottom-4 top-14 rounded-t-[45%] border border-white/70 bg-white/25" />
                        {index === 3 && (
                          <div className="absolute left-1/2 top-5 h-8 w-5 -translate-x-1/2 rounded-sm bg-ink/70" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <h2 className="truncate text-xs font-semibold">{product.name}</h2>
                        <p className="mt-1 text-sm font-extrabold text-emerald-800">
                          {product.price}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-3 py-3 text-sm font-extrabold text-white"
                >
                  <MessageCircle size={17} aria-hidden="true" />
                  Commander sur WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/8 bg-white/75">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              Simple par conception
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Du premier produit à la première demande
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className="rounded-3xl border border-ink/8 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <benefit.icon size={23} aria-hidden="true" />
                  </div>
                  <span className="text-4xl font-black text-ink/7">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{benefit.title}</h3>
                <p className="mt-2 leading-7 text-ink/60">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Logo inverted />
          <p className="text-sm text-white/55">
            Le catalogue simple des vendeurs WhatsApp au Sénégal.
          </p>
        </div>
      </footer>
    </main>
  );
}

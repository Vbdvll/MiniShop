import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "MiniShop — Votre catalogue, un seul lien",
    template: "%s | MiniShop",
  },
  description:
    "Créez votre catalogue en ligne et recevez les demandes de vos clients directement sur WhatsApp.",
  openGraph: {
    title: "MiniShop — Tous vos produits. Un seul lien.",
    description:
      "Le catalogue simple des vendeurs WhatsApp au Sénégal.",
    locale: "fr_SN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geist.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}

import { formatXofPrice } from "@/lib/product";

type WhatsAppProduct = {
  name: string;
  priceXof: number;
  reference?: string | null;
  url: string;
};

export function createWhatsAppOrderUrl(
  phoneNumber: string,
  product: WhatsAppProduct,
) {
  const message = [
    "Bonjour, je souhaite commander :",
    `Produit : ${product.name}`,
    `Prix : ${formatXofPrice(product.priceXof)}`,
    product.reference ? `Référence : ${product.reference}` : null,
    `Lien : ${product.url}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

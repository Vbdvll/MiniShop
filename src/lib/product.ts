import { slugifyShopName } from "@/lib/shop";

export function slugifyProductName(value: string) {
  return slugifyShopName(value).slice(0, 120);
}

export function parseXofPrice(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const price = Number(digits);
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
}

export function formatXofPrice(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F CFA`;
}

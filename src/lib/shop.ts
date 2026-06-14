export function slugifyShopName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeSenegalPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 9 && /^[783]/.test(digits)) {
    return `+221${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("221")) {
    return `+${digits}`;
  }

  if (value.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

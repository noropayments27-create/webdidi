export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCredits(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

export function telHref(phone: string) {
  const clean = phone.replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : undefined;
}

export function formatPrice(value: number | string | undefined): string {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return '₹0';
  return `₹${numericValue.toLocaleString('en-IN')}`;
}

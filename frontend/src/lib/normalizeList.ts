export function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { results?: unknown }).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
}

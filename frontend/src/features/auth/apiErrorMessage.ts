import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<Record<string, unknown>>(error)) return fallback;
  const data = error.response?.data;
  if (!data) return fallback;

  for (const value of Object.values(data)) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return fallback;
}

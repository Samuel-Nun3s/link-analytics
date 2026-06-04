const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortUrl(slug: string): string {
  return `${BASE_URL}/${slug}`;
}

// Trunca URL longa preservando começo e fim
export function truncateMiddle(s: string, max = 50): string {
  if (s.length <= max) return s;
  const half = Math.floor((max - 3) / 2);
  return `${s.slice(0, half)}...${s.slice(-half)}`;
}

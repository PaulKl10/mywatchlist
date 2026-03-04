export function formatUserId(tmdbId: number): string {
  return `#${String(tmdbId).padStart(6, "0")}`;
}

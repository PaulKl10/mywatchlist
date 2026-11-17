/** Note sur 10 : « 8 », « 7.5 ». */
export function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

/** Moyenne arrondie au demi-point (échelle des notes TMDB), ou null sans note. */
export function averageRating(ratings: readonly number[]): number | null {
  if (ratings.length === 0) return null;
  const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(mean * 2) / 2;
}

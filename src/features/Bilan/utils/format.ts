const numberFormat = new Intl.NumberFormat("fr-FR");

/** « Les années 90 », « Les années 2010 ». */
export function formatDecade(decade: number): string {
  return decade >= 1920 && decade < 2000
    ? `Les années ${decade % 100}`
    : `Les années ${decade}`;
}

/** « 45 min » sous une heure, sinon des heures entières : « 1 234 h ». */
export function formatWatchTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  return `${numberFormat.format(Math.floor(totalMinutes / 60))} h`;
}

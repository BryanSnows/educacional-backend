/** Fuso oficial do app: "hoje", ofensiva e liga semanal usam America/Manaus. */
export const APP_TIMEZONE = 'America/Manaus';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Data local (America/Manaus) no formato YYYY-MM-DD. */
export function localDate(date: Date = new Date()): string {
  return dateFormatter.format(date);
}

/** Soma `days` a uma data YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana de `date` (YYYY-MM-DD). */
export function weekStart(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(date, -((dow + 6) % 7));
}

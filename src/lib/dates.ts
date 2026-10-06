export const WAR_START = "1939-09-01";
export const WAR_END = "1945-09-02";
export const SAMPLE_START = "1944-06-06";
export const SAMPLE_END = "1944-06-13";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const DAY_MS = 86_400_000;

export function parseISO(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function formatISO(utc: number): string {
  const date = new Date(utc);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidWarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return false;
  }
  return utc >= parseISO(WAR_START) && utc <= parseISO(WAR_END);
}

export function addDays(iso: string, days: number): string {
  return formatISO(parseISO(iso) + days * DAY_MS);
}

export function dayIndex(iso: string): number {
  return Math.round((parseISO(iso) - parseISO(WAR_START)) / DAY_MS);
}

export const WAR_DAYS = dayIndex(WAR_END);

export function dateFromIndex(index: number): string {
  const clamped = Math.min(WAR_DAYS, Math.max(0, Math.round(index)));
  return addDays(WAR_START, clamped);
}

function monthName(iso: string): string {
  const month = Number(iso.slice(5, 7));
  return MONTHS[month - 1] ?? "";
}

export function formatDisplay(iso: string): string {
  const day = Number(iso.slice(8, 10));
  return `${day} ${monthName(iso)} ${iso.slice(0, 4)}`;
}

export function formatStencil(iso: string): string {
  const day = Number(iso.slice(8, 10));
  return `${day} ${monthName(iso).toUpperCase()} ${iso.slice(0, 4)}`;
}

import { formatDistanceToNow } from "date-fns";

const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export function parseApiDate(value: string | number | Date): Date {
  if (value instanceof Date || typeof value === "number") {
    return new Date(value);
  }

  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);

  return new Date(HAS_TIMEZONE.test(trimmed) ? trimmed : `${trimmed}Z`);
}

export function compareApiDatesDesc(a: string, b: string): number {
  return parseApiDate(b).getTime() - parseApiDate(a).getTime();
}

export function formatApiDistanceToNow(value: string, addSuffix = true): string {
  return formatDistanceToNow(parseApiDate(value), { addSuffix });
}

export function formatApiDateTime(value: string): string {
  return parseApiDate(value).toLocaleString();
}

export function formatApiTime(
  value: string,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  return parseApiDate(value).toLocaleTimeString([], options);
}

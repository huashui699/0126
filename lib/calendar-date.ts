const SHANGHAI_TIME_ZONE = "Asia/Shanghai";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function dateParts(value: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SHANGHAI_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value).map((part) => [part.type, part.value]),
  );
}

export function toShanghaiDateKey(value: string | Date): string {
  const parts = dateParts(typeof value === "string" ? new Date(value) : value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function currentShanghaiMonth(): string {
  return toShanghaiDateKey(new Date()).slice(0, 7);
}

export function parseMonth(value: string | undefined): string {
  return value && MONTH_PATTERN.test(value) ? value : currentShanghaiMonth();
}

export function parseDate(value: string | undefined, month: string): string {
  if (value && DATE_PATTERN.test(value) && value.startsWith(`${month}-`)) return value;
  const today = toShanghaiDateKey(new Date());
  return today.startsWith(`${month}-`) ? today : `${month}-01`;
}

export function monthRangeUtc(month: string): { start: string; end: string } {
  const [year, oneBasedMonth] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, oneBasedMonth - 1, 1) - 8 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, oneBasedMonth, 1) - 8 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function shiftMonth(month: string, offset: number): string {
  const [year, oneBasedMonth] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, oneBasedMonth - 1 + offset, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function shiftDate(date: string, offset: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + offset));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export function monthGrid(month: string): string[] {
  const [year, oneBasedMonth] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, oneBasedMonth - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(Date.UTC(year, oneBasedMonth - 1, 1 - mondayOffset + index));
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  });
}

export function formatShanghaiDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
    ...options,
  }).format(new Date(`${date}T00:00:00+08:00`));
}

export function formatShanghaiDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

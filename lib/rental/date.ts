import { TECHNICAL_DATE_POLICY } from "@/config/business-rules";

export type DateIntervalSemantics = "inclusive" | "half-open";

export const DEFAULT_DATE_INTERVAL_SEMANTICS: DateIntervalSemantics = TECHNICAL_DATE_POLICY.intervalSemantics;
export const MAX_RENTAL_RANGE_DAYS = TECHNICAL_DATE_POLICY.maxRentalDays;

export type DateRangeInput = {
  startDate: string;
  endDate: string;
};

export class DateRangeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateRangeValidationError";
  }
}

function assertDateOnlyFormat(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DateRangeValidationError(`${field} must use YYYY-MM-DD format.`);
  }
}

export function parseDateOnly(value: string, field = "Date"): Date {
  assertDateOnlyFormat(value, field);
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new DateRangeValidationError(`${field} is not a valid calendar date.`);
  }
  return parsed;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDateOnly(now = new Date()): string {
  return formatDateOnly(now);
}

export function dateOnlyDifferenceInDays(
  startDate: string,
  endDate: string,
  semantics: DateIntervalSemantics = DEFAULT_DATE_INTERVAL_SEMANTICS,
): number {
  const start = parseDateOnly(startDate, "Start date");
  const end = parseDateOnly(endDate, "End date");
  const difference = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return semantics === "inclusive" ? difference + 1 : difference;
}

export function validateDateRange(
  input: DateRangeInput,
  options: { today?: string; maxDays?: number } = {},
): { startDate: string; endDate: string; durationDays: number } {
  const start = parseDateOnly(input.startDate, "Start date");
  const end = parseDateOnly(input.endDate, "End date");
  const startDate = formatDateOnly(start);
  const endDate = formatDateOnly(end);
  const today = options.today ?? todayDateOnly();
  parseDateOnly(today, "Today");

  if (startDate < today) throw new DateRangeValidationError("Rental cannot begin in the past.");
  if (startDate > endDate) throw new DateRangeValidationError("Start date cannot be after end date.");

  const durationDays = dateOnlyDifferenceInDays(startDate, endDate, DEFAULT_DATE_INTERVAL_SEMANTICS);
  const maxDays = options.maxDays ?? MAX_RENTAL_RANGE_DAYS;
  if (durationDays > maxDays) throw new DateRangeValidationError(`Rental range cannot exceed ${maxDays} days.`);

  return { startDate, endDate, durationDays };
}

export function intervalsOverlap(
  requestedStart: Date,
  requestedEnd: Date,
  existingStart: Date,
  existingEnd: Date,
  semantics: DateIntervalSemantics = DEFAULT_DATE_INTERVAL_SEMANTICS,
): boolean {
  if (semantics === "half-open") {
    return requestedStart < existingEnd && requestedEnd > existingStart;
  }
  return requestedStart <= existingEnd && requestedEnd >= existingStart;
}

export function overlapsDateRange(
  requested: DateRangeInput,
  existing: DateRangeInput,
  semantics: DateIntervalSemantics = DEFAULT_DATE_INTERVAL_SEMANTICS,
): boolean {
  const requestedStart = parseDateOnly(requested.startDate, "Requested start date");
  const requestedEnd = parseDateOnly(requested.endDate, "Requested end date");
  const existingStart = parseDateOnly(existing.startDate, "Existing start date");
  const existingEnd = parseDateOnly(existing.endDate, "Existing end date");
  return intervalsOverlap(requestedStart, requestedEnd, existingStart, existingEnd, semantics);
}

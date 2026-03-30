import { eachDayOfInterval, endOfMonth, format, parseISO } from "date-fns";
import type { DayEntry, ValidationResult } from "../types/calendar";

export const PLAN_START_DATE = "2026-03-28";
export const PLAN_END_DATE = "2026-09-19";
export const TOTAL_DAYS = 176;

export const createEmptyValidationResult = (): ValidationResult => ({
  valid: true,
  errors: [],
  warnings: [],
});

export const generatePlanDates = (): string[] =>
  eachDayOfInterval({
    start: parseISO(PLAN_START_DATE),
    end: parseISO(PLAN_END_DATE),
  }).map((date) => format(date, "yyyy-MM-dd"));

export const generateInitialDayEntries = (): DayEntry[] =>
  generatePlanDates().map((date) => ({
    date,
    items: [],
    validation: createEmptyValidationResult(),
  }));

export const groupDaysByMonth = (days: DayEntry[]) => {
  const groups = new Map<
    string,
    {
      id: string;
      label: string;
      monthStart: string;
      monthEnd: string;
      days: DayEntry[];
    }
  >();

  for (const day of days) {
    const parsedDate = parseISO(day.date);
    const monthKey = format(parsedDate, "yyyy-MM");

    if (!groups.has(monthKey)) {
      groups.set(monthKey, {
        id: `month-${monthKey}`,
        label: format(parsedDate, "MMMM yyyy"),
        monthStart: format(parsedDate, "MMM d"),
        monthEnd: format(endOfMonth(parsedDate), "MMM d"),
        days: [],
      });
    }

    groups.get(monthKey)?.days.push(day);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    monthEnd: format(parseISO(group.days[group.days.length - 1].date), "MMM d"),
  }));
};

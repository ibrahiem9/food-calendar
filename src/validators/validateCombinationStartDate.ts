import { isBefore, parseISO } from "date-fns";
import type { DayEntry } from "../types/calendar";
import { createValidationResult } from "./validationUtils";

export const COMBINATION_START_DATE = "2026-05-01";

export const validateCombinationStartDate = (day: DayEntry) => {
  const hasCombination = day.items.some((item) => item.type === "combination");

  if (!hasCombination || !isBefore(parseISO(day.date), parseISO(COMBINATION_START_DATE))) {
    return createValidationResult();
  }

  return createValidationResult([
    "Combination foods cannot be added before May 1, 2026",
  ]);
};

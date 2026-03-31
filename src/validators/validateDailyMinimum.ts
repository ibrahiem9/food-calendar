import type { DayEntry } from "../types/calendar";
import { createValidationResult } from "./validationUtils";

export const validateDailyMinimum = (day: DayEntry) =>
  createValidationResult(
    day.items.length === 0 ? ["Day must have at least one food item"] : [],
  );

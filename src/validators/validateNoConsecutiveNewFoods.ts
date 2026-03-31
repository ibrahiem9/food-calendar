import type { DayEntry } from "../types/calendar";
import { createValidationResult } from "./validationUtils";

export const validateNoConsecutiveNewFoods = (days: DayEntry[], index: number) => {
  const day = days[index];
  const previousDay = days[index - 1];

  if (!day || !previousDay) {
    return createValidationResult();
  }

  const currentNewItems = day.items.filter((item) => item.isFirstIntroduction);
  const previousNewItems = previousDay.items.filter(
    (item) => item.isFirstIntroduction,
  );

  if (currentNewItems.length === 0 || previousNewItems.length === 0) {
    return createValidationResult();
  }

  const previousLabels = previousNewItems.map((item) => item.label).join(", ");
  const currentLabels = currentNewItems.map((item) => item.label).join(", ");

  return createValidationResult([
    `Cannot introduce new foods on consecutive days. ${currentLabels} was scheduled after ${previousLabels} on the previous day.`,
  ]);
};

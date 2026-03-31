import { differenceInCalendarDays } from "date-fns";
import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { createValidationResult } from "./validationUtils";

const allergenIds = new Set(
  foods.filter((food) => food.isAllergen).map((food) => food.id),
);

export const validateAllergenSpacing = (days: DayEntry[], index: number) => {
  const day = days[index];

  if (!day) {
    return createValidationResult();
  }

  const currentAllergens = day.items.filter(
    (item) => item.isFirstIntroduction && allergenIds.has(item.foodId),
  );

  if (currentAllergens.length === 0) {
    return createValidationResult();
  }

  const errors: string[] = [];

  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
    const previousDay = days[previousIndex];
    const previousAllergens = previousDay.items.filter(
      (item) => item.isFirstIntroduction && allergenIds.has(item.foodId),
    );

    if (previousAllergens.length === 0) {
      continue;
    }

    const dayGap = differenceInCalendarDays(
      new Date(day.date),
      new Date(previousDay.date),
    );

    if (dayGap <= 3) {
      const previousLabels = previousAllergens.map((item) => item.label).join(", ");
      const currentLabels = currentAllergens.map((item) => item.label).join(", ");

      errors.push(
        `Allergen first introductions must be at least 3 full days apart. ${currentLabels} was first introduced ${dayGap} day${dayGap === 1 ? "" : "s"} after ${previousLabels}.`,
      );
    }

    break;
  }

  return createValidationResult(errors);
};

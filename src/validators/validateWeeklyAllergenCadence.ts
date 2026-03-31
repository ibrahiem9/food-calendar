import { endOfWeek, format, isAfter, isBefore, parseISO, startOfWeek } from "date-fns";
import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { createValidationResult } from "./validationUtils";

const MIN_ALLERGEN_WEEKLY = 1;
const MAX_ALLERGEN_WEEKLY = 2;

const foodNameById = new Map(foods.map((food) => [food.id, food.name]));

export const validateWeeklyAllergenCadence = (
  days: DayEntry[],
  allergenId: string,
) => {
  const firstIntroDay = days.find((day) =>
    day.items.some(
      (item) => item.foodId === allergenId && item.isFirstIntroduction,
    ),
  );

  if (!firstIntroDay) {
    return createValidationResult();
  }

  const firstIntroDate = parseISO(firstIntroDay.date);
  const allergenName = foodNameById.get(allergenId) ?? allergenId;
  const errors: string[] = [];
  let weekStart = startOfWeek(firstIntroDate, { weekStartsOn: 0 });
  const lastDay = parseISO(days[days.length - 1].date);

  while (!isAfter(weekStart, lastDay)) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    const appearances = days.filter((day) => {
      const dayDate = parseISO(day.date);

      return (
        !isBefore(dayDate, weekStart) &&
        !isAfter(dayDate, weekEnd) &&
        day.items.some((item) => item.foodId === allergenId)
      );
    }).length;

    if (appearances < MIN_ALLERGEN_WEEKLY || appearances > MAX_ALLERGEN_WEEKLY) {
      errors.push(
        `Allergen ${allergenName} must appear 1-2 times in week of ${format(weekStart, "yyyy-MM-dd")}. Currently appears ${appearances} times.`,
      );
    }

    weekStart = startOfWeek(
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7),
      { weekStartsOn: 0 },
    );
  }

  return createValidationResult(errors);
};

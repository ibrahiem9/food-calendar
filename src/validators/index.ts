import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { createValidationResult, mergeValidationResults } from "./validationUtils";
import { validateAllergenSpacing } from "./validateAllergenSpacing";
import { validateCombinationIngredients } from "./validateCombinationIngredients";
import { validateCombinationStartDate } from "./validateCombinationStartDate";
import { validateDailyMinimum } from "./validateDailyMinimum";
import { validateNoConsecutiveNewFoods } from "./validateNoConsecutiveNewFoods";
import { validateWeeklyAllergenCadence } from "./validateWeeklyAllergenCadence";

const buildIntroductionMap = (days: DayEntry[]) => {
  const introMap = new Map<string, string>();

  for (const day of days) {
    for (const item of day.items) {
      if (item.isFirstIntroduction && !introMap.has(item.foodId)) {
        introMap.set(item.foodId, day.date);
      }
    }
  }

  return introMap;
};

export const runAllValidations = (days: DayEntry[]): DayEntry[] => {
  const introMap = buildIntroductionMap(days);
  const allergenValidationByDay = new Map<string, string[]>();

  for (const allergen of foods.filter((food) => food.isAllergen)) {
    const cadenceResult = validateWeeklyAllergenCadence(days, allergen.id);

    if (cadenceResult.errors.length === 0 && cadenceResult.warnings.length === 0) {
      continue;
    }

    for (const day of days) {
      if (day.items.some((item) => item.foodId === allergen.id)) {
        const existingErrors = allergenValidationByDay.get(day.date) ?? [];
        allergenValidationByDay.set(day.date, [
          ...existingErrors,
          ...cadenceResult.errors,
        ]);
      }
    }
  }

  return days.map((day, index) => {
    const result = mergeValidationResults(
      validateDailyMinimum(day),
      validateNoConsecutiveNewFoods(days, index),
      validateAllergenSpacing(days, index),
      validateCombinationStartDate(day),
      validateCombinationIngredients(day, introMap),
      createValidationResult(allergenValidationByDay.get(day.date) ?? []),
    );

    return {
      ...day,
      validation: result,
    };
  });
};

export { validateDailyMinimum } from "./validateDailyMinimum";
export { validateNoConsecutiveNewFoods } from "./validateNoConsecutiveNewFoods";
export { validateAllergenSpacing } from "./validateAllergenSpacing";
export { validateCombinationStartDate } from "./validateCombinationStartDate";
export { validateCombinationIngredients } from "./validateCombinationIngredients";
export { validateWeeklyAllergenCadence } from "./validateWeeklyAllergenCadence";
export { validateRecipeRestrictions } from "./validateRecipeRestrictions";

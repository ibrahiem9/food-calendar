import { recipesById } from "../data/recipes";
import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { buildSingleIntroductionMap } from "../utils/recipeEligibility";
import { createValidationResult, mergeValidationResults } from "./validationUtils";
import { validateAllergenSpacing } from "./validateAllergenSpacing";
import { validateCombinationIngredients } from "./validateCombinationIngredients";
import { validateCombinationStartDate } from "./validateCombinationStartDate";
import { validateDailyMinimum } from "./validateDailyMinimum";
import { validateNoConsecutiveNewFoods } from "./validateNoConsecutiveNewFoods";
import { validateRecipeRestrictions } from "./validateRecipeRestrictions";
import { validateWeeklyAllergenCadence } from "./validateWeeklyAllergenCadence";

export const runAllValidations = (days: DayEntry[]): DayEntry[] => {
  const introMap = buildSingleIntroductionMap(days);
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
    const recipeRestrictionResult = createValidationResult(
      day.items
        .filter((item) => item.type === "combination" && item.recipeId)
        .flatMap((item) => {
          const recipe = recipesById.get(item.recipeId ?? "");
          return recipe ? validateRecipeRestrictions(recipe).errors : [];
        }),
    );
    const result = mergeValidationResults(
      validateDailyMinimum(day),
      validateNoConsecutiveNewFoods(days, index),
      validateAllergenSpacing(days, index),
      validateCombinationStartDate(day),
      validateCombinationIngredients(day, introMap),
      recipeRestrictionResult,
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

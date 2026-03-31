import { isBefore, parseISO } from "date-fns";
import type { DayEntry } from "../types/calendar";
import { getFoodName } from "../utils/recipeEligibility";
import { createValidationResult } from "./validationUtils";

export const validateCombinationIngredients = (
  day: DayEntry,
  introMap: Map<string, string>,
) => {
  const errors = day.items
    .filter((item) => item.type === "combination")
    .flatMap((item) => {
      const missingIngredients = (item.ingredientFoodIds ?? []).filter(
        (foodId) => {
          const introDate = introMap.get(foodId);
          return !introDate || !isBefore(parseISO(introDate), parseISO(day.date));
        },
      );

      if (missingIngredients.length === 0) {
        return [];
      }

      return [
        `Cannot add combination ${item.label}. The following ingredients have not been introduced as single foods beforehand: ${missingIngredients.map(getFoodName).join(", ")}.`,
      ];
    });

  return createValidationResult(errors);
};

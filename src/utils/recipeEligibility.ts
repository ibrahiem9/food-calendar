import { isBefore, parseISO } from "date-fns";
import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import type { Recipe } from "../types/recipe";
import { validateRecipeRestrictions } from "../validators/validateRecipeRestrictions";
import { COMBINATION_START_DATE } from "../validators/validateCombinationStartDate";

const FOOD_NAME_BY_ID = new Map(foods.map((food) => [food.id, food.name]));

export const getFoodName = (foodId: string) => FOOD_NAME_BY_ID.get(foodId) ?? foodId;

export const buildSingleIntroductionMap = (days: DayEntry[]) => {
  const introMap = new Map<string, string>();

  for (const day of days) {
    for (const item of day.items) {
      if (
        item.type === "single" &&
        item.isFirstIntroduction &&
        !introMap.has(item.foodId)
      ) {
        introMap.set(item.foodId, day.date);
      }
    }
  }

  return introMap;
};

export const getRecipeEligibilityForDate = (
  recipe: Recipe,
  date: string,
  introMap: Map<string, string>,
) => {
  const reasons = [...validateRecipeRestrictions(recipe).errors];

  if (isBefore(parseISO(date), parseISO(COMBINATION_START_DATE))) {
    reasons.push("Combination foods cannot be added before May 1, 2026.");
  }

  const missingIngredientIds = recipe.ingredientFoodIds.filter((foodId) => {
    const introDate = introMap.get(foodId);
    return !introDate || !isBefore(parseISO(introDate), parseISO(date));
  });
  const missingIngredientNames = missingIngredientIds.map(getFoodName);

  if (missingIngredientNames.length > 0) {
    reasons.push(
      `Ingredients still blocked: ${missingIngredientNames.join(", ")} must be introduced as single foods first.`,
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    missingIngredientIds,
    missingIngredientNames,
  };
};

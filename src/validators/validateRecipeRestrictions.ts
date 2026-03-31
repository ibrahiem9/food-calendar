import { createValidationResult } from "./validationUtils";

interface RecipeForValidation {
  name: string;
  forbiddenFlags: {
    addedSodium: boolean;
    addedSugar: boolean;
    hotSpices: boolean;
  };
}

export const validateRecipeRestrictions = (recipe: RecipeForValidation) => {
  const prohibitedIngredients = [
    recipe.forbiddenFlags.addedSodium ? "sodium" : null,
    recipe.forbiddenFlags.addedSugar ? "sugar" : null,
    recipe.forbiddenFlags.hotSpices ? "hot spices" : null,
  ].filter((value): value is string => value !== null);

  if (prohibitedIngredients.length === 0) {
    return createValidationResult();
  }

  return createValidationResult([
    `Recipe ${recipe.name} contains prohibited ingredients: ${prohibitedIngredients.join(", ")}`,
  ]);
};

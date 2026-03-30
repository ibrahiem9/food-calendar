export const FOOD_CATEGORIES = [
  "fruit",
  "vegetable",
  "starch",
  "protein",
  "allergen",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  isAllergen: boolean;
}

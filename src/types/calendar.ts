export type PlannedItemType = "single" | "combination";

export interface PlannedItem {
  foodId: string;
  type: PlannedItemType;
  label: string;
  isFirstIntroduction: boolean;
  recipeId?: string;
  ingredientFoodIds?: string[];
}

export interface CombinationPlannedItem extends PlannedItem {
  type: "combination";
  recipeId: string;
  ingredientFoodIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DayEntry {
  date: string;
  items: PlannedItem[];
  notes?: string;
  validation: ValidationResult;
}

export type PlannedItemType = "single" | "combination";

export interface PlannedItem {
  foodId: string;
  type: PlannedItemType;
  label: string;
  isFirstIntroduction: boolean;
  ingredientFoodIds?: string[];
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

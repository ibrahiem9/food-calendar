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

export type ManualEditAction =
  | {
      type: "add-food";
      date: string;
      foodId: string;
    }
  | {
      type: "remove-item";
      date: string;
      itemIndex: number;
    }
  | {
      type: "move-item";
      sourceDate: string;
      itemIndex: number;
      targetDate: string;
    };

export interface ConflictSuggestion {
  date: string;
  label: string;
  description: string;
}

export interface PendingConflict {
  action: ManualEditAction;
  title: string;
  summary: string;
  errors: string[];
  suggestions: ConflictSuggestion[];
}

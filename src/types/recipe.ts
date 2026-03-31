export interface RecipeForbiddenFlags {
  addedSodium: boolean;
  addedSugar: boolean;
  hotSpices: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  ingredientFoodIds: string[];
  forbiddenFlags: RecipeForbiddenFlags;
}

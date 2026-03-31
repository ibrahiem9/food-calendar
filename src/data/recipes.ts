import type { Recipe } from "../types/recipe";

export const recipes: Recipe[] = [
  {
    id: "scrambled-eggs",
    name: "Scrambled eggs",
    ingredientFoodIds: ["egg"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "yogurt-parfait",
    name: "Yogurt parfait",
    ingredientFoodIds: ["yogurt", "banana", "blueberries"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "fish-cakes",
    name: "Fish cakes",
    ingredientFoodIds: ["white-fish", "potato", "egg"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "oatmeal-banana",
    name: "Oatmeal banana",
    ingredientFoodIds: ["oatmeal", "banana"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "vegetable-rice",
    name: "Vegetable rice",
    ingredientFoodIds: ["rice", "carrot", "peas", "broccoli"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "egg-fried-rice",
    name: "Egg fried rice",
    ingredientFoodIds: ["rice", "egg", "peas"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "ricotta-pear-bowl",
    name: "Ricotta pear bowl",
    ingredientFoodIds: ["ricotta", "pear"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "salmon-sweet-potato-mash",
    name: "Salmon sweet potato mash",
    ingredientFoodIds: ["salmon", "sweet-potato"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
  {
    id: "tahini-oat-porridge",
    name: "Tahini oat porridge",
    ingredientFoodIds: ["tahini", "oatmeal", "banana"],
    forbiddenFlags: {
      addedSodium: false,
      addedSugar: false,
      hotSpices: false,
    },
  },
];

export const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

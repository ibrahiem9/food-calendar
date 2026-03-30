import type { Food, FoodCategory } from "../types/food";

const ALLERGEN_NAMES = new Set([
  "Peanut",
  "Egg",
  "Cottage cheese",
  "Ricotta",
  "Yogurt",
  "Salmon",
  "Sardines",
  "Tuna",
  "White fish",
  "Clams",
  "Crab",
  "Lobster",
  "Shrimp",
  "Cashew",
  "Almond",
  "Tahini",
]);

const CATEGORY_FOODS: Record<FoodCategory, string[]> = {
  fruit: [
    "Apple",
    "Avocado",
    "Banana",
    "Blueberries",
    "Coconut",
    "Fig",
    "Grapes",
    "Kiwi",
    "Lemon/Lime",
    "Mango",
    "Melon",
    "Orange",
    "Papaya",
    "Peach",
    "Pear",
    "Pineapple",
    "Plum",
    "Raspberry",
    "Strawberry",
    "Watermelon",
  ],
  vegetable: [
    "Artichoke",
    "Asparagus",
    "Beet",
    "Bell pepper",
    "Broccoli",
    "Brussel sprouts",
    "Carrot",
    "Cauliflower",
    "Chayote squash",
    "Cucumber",
    "Eggplant",
    "Green beans",
    "Mushrooms",
    "Parsnip",
    "Peas",
    "Pumpkin",
    "Spinach",
    "Squash",
    "Tomato",
    "Zucchini",
  ],
  starch: [
    "Amaranth",
    "Barley",
    "Buckwheat",
    "Bulgur",
    "Couscous",
    "Farro",
    "Millet",
    "Oatmeal",
    "Potato",
    "Quinoa",
    "Rice",
    "Rye",
    "Sorghum",
    "Sweet potato",
    "Tortilla",
    "Pasta",
    "Wheat germ",
  ],
  protein: [
    "Adzuki beans",
    "Beef",
    "Bison",
    "Black beans",
    "Chicken",
    "Chickpeas",
    "Fava beans",
    "Ground beef",
    "Kidney beans",
    "Lamb",
    "Pigeon peas",
    "Red lentils",
    "Split peas",
    "Liver",
    "Lupini beans",
    "Mung beans",
    "Pinto beans",
    "Rib meat",
    "White beans",
    "Edamame",
    "Tofu",
  ],
  allergen: [
    "Peanut",
    "Egg",
    "Cottage cheese",
    "Ricotta",
    "Yogurt",
    "Salmon",
    "Sardines",
    "Tuna",
    "White fish",
    "Clams",
    "Crab",
    "Lobster",
    "Shrimp",
    "Cashew",
    "Almond",
    "Tahini",
  ],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s/]+/g, "")
    .replace(/\//g, "-")
    .trim()
    .replace(/\s+/g, "-");

export const foods: Food[] = Object.entries(CATEGORY_FOODS).flatMap(
  ([category, names]) =>
    names.map((name) => ({
      id: slugify(name),
      name,
      category: category as FoodCategory,
      isAllergen: ALLERGEN_NAMES.has(name),
    })),
);

export const foodsByCategory = foods.reduce<Record<FoodCategory, Food[]>>(
  (accumulator, food) => {
    accumulator[food.category].push(food);
    return accumulator;
  },
  {
    fruit: [],
    vegetable: [],
    starch: [],
    protein: [],
    allergen: [],
  },
);

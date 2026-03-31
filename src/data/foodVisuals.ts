import { foods } from "./foods";
import type { FoodCategory } from "../types/food";
import type { FoodVisual } from "../types/appShell";

const categoryVisuals: Record<FoodCategory, FoodVisual> = {
  fruit: {
    imagePath: "/visuals/fruit-orchard.svg",
    alt: "Stylized fruit bowl illustration",
    presentation: "card",
    accentClassName: "from-[#f3c58c] via-[#f7e2bf] to-[#f3efe6]",
  },
  vegetable: {
    imagePath: "/visuals/vegetable-market.svg",
    alt: "Stylized vegetables illustration",
    presentation: "card",
    accentClassName: "from-[#adc8a4] via-[#d6e6c9] to-[#eff3e8]",
  },
  starch: {
    imagePath: "/visuals/starch-pantry.svg",
    alt: "Stylized grains and starches illustration",
    presentation: "card",
    accentClassName: "from-[#d6bb8b] via-[#ede0bf] to-[#f6efe4]",
  },
  protein: {
    imagePath: "/visuals/protein-kitchen.svg",
    alt: "Stylized proteins illustration",
    presentation: "card",
    accentClassName: "from-[#a9b8a4] via-[#d7e0d5] to-[#f1f4ef]",
  },
  allergen: {
    imagePath: "/visuals/allergen-care.svg",
    alt: "Stylized allergen tasting setup illustration",
    presentation: "card",
    accentClassName: "from-[#ebb097] via-[#f6dccf] to-[#fbf2ed]",
  },
};

const photoSheetPath = "/visuals/library-photo-sheet.png";

const foodVisualOverrides: Record<string, FoodVisual> = {
  avocado: {
    imagePath: photoSheetPath,
    alt: "Avocado photo from the design reference",
    presentation: "chip",
    accentClassName: "from-[#dbe7c9] via-[#f4f0d7] to-[#fffaf0]",
    imageClassName: "scale-[4.8]",
    imageStyle: { objectPosition: "31% 76%" },
  },
  banana: {
    imagePath: photoSheetPath,
    alt: "Banana photo from the design reference",
    presentation: "chip",
    accentClassName: "from-[#f2d06f] via-[#f7e7ab] to-[#fff6d6]",
    imageClassName: "scale-[8]",
    imageStyle: { objectPosition: "52% 92%" },
  },
  broccoli: {
    imagePath: photoSheetPath,
    alt: "Broccoli photo from the design reference",
    presentation: "chip",
    accentClassName: "from-[#9fbe8d] via-[#d4e6c9] to-[#f1f7ea]",
    imageClassName: "scale-[8.5]",
    imageStyle: { objectPosition: "70% 71%" },
  },
  oatmeal: {
    imagePath: "/visuals/starch-pantry.svg",
    alt: "Warm oatmeal illustration",
    presentation: "chip",
    accentClassName: "from-[#d4bc95] via-[#e8dcc2] to-[#f8f0df]",
  },
  chicken: {
    imagePath: photoSheetPath,
    alt: "Chicken photo from the design reference",
    presentation: "chip",
    accentClassName: "from-[#b1c0a7] via-[#d9e3d4] to-[#f1f4ef]",
    imageClassName: "scale-[8.5]",
    imageStyle: { objectPosition: "80% 92%" },
  },
  egg: {
    imagePath: "/visuals/allergen-care.svg",
    alt: "Egg and tasting spoon illustration",
    presentation: "chip",
    accentClassName: "from-[#efb490] via-[#f8ddcf] to-[#fdf3ed]",
  },
  "sweet-potato": {
    imagePath: photoSheetPath,
    alt: "Sweet potato photo from the design reference",
    presentation: "chip",
    accentClassName: "from-[#e7c89c] via-[#f4dfbf] to-[#fbf2e2]",
    imageClassName: "scale-[8]",
    imageStyle: { objectPosition: "26% 92%" },
  },
};

const categoryByFoodId = new Map(foods.map((food) => [food.id, food.category]));

export const getFoodVisual = (foodId?: string): FoodVisual => {
  if (foodId && foodVisualOverrides[foodId]) {
    return foodVisualOverrides[foodId];
  }

  const category = (foodId ? categoryByFoodId.get(foodId) : undefined) ?? "fruit";
  return categoryVisuals[category];
};

export const getCategoryVisual = (category: FoodCategory): FoodVisual =>
  categoryVisuals[category];

export const recipeHeroVisual: FoodVisual = {
  imagePath: "/visuals/recipe-hero.svg",
  alt: "Editorial baby meal planner illustration",
  presentation: "hero",
  accentClassName: "from-[#c7d8f2] via-[#e5eef9] to-[#f8fafc]",
};

export const calendarHeroVisual: FoodVisual = {
  imagePath: "/visuals/calendar-hero.svg",
  alt: "Calendar planning illustration",
  presentation: "hero",
  accentClassName: "from-[#b5ccae] via-[#dde9d8] to-[#f6f8f3]",
};

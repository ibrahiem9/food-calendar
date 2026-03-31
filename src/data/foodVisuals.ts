import { foods } from "./foods";
import type { Food, FoodCategory } from "../types/food";
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

const categoryByFoodId = new Map(foods.map((food) => [food.id, food.category]));
const foodById = new Map(foods.map((food) => [food.id, food]));

const chipAccentByCategory: Record<FoodCategory, string> = {
  fruit: "from-[#f7d1a5] via-[#fbe8c7] to-[#fff5e8]",
  vegetable: "from-[#bfd8b6] via-[#e1ecd9] to-[#f4f8ef]",
  starch: "from-[#e2c89d] via-[#f2e3c8] to-[#fbf3e6]",
  protein: "from-[#c7d3c1] via-[#e3e8df] to-[#f4f6f2]",
  allergen: "from-[#f0c1ad] via-[#f7dfd2] to-[#fdf3ee]",
};

const paletteByCategory: Record<
  FoodCategory,
  { background: string; accent: string; foreground: string; shadow: string }
> = {
  fruit: {
    background: "#fff6ea",
    accent: "#e8b15d",
    foreground: "#8f5c1d",
    shadow: "#f5d8a7",
  },
  vegetable: {
    background: "#f2f8ef",
    accent: "#7fa36a",
    foreground: "#446044",
    shadow: "#d6e7cf",
  },
  starch: {
    background: "#fcf4e8",
    accent: "#c29b59",
    foreground: "#7b6336",
    shadow: "#edd9ba",
  },
  protein: {
    background: "#f1f4f0",
    accent: "#6f8271",
    foreground: "#46564a",
    shadow: "#dce4da",
  },
  allergen: {
    background: "#fdf1ec",
    accent: "#cf8c72",
    foreground: "#7c4d3a",
    shadow: "#f4d4c7",
  },
};

const svgByCategory: Record<FoodCategory, (foreground: string, accent: string) => string> = {
  fruit: (foreground, accent) => `
    <circle cx="36" cy="38" r="16" fill="${accent}" opacity="0.9" />
    <circle cx="55" cy="34" r="13" fill="${foreground}" opacity="0.2" />
    <path d="M42 20c4-6 10-9 18-8-3 6-9 9-18 8Z" fill="${foreground}" />
    <rect x="42" y="18" width="3" height="10" rx="1.5" fill="${foreground}" />
  `,
  vegetable: (foreground, accent) => `
    <path d="M46 18c11 0 20 9 20 20S57 58 46 58 26 49 26 38s9-20 20-20Z" fill="${accent}" />
    <path d="M46 14c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7Z" fill="${foreground}" opacity="0.9" />
    <rect x="43" y="47" width="6" height="15" rx="3" fill="${foreground}" />
  `,
  starch: (foreground, accent) => `
    <path d="M46 16c12 7 18 19 18 31 0 10-7 17-18 17s-18-7-18-17c0-12 6-24 18-31Z" fill="${accent}" />
    <path d="M46 23c5 6 8 15 8 24 0 8-3 12-8 12s-8-4-8-12c0-9 3-18 8-24Z" fill="${foreground}" opacity="0.18" />
    <path d="M46 26v29" stroke="${foreground}" stroke-width="3" stroke-linecap="round" />
  `,
  protein: (foreground, accent) => `
    <path d="M25 46c0-11 10-20 21-20 7 0 14 3 18 9 2 3 4 7 4 11 0 10-9 18-19 18H37c-7 0-12-6-12-13v-5Z" fill="${accent}" />
    <circle cx="54" cy="38" r="6" fill="${foreground}" opacity="0.16" />
    <path d="M34 50c4 5 10 8 18 8" stroke="${foreground}" stroke-width="3" stroke-linecap="round" />
  `,
  allergen: (foreground, accent) => `
    <path d="M46 16c9 11 15 21 15 31 0 9-7 16-15 16s-15-7-15-16c0-10 6-20 15-31Z" fill="${accent}" />
    <circle cx="46" cy="43" r="8" fill="${foreground}" opacity="0.16" />
    <path d="M46 26v9" stroke="${foreground}" stroke-width="3.5" stroke-linecap="round" />
  `,
};

const toDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;

const buildFoodChipIcon = (food: Food): FoodVisual => {
  const palette = paletteByCategory[food.category];
  const icon = svgByCategory[food.category](palette.foreground, palette.accent);
  const initials = food.name
    .split(/[\s/]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 92" role="img" aria-label="${food.name}">
      <rect width="92" height="92" rx="24" fill="${palette.background}" />
      <rect x="9" y="9" width="74" height="74" rx="20" fill="${palette.shadow}" opacity="0.55" />
      <rect x="14" y="14" width="64" height="64" rx="18" fill="${palette.background}" />
      ${icon}
      <text x="46" y="78" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.4" fill="${palette.foreground}">
        ${initials}
      </text>
    </svg>
  `;

  return {
    imagePath: toDataUri(svg),
    alt: `${food.name} icon`,
    presentation: "chip",
    accentClassName: chipAccentByCategory[food.category],
  };
};

export const getFoodVisual = (foodId?: string): FoodVisual => {
  if (foodId) {
    const food = foodById.get(foodId);

    if (food) {
      return buildFoodChipIcon(food);
    }
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

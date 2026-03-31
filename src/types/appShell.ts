export type AppView = "calendar" | "library" | "rules" | "recipes" | "guide";

export interface FoodVisual {
  imagePath: string;
  alt: string;
  presentation: "card" | "chip" | "hero";
  accentClassName: string;
}

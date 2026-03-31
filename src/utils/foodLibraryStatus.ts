import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { foods } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { buildSingleIntroductionMap } from "./recipeEligibility";

export type FoodLibraryStatusKind =
  | "pending"
  | "scheduled"
  | "introduced"
  | "due"
  | "satisfied"
  | "over-limit";

export interface FoodLibraryStatus {
  kind: FoodLibraryStatusKind;
  label: string;
  summary: string;
  firstIntroductionDate?: string;
  appearanceCountThisWeek?: number;
  weekLabel: string;
}

const ALLERGEN_IDS = new Set(
  foods.filter((food) => food.isAllergen).map((food) => food.id),
);

const getReferenceDate = (days: DayEntry[], now = new Date()) => {
  if (days.length === 0) {
    return format(now, "yyyy-MM-dd");
  }

  const today = format(now, "yyyy-MM-dd");
  const firstDate = days[0].date;
  const lastDate = days[days.length - 1].date;

  if (today < firstDate) {
    return firstDate;
  }

  if (today > lastDate) {
    return lastDate;
  }

  return today;
};

const getWeekLabel = (date: string) => {
  const parsed = parseISO(date);
  const weekStart = startOfWeek(parsed, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parsed, { weekStartsOn: 0 });

  return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;
};

const getWeeklyAppearanceCount = (days: DayEntry[], date: string, foodId: string) => {
  const parsed = parseISO(date);
  const weekStart = startOfWeek(parsed, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parsed, { weekStartsOn: 0 });

  return days.reduce((count, day) => {
    const dayDate = parseISO(day.date);

    if (dayDate < weekStart || dayDate > weekEnd) {
      return count;
    }

    return count + (day.items.some((item) => item.foodId === foodId) ? 1 : 0);
  }, 0);
};

export const getFoodLibraryStatuses = (days: DayEntry[], now = new Date()) => {
  const introMap = buildSingleIntroductionMap(days);
  const referenceDate = getReferenceDate(days, now);
  const weekLabel = getWeekLabel(referenceDate);
  const statusByFoodId = new Map<string, FoodLibraryStatus>();

  for (const food of foods) {
    const firstIntroductionDate = introMap.get(food.id);

    if (!firstIntroductionDate) {
      statusByFoodId.set(food.id, {
        kind: "pending",
        label: "Pending",
        summary: "No first introduction is scheduled yet.",
        weekLabel,
      });
      continue;
    }

    if (firstIntroductionDate > referenceDate) {
      statusByFoodId.set(food.id, {
        kind: "scheduled",
        label: "Coming Up",
        summary: `First introduction planned for ${format(parseISO(firstIntroductionDate), "MMM d")}.`,
        firstIntroductionDate,
        weekLabel,
      });
      continue;
    }

    if (!ALLERGEN_IDS.has(food.id)) {
      statusByFoodId.set(food.id, {
        kind: "introduced",
        label: "Introduced",
        summary: `First introduced on ${format(parseISO(firstIntroductionDate), "MMM d")}.`,
        firstIntroductionDate,
        weekLabel,
      });
      continue;
    }

    const appearanceCountThisWeek = getWeeklyAppearanceCount(
      days,
      referenceDate,
      food.id,
    );

    if (appearanceCountThisWeek === 0) {
      statusByFoodId.set(food.id, {
        kind: "due",
        label: "Due",
        summary: `Needs an allergen repeat in the ${weekLabel} week.`,
        firstIntroductionDate,
        appearanceCountThisWeek,
        weekLabel,
      });
      continue;
    }

    if (appearanceCountThisWeek > 2) {
      statusByFoodId.set(food.id, {
        kind: "over-limit",
        label: "Over Limit",
        summary: `${appearanceCountThisWeek} appearances scheduled in the ${weekLabel} week.`,
        firstIntroductionDate,
        appearanceCountThisWeek,
        weekLabel,
      });
      continue;
    }

    statusByFoodId.set(food.id, {
      kind: "satisfied",
      label: "Satisfied",
      summary: `${appearanceCountThisWeek} appearance${appearanceCountThisWeek === 1 ? "" : "s"} scheduled in the ${weekLabel} week.`,
      firstIntroductionDate,
      appearanceCountThisWeek,
      weekLabel,
    });
  }

  return {
    referenceDate,
    weekLabel,
    statusByFoodId,
  };
};

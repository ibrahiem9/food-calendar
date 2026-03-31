import { create } from "zustand";
import { foods } from "../data/foods";
import { recipesById } from "../data/recipes";
import type { DayEntry } from "../types/calendar";
import type { Food } from "../types/food";
import {
  createEmptyValidationResult,
  generateInitialDayEntries,
} from "../utils/dateUtils";
import {
  fillEmptyDays,
  planFirstIntroductions,
  scheduleAllergenRepetitions,
} from "../utils/plannerEngine";
import {
  buildSingleIntroductionMap,
  getRecipeEligibilityForDate,
} from "../utils/recipeEligibility";
import { runAllValidations } from "../validators";

const STORAGE_KEY = "babybite-calendar-plan";

interface StoredPlannerState {
  days: DayEntry[];
}

const persistDays = (days: DayEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ days }));
};

const normalizeDayEntry = (day: Partial<DayEntry> & Pick<DayEntry, "date">): DayEntry => ({
  date: day.date,
  items: Array.isArray(day.items) ? day.items : [],
  notes: day.notes,
  validation: day.validation ?? createEmptyValidationResult(),
});

const markFirstIntroductions = (days: DayEntry[]): DayEntry[] => {
  const introducedFoodIds = new Set<string>();

  return days.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (item.type === "combination") {
        return {
          ...item,
          isFirstIntroduction: false,
        };
      }

      const isFirstIntroduction = !introducedFoodIds.has(item.foodId);
      introducedFoodIds.add(item.foodId);

      return {
        ...item,
        isFirstIntroduction,
      };
    }),
  }));
};

const prepareDays = (days: DayEntry[]): DayEntry[] =>
  runAllValidations(markFirstIntroductions(days));

const loadStoredDays = (): DayEntry[] | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as StoredPlannerState;

    if (!Array.isArray(parsed.days)) {
      return null;
    }

    return prepareDays(parsed.days.map(normalizeDayEntry));
  } catch {
    return null;
  }
};

interface PlannerStoreState {
  days: DayEntry[];
  foods: Food[];
  initializeDays: () => void;
  addFoodToDay: (date: string, foodId: string) => void;
  addRecipeToDay: (
    date: string,
    recipeId: string,
  ) => { added: boolean; reason?: string };
  removePlannedItem: (date: string, itemIndex: number) => void;
  generateFirstIntroductions: () => {
    scheduledCount: number;
    populatedDayCount: number;
    unscheduledFoodIds: string[];
  };
  clearAllDays: () => void;
  savePlan: () => void;
}

export const usePlannerStore = create<PlannerStoreState>((set) => ({
  days: [],
  foods,
  initializeDays: () => {
    set(() => {
      const storedDays = loadStoredDays();
      const nextDays = storedDays ?? prepareDays(generateInitialDayEntries());

      if (!storedDays) {
        persistDays(nextDays);
      }

      return {
        days: nextDays,
      };
    });
  },
  addFoodToDay: (date, foodId) => {
    set((state) => {
      const food = state.foods.find((entry) => entry.id === foodId);

      if (!food) {
        return state;
      }

      const dayAlreadyContainsFood = state.days.some(
        (day) =>
          day.date === date && day.items.some((item) => item.foodId === foodId),
      );

      if (dayAlreadyContainsFood) {
        return state;
      }

      const nextDays = prepareDays(
        state.days.map((day) =>
          day.date === date
            ? {
                ...day,
                items: [
                  ...day.items,
                  {
                    foodId: food.id,
                    type: "single",
                    label: food.name,
                    isFirstIntroduction: false,
                  },
                ],
              }
            : day,
        ),
      );

      persistDays(nextDays);

      return { days: nextDays };
    });
  },
  addRecipeToDay: (date, recipeId) => {
    let result: { added: boolean; reason?: string } = {
      added: false,
      reason: "Recipe could not be added.",
    };

    set((state) => {
      const recipe = recipesById.get(recipeId);

      if (!recipe) {
        result = {
          added: false,
          reason: `Recipe ${recipeId} was not found.`,
        };
        return state;
      }

      const day = state.days.find((entry) => entry.date === date);

      if (!day) {
        result = {
          added: false,
          reason: `Date ${date} is outside the planning window.`,
        };
        return state;
      }

      if (day.items.some((item) => item.type === "combination" && item.recipeId === recipeId)) {
        result = {
          added: false,
          reason: `${recipe.name} is already planned on ${date}.`,
        };
        return state;
      }

      const introMap = buildSingleIntroductionMap(state.days);
      const eligibility = getRecipeEligibilityForDate(recipe, date, introMap);

      if (!eligibility.eligible) {
        result = {
          added: false,
          reason: eligibility.reasons[0],
        };
        return state;
      }

      const nextDays = prepareDays(
        state.days.map((entry) =>
          entry.date === date
            ? {
                ...entry,
                items: [
                  ...entry.items,
                  {
                    foodId: recipe.id,
                    type: "combination",
                    label: recipe.name,
                    isFirstIntroduction: false,
                    recipeId: recipe.id,
                    ingredientFoodIds: recipe.ingredientFoodIds,
                  },
                ],
              }
            : entry,
        ),
      );

      persistDays(nextDays);
      result = {
        added: true,
      };

      return { days: nextDays };
    });

    return result;
  },
  removePlannedItem: (date, itemIndex) => {
    set((state) => {
      const nextDays = prepareDays(
        state.days.map((day) => {
          if (day.date !== date) {
            return day;
          }

          if (itemIndex < 0 || itemIndex >= day.items.length) {
            return day;
          }

          return {
            ...day,
            items: day.items.filter((_, index) => index !== itemIndex),
          };
        }),
      );

      persistDays(nextDays);

      return { days: nextDays };
    });
  },
  generateFirstIntroductions: () => {
    let summary = {
      scheduledCount: 0,
      populatedDayCount: 0,
      unscheduledFoodIds: [] as string[],
    };

    set((state) => {
      const baseDays =
        state.days.length > 0 ? state.days : generateInitialDayEntries();
      const daysForGeneration = baseDays.map((day) => ({
        ...day,
        items: [],
        validation: createEmptyValidationResult(),
      }));
      const generationResult = planFirstIntroductions(
        daysForGeneration,
        state.foods,
      );
      const nextDays = prepareDays(
        scheduleAllergenRepetitions(
          fillEmptyDays(generationResult.days, state.foods),
          state.foods,
        ),
      );

      persistDays(nextDays);
      summary = {
        scheduledCount:
          state.foods.length - generationResult.unscheduledFoodIds.length,
        populatedDayCount: nextDays.filter((day) => day.items.length > 0).length,
        unscheduledFoodIds: generationResult.unscheduledFoodIds,
      };

      return { days: nextDays };
    });

    return summary;
  },
  clearAllDays: () => {
    set(() => {
      const nextDays = prepareDays(generateInitialDayEntries());
      persistDays(nextDays);

      return {
        days: nextDays,
      };
    });
  },
  savePlan: () => {
    set((state) => {
      persistDays(state.days);
      return state;
    });
  },
}));

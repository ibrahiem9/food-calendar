import { create } from "zustand";
import { foods } from "../data/foods";
import { recipesById } from "../data/recipes";
import type {
  DayEntry,
  ManualEditAction,
  PendingConflict,
} from "../types/calendar";
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
const MAX_HISTORY_LENGTH = 40;

interface StoredPlannerState {
  days: DayEntry[];
}

interface EditAttemptResult {
  applied: boolean;
  requiresConfirmation: boolean;
  reason?: string;
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

const cloneDays = (days: DayEntry[]): DayEntry[] =>
  days.map((day) => ({
    ...day,
    items: day.items.map((item) => ({ ...item })),
    validation: {
      ...day.validation,
      errors: [...day.validation.errors],
      warnings: [...day.validation.warnings],
    },
  }));

const getValidationBanner = (days: DayEntry[]) =>
  days.some((day) => day.validation.errors.length > 0)
    ? "Manual override active. The current plan still contains validation errors. Save with warnings if you want to keep it as-is."
    : null;

const collectValidationErrors = (days: DayEntry[]) =>
  new Set(
    days.flatMap((day) =>
      day.validation.errors.map((error) => `${day.date}::${error}`),
    ),
  );

const getNewValidationErrors = (previousDays: DayEntry[], nextDays: DayEntry[]) => {
  const previousErrors = collectValidationErrors(previousDays);

  return nextDays.flatMap((day) =>
    day.validation.errors
      .filter((error) => !previousErrors.has(`${day.date}::${error}`))
      .map((error) => ({
        date: day.date,
        message: error,
      })),
  );
};

const getActionTargetDate = (action: ManualEditAction) =>
  action.type === "move-item" ? action.targetDate : action.date;

const buildPendingConflictTitle = (errorMessage: string) => {
  if (errorMessage.includes("Allergen first introductions")) {
    return "Allergen spacing conflict";
  }

  if (errorMessage.includes("consecutive days")) {
    return "Consecutive introductions conflict";
  }

  if (errorMessage.includes("must appear 1-2 times")) {
    return "Allergen cadence conflict";
  }

  if (errorMessage.includes("at least one food item")) {
    return "Daily minimum conflict";
  }

  if (errorMessage.includes("Combination foods cannot")) {
    return "Combination timing conflict";
  }

  if (errorMessage.includes("Cannot add combination")) {
    return "Combination ingredient conflict";
  }

  return "Validation conflict";
};

const createSingleFoodItem = (food: Food) => ({
  foodId: food.id,
  type: "single" as const,
  label: food.name,
  isFirstIntroduction: false,
});

const applyManualEditAction = (
  days: DayEntry[],
  foodsInStore: Food[],
  action: ManualEditAction,
) => {
  if (action.type === "add-food") {
    const food = foodsInStore.find((entry) => entry.id === action.foodId);

    if (!food) {
      return { ok: false as const, reason: `Food ${action.foodId} was not found.` };
    }

    const targetDay = days.find((day) => day.date === action.date);

    if (!targetDay) {
      return {
        ok: false as const,
        reason: `Date ${action.date} is outside the planning window.`,
      };
    }

    if (targetDay.items.some((item) => item.foodId === action.foodId)) {
      return {
        ok: false as const,
        reason: `${food.name} is already planned on ${action.date}.`,
      };
    }

    return {
      ok: true as const,
      days: days.map((day) =>
        day.date === action.date
          ? {
              ...day,
              items: [...day.items, createSingleFoodItem(food)],
            }
          : day,
      ),
    };
  }

  if (action.type === "remove-item") {
    const targetDay = days.find((day) => day.date === action.date);

    if (!targetDay) {
      return {
        ok: false as const,
        reason: `Date ${action.date} is outside the planning window.`,
      };
    }

    if (action.itemIndex < 0 || action.itemIndex >= targetDay.items.length) {
      return {
        ok: false as const,
        reason: "That planned item no longer exists.",
      };
    }

    return {
      ok: true as const,
      days: days.map((day) =>
        day.date === action.date
          ? {
              ...day,
              items: day.items.filter((_, index) => index !== action.itemIndex),
            }
          : day,
      ),
    };
  }

  const sourceDay = days.find((day) => day.date === action.sourceDate);
  const targetDay = days.find((day) => day.date === action.targetDate);

  if (!sourceDay || !targetDay) {
    return {
      ok: false as const,
      reason: "The move target is outside the planning window.",
    };
  }

  if (action.itemIndex < 0 || action.itemIndex >= sourceDay.items.length) {
    return {
      ok: false as const,
      reason: "That planned item no longer exists.",
    };
  }

  if (action.sourceDate === action.targetDate) {
    return {
      ok: false as const,
      reason: "Choose a different day to move this item.",
    };
  }

  const itemToMove = sourceDay.items[action.itemIndex];

  if (targetDay.items.some((item) => item.foodId === itemToMove.foodId)) {
    return {
      ok: false as const,
      reason: `${itemToMove.label} is already planned on ${action.targetDate}.`,
    };
  }

  return {
    ok: true as const,
    days: days.map((day) => {
      if (day.date === action.sourceDate) {
        return {
          ...day,
          items: day.items.filter((_, index) => index !== action.itemIndex),
        };
      }

      if (day.date === action.targetDate) {
        return {
          ...day,
          items: [...day.items, { ...itemToMove }],
        };
      }

      return day;
    }),
  };
};

const withSuggestedDate = (
  action: ManualEditAction,
  date: string,
): ManualEditAction => {
  if (action.type === "move-item") {
    return {
      ...action,
      targetDate: date,
    };
  }

  if (action.type === "add-food") {
    return {
      ...action,
      date,
    };
  }

  return action;
};

const buildConflictSuggestions = (
  days: DayEntry[],
  foodsInStore: Food[],
  action: ManualEditAction,
) => {
  if (action.type === "remove-item") {
    return [];
  }

  const targetDate = getActionTargetDate(action);
  const targetIndex = days.findIndex((day) => day.date === targetDate);

  return days
    .map((day, index) => ({
      date: day.date,
      distance: Math.abs(index - targetIndex),
    }))
    .filter((candidate) => candidate.date !== targetDate)
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      return left.date.localeCompare(right.date);
    })
    .flatMap((candidate) => {
      const suggestedAction = withSuggestedDate(action, candidate.date);
      const applicationResult = applyManualEditAction(days, foodsInStore, suggestedAction);

      if (!applicationResult.ok) {
        return [];
      }

      const preparedSuggestion = prepareDays(applicationResult.days);
      const newErrors = getNewValidationErrors(days, preparedSuggestion);

      if (newErrors.length > 0) {
        return [];
      }

      return [
        {
          date: candidate.date,
          label: candidate.date,
          description:
            action.type === "move-item"
              ? `Move this item to ${candidate.date} without adding new rule violations.`
              : `Add this food on ${candidate.date} without adding new rule violations.`,
        },
      ];
    })
    .slice(0, 3);
};

const buildPendingConflict = (
  days: DayEntry[],
  foodsInStore: Food[],
  action: ManualEditAction,
  errors: { date: string; message: string }[],
): PendingConflict => {
  const primaryError = errors[0];

  return {
    action,
    title: buildPendingConflictTitle(primaryError.message),
    summary: `${primaryError.date}: ${primaryError.message}`,
    errors: errors.map((error) => `${error.date}: ${error.message}`),
    suggestions: buildConflictSuggestions(days, foodsInStore, action),
  };
};

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
  historyPast: DayEntry[][];
  historyFuture: DayEntry[][];
  pendingConflict: PendingConflict | null;
  warningBanner: string | null;
  canUndo: boolean;
  canRedo: boolean;
  initializeDays: () => void;
  addFoodToDay: (date: string, foodId: string) => void;
  requestAddFoodToDay: (date: string, foodId: string) => EditAttemptResult;
  addRecipeToDay: (
    date: string,
    recipeId: string,
  ) => { added: boolean; reason?: string };
  removePlannedItem: (date: string, itemIndex: number) => void;
  requestRemovePlannedItem: (
    date: string,
    itemIndex: number,
  ) => EditAttemptResult;
  movePlannedItem: (
    sourceDate: string,
    itemIndex: number,
    targetDate: string,
  ) => void;
  requestMovePlannedItem: (
    sourceDate: string,
    itemIndex: number,
    targetDate: string,
  ) => EditAttemptResult;
  confirmPendingConflict: () => void;
  dismissPendingConflict: () => void;
  applyConflictSuggestion: (date: string) => EditAttemptResult;
  clearWarningBanner: () => void;
  undo: () => void;
  redo: () => void;
  generateFirstIntroductions: () => {
    scheduledCount: number;
    populatedDayCount: number;
    unscheduledFoodIds: string[];
  };
  clearAllDays: () => void;
  savePlan: () => void;
}

const getResetState = (
  days: DayEntry[],
): Pick<
  PlannerStoreState,
  | "days"
  | "historyPast"
  | "historyFuture"
  | "pendingConflict"
  | "warningBanner"
  | "canUndo"
  | "canRedo"
> => ({
  days,
  historyPast: [],
  historyFuture: [],
  pendingConflict: null,
  warningBanner: getValidationBanner(days),
  canUndo: false,
  canRedo: false,
});

const getCommittedState = (
  state: PlannerStoreState,
  days: DayEntry[],
): Pick<
  PlannerStoreState,
  | "days"
  | "historyPast"
  | "historyFuture"
  | "pendingConflict"
  | "warningBanner"
  | "canUndo"
  | "canRedo"
> => {
  const nextHistoryPast = [...state.historyPast, cloneDays(state.days)].slice(
    -MAX_HISTORY_LENGTH,
  );

  return {
    days,
    historyPast: nextHistoryPast,
    historyFuture: [],
    pendingConflict: null,
    warningBanner: getValidationBanner(days),
    canUndo: nextHistoryPast.length > 0,
    canRedo: false,
  };
};

export const usePlannerStore = create<PlannerStoreState>((set) => ({
  days: [],
  foods,
  historyPast: [],
  historyFuture: [],
  pendingConflict: null,
  warningBanner: null,
  canUndo: false,
  canRedo: false,
  initializeDays: () => {
    set(() => {
      const storedDays = loadStoredDays();
      const nextDays = storedDays ?? prepareDays(generateInitialDayEntries());

      if (!storedDays) {
        persistDays(nextDays);
      }

      return getResetState(nextDays);
    });
  },
  addFoodToDay: (date, foodId) => {
    set((state) => {
      const applicationResult = applyManualEditAction(state.days, state.foods, {
        type: "add-food",
        date,
        foodId,
      });

      if (!applicationResult.ok) {
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);

      persistDays(nextDays);

      return getCommittedState(state, nextDays);
    });
  },
  requestAddFoodToDay: (date, foodId) => {
    let result: EditAttemptResult = {
      applied: false,
      requiresConfirmation: false,
    };

    set((state) => {
      const action: ManualEditAction = {
        type: "add-food",
        date,
        foodId,
      };
      const applicationResult = applyManualEditAction(state.days, state.foods, action);

      if (!applicationResult.ok) {
        result = {
          applied: false,
          requiresConfirmation: false,
          reason: applicationResult.reason,
        };
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);
      const newErrors = getNewValidationErrors(state.days, nextDays);

      if (newErrors.length > 0) {
        result = {
          applied: false,
          requiresConfirmation: true,
          reason: newErrors[0].message,
        };

        return {
          ...state,
          pendingConflict: buildPendingConflict(
            state.days,
            state.foods,
            action,
            newErrors,
          ),
        };
      }

      persistDays(nextDays);
      result = {
        applied: true,
        requiresConfirmation: false,
      };

      return getCommittedState(state, nextDays);
    });

    return result;
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

      return getCommittedState(state, nextDays);
    });

    return result;
  },
  removePlannedItem: (date, itemIndex) => {
    set((state) => {
      const applicationResult = applyManualEditAction(state.days, state.foods, {
        type: "remove-item",
        date,
        itemIndex,
      });

      if (!applicationResult.ok) {
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);

      persistDays(nextDays);

      return getCommittedState(state, nextDays);
    });
  },
  requestRemovePlannedItem: (date, itemIndex) => {
    let result: EditAttemptResult = {
      applied: false,
      requiresConfirmation: false,
    };

    set((state) => {
      const action: ManualEditAction = {
        type: "remove-item",
        date,
        itemIndex,
      };
      const applicationResult = applyManualEditAction(state.days, state.foods, action);

      if (!applicationResult.ok) {
        result = {
          applied: false,
          requiresConfirmation: false,
          reason: applicationResult.reason,
        };
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);
      const newErrors = getNewValidationErrors(state.days, nextDays);

      if (newErrors.length > 0) {
        result = {
          applied: false,
          requiresConfirmation: true,
          reason: newErrors[0].message,
        };

        return {
          ...state,
          pendingConflict: buildPendingConflict(
            state.days,
            state.foods,
            action,
            newErrors,
          ),
        };
      }

      persistDays(nextDays);
      result = {
        applied: true,
        requiresConfirmation: false,
      };

      return getCommittedState(state, nextDays);
    });

    return result;
  },
  movePlannedItem: (sourceDate, itemIndex, targetDate) => {
    set((state) => {
      const applicationResult = applyManualEditAction(state.days, state.foods, {
        type: "move-item",
        sourceDate,
        itemIndex,
        targetDate,
      });

      if (!applicationResult.ok) {
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);

      persistDays(nextDays);

      return getCommittedState(state, nextDays);
    });
  },
  requestMovePlannedItem: (sourceDate, itemIndex, targetDate) => {
    let result: EditAttemptResult = {
      applied: false,
      requiresConfirmation: false,
    };

    set((state) => {
      const action: ManualEditAction = {
        type: "move-item",
        sourceDate,
        itemIndex,
        targetDate,
      };
      const applicationResult = applyManualEditAction(state.days, state.foods, action);

      if (!applicationResult.ok) {
        result = {
          applied: false,
          requiresConfirmation: false,
          reason: applicationResult.reason,
        };
        return state;
      }

      const nextDays = prepareDays(applicationResult.days);
      const newErrors = getNewValidationErrors(state.days, nextDays);

      if (newErrors.length > 0) {
        result = {
          applied: false,
          requiresConfirmation: true,
          reason: newErrors[0].message,
        };

        return {
          ...state,
          pendingConflict: buildPendingConflict(
            state.days,
            state.foods,
            action,
            newErrors,
          ),
        };
      }

      persistDays(nextDays);
      result = {
        applied: true,
        requiresConfirmation: false,
      };

      return getCommittedState(state, nextDays);
    });

    return result;
  },
  confirmPendingConflict: () => {
    set((state) => {
      if (!state.pendingConflict) {
        return state;
      }

      const applicationResult = applyManualEditAction(
        state.days,
        state.foods,
        state.pendingConflict.action,
      );

      if (!applicationResult.ok) {
        return {
          ...state,
          pendingConflict: null,
        };
      }

      const nextDays = prepareDays(applicationResult.days);
      persistDays(nextDays);

      return getCommittedState(state, nextDays);
    });
  },
  dismissPendingConflict: () => {
    set((state) => ({
      ...state,
      pendingConflict: null,
    }));
  },
  applyConflictSuggestion: (date) => {
    let result: EditAttemptResult = {
      applied: false,
      requiresConfirmation: false,
    };

    set((state) => {
      if (!state.pendingConflict) {
        result = {
          applied: false,
          requiresConfirmation: false,
          reason: "No pending conflict is open.",
        };
        return state;
      }

      const action = withSuggestedDate(state.pendingConflict.action, date);
      const applicationResult = applyManualEditAction(state.days, state.foods, action);

      if (!applicationResult.ok) {
        result = {
          applied: false,
          requiresConfirmation: false,
          reason: applicationResult.reason,
        };
        return {
          ...state,
          pendingConflict: null,
        };
      }

      const nextDays = prepareDays(applicationResult.days);
      const newErrors = getNewValidationErrors(state.days, nextDays);

      if (newErrors.length > 0) {
        result = {
          applied: false,
          requiresConfirmation: true,
          reason: newErrors[0].message,
        };

        return {
          ...state,
          pendingConflict: buildPendingConflict(
            state.days,
            state.foods,
            action,
            newErrors,
          ),
        };
      }

      persistDays(nextDays);
      result = {
        applied: true,
        requiresConfirmation: false,
      };

      return getCommittedState(state, nextDays);
    });

    return result;
  },
  clearWarningBanner: () => {
    set((state) => ({
      ...state,
      warningBanner: null,
    }));
  },
  undo: () => {
    set((state) => {
      if (state.historyPast.length === 0) {
        return state;
      }

      const previousDays = cloneDays(state.historyPast[state.historyPast.length - 1]);
      const nextHistoryPast = state.historyPast.slice(0, -1);
      const nextHistoryFuture = [cloneDays(state.days), ...state.historyFuture].slice(
        0,
        MAX_HISTORY_LENGTH,
      );

      persistDays(previousDays);

      return {
        ...state,
        days: previousDays,
        historyPast: nextHistoryPast,
        historyFuture: nextHistoryFuture,
        pendingConflict: null,
        warningBanner: getValidationBanner(previousDays),
        canUndo: nextHistoryPast.length > 0,
        canRedo: nextHistoryFuture.length > 0,
      };
    });
  },
  redo: () => {
    set((state) => {
      if (state.historyFuture.length === 0) {
        return state;
      }

      const nextDays = cloneDays(state.historyFuture[0]);
      const nextHistoryFuture = state.historyFuture.slice(1);
      const nextHistoryPast = [...state.historyPast, cloneDays(state.days)].slice(
        -MAX_HISTORY_LENGTH,
      );

      persistDays(nextDays);

      return {
        ...state,
        days: nextDays,
        historyPast: nextHistoryPast,
        historyFuture: nextHistoryFuture,
        pendingConflict: null,
        warningBanner: getValidationBanner(nextDays),
        canUndo: nextHistoryPast.length > 0,
        canRedo: nextHistoryFuture.length > 0,
      };
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

      return getCommittedState(state, nextDays);
    });

    return summary;
  },
  clearAllDays: () => {
    set((state) => {
      const nextDays = prepareDays(generateInitialDayEntries());
      persistDays(nextDays);

      return getCommittedState(state, nextDays);
    });
  },
  savePlan: () => {
    set((state) => {
      persistDays(state.days);
      return state;
    });
  },
}));

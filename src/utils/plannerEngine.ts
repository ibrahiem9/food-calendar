import {
  endOfWeek,
  isAfter,
  isBefore,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { DayEntry, PlannedItem } from "../types/calendar";
import type { Food } from "../types/food";
import { createEmptyValidationResult } from "./dateUtils";

const MAX_NEW_ITEMS_PER_DAY = 2;
const INTRO_DAY_GAP = 2;
const ALLERGEN_INTRO_DAY_GAP = 4;
const ALLERGEN_WEEKLY_MIN = 1;
const ALLERGEN_WEEKLY_MAX = 2;

const createFirstIntroductionItem = (food: Food): PlannedItem => ({
  foodId: food.id,
  type: "single",
  label: food.name,
  isFirstIntroduction: true,
});

const createRepeatItem = (food: Food): PlannedItem => ({
  foodId: food.id,
  type: "single",
  label: food.name,
  isFirstIntroduction: false,
});

const resetDaysForGeneration = (days: DayEntry[]): DayEntry[] =>
  days.map((day) => ({
    ...day,
    items: [] as PlannedItem[],
    validation: createEmptyValidationResult(),
  }));

export const planFirstIntroductions = (days: DayEntry[], foods: Food[]) => {
  const scheduledDays = resetDaysForGeneration(days);
  const unscheduledFoodIds: string[] = [];
  const allergenQueue = [...foods]
    .filter((food) => food.isAllergen)
    .sort((left, right) => left.name.localeCompare(right.name));
  const nonAllergenQueue = [...foods]
    .filter((food) => !food.isAllergen)
    .sort((left, right) => left.name.localeCompare(right.name));

  for (
    let dayIndex = 0;
    dayIndex < scheduledDays.length &&
    (allergenQueue.length > 0 || nonAllergenQueue.length > 0);
    dayIndex += INTRO_DAY_GAP
  ) {
    const nextItems: PlannedItem[] = [];
    const isAllergenIntroDay = dayIndex % ALLERGEN_INTRO_DAY_GAP === 0;

    if (isAllergenIntroDay && allergenQueue.length > 0) {
      const nextAllergen = allergenQueue.shift();

      if (nextAllergen) {
        nextItems.push(createFirstIntroductionItem(nextAllergen));
      }
    }

    while (
      nextItems.length < MAX_NEW_ITEMS_PER_DAY &&
      nonAllergenQueue.length > 0
    ) {
      const nextFood = nonAllergenQueue.shift();

      if (nextFood) {
        nextItems.push(createFirstIntroductionItem(nextFood));
      }
    }

    if (nextItems.length === 0) {
      continue;
    }

    scheduledDays[dayIndex] = {
      ...scheduledDays[dayIndex],
      items: nextItems,
    };
  }

  unscheduledFoodIds.push(
    ...allergenQueue.map((food) => food.id),
    ...nonAllergenQueue.map((food) => food.id),
  );

  return {
    days: scheduledDays,
    unscheduledFoodIds,
  };
};

const getPreviouslyIntroducedFoods = (days: DayEntry[], foods: Food[], dayIndex: number) => {
  const introducedFoodIds = new Set<string>();

  for (let index = 0; index < dayIndex; index += 1) {
    for (const item of days[index].items) {
      introducedFoodIds.add(item.foodId);
    }
  }

  return foods.filter((food) => introducedFoodIds.has(food.id));
};

const pickRepeatFoodsForDay = (availableFoods: Food[], dayIndex: number) => {
  if (availableFoods.length === 0) {
    return [];
  }

  const preferredFoods = availableFoods.filter((food) => !food.isAllergen);
  const primaryPool = preferredFoods.length > 0 ? preferredFoods : availableFoods;
  const repeatCount = Math.min(primaryPool.length, dayIndex % 3 === 0 ? 2 : 1);
  const pickedFoods: Food[] = [];

  for (let offset = 0; offset < repeatCount; offset += 1) {
    pickedFoods.push(primaryPool[(dayIndex + offset) % primaryPool.length]);
  }

  return pickedFoods;
};

export const fillEmptyDays = (days: DayEntry[], foods: Food[]) =>
  days.map((day, index, currentDays) => {
    if (day.items.length > 0) {
      return day;
    }

    const availableFoods = getPreviouslyIntroducedFoods(currentDays, foods, index);
    const repeatFoods = pickRepeatFoodsForDay(availableFoods, index);

    if (repeatFoods.length === 0) {
      return day;
    }

    return {
      ...day,
      items: repeatFoods.map(createRepeatItem),
    };
  });

const getWeekDayIndices = (days: DayEntry[], date: string, minimumDate?: string) => {
  const weekStart = startOfWeek(parseISO(date), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parseISO(date), { weekStartsOn: 0 });

  return days.flatMap((day, index) => {
    const dayDate = parseISO(day.date);

    if (
      isBefore(dayDate, weekStart) ||
      isAfter(dayDate, weekEnd) ||
      (minimumDate && isBefore(dayDate, parseISO(minimumDate)))
    ) {
      return [];
    }

    return [index];
  });
};

const getFoodAppearanceCount = (
  days: DayEntry[],
  foodId: string,
  indices: number[],
) =>
  indices.reduce(
    (count, index) =>
      count +
      (days[index].items.some((item) => item.foodId === foodId) ? 1 : 0),
    0,
  );

const pickBestAllergenRepeatDay = (
  days: DayEntry[],
  allergenId: string,
  indices: number[],
) => {
  const candidateIndices = indices.filter(
    (index) => !days[index].items.some((item) => item.foodId === allergenId),
  );

  if (candidateIndices.length === 0) {
    return null;
  }

  candidateIndices.sort((left, right) => {
    const leftNewCount = days[left].items.filter(
      (item) => item.isFirstIntroduction,
    ).length;
    const rightNewCount = days[right].items.filter(
      (item) => item.isFirstIntroduction,
    ).length;

    if (leftNewCount !== rightNewCount) {
      return leftNewCount - rightNewCount;
    }

    if (days[left].items.length !== days[right].items.length) {
      return days[left].items.length - days[right].items.length;
    }

    return left - right;
  });

  return candidateIndices[0] ?? null;
};

const trimExcessAllergenRepeats = (
  days: DayEntry[],
  allergenId: string,
  indices: number[],
) => {
  let appearances = getFoodAppearanceCount(days, allergenId, indices);

  if (appearances <= ALLERGEN_WEEKLY_MAX) {
    return days;
  }

  const candidateIndices = [...indices].sort((left, right) => right - left);
  const nextDays = [...days];

  for (const index of candidateIndices) {
    if (appearances <= ALLERGEN_WEEKLY_MAX) {
      break;
    }

    const removableIndex = nextDays[index].items.findIndex(
      (item) =>
        item.foodId === allergenId &&
        !item.isFirstIntroduction &&
        nextDays[index].items.length > 1,
    );

    if (removableIndex === -1) {
      continue;
    }

    nextDays[index] = {
      ...nextDays[index],
      items: nextDays[index].items.filter((_, itemIndex) => itemIndex !== removableIndex),
    };
    appearances -= 1;
  }

  return nextDays;
};

export const scheduleAllergenRepetitions = (days: DayEntry[], foods: Food[]) => {
  const allergenFoods = foods.filter((food) => food.isAllergen);
  let scheduledDays = days.map((day) => ({
    ...day,
    items: [...day.items],
  }));

  for (const allergen of allergenFoods) {
    const firstIntroDay = scheduledDays.find((day) =>
      day.items.some(
        (item) => item.foodId === allergen.id && item.isFirstIntroduction,
      ),
    );

    if (!firstIntroDay) {
      continue;
    }

    let weekCursor = startOfWeek(parseISO(firstIntroDay.date), { weekStartsOn: 0 });
    const lastPlanDate = parseISO(scheduledDays[scheduledDays.length - 1].date);

    while (!isAfter(weekCursor, lastPlanDate)) {
      const weekDayIndices = getWeekDayIndices(
        scheduledDays,
        weekCursor.toISOString(),
        firstIntroDay.date,
      );

      if (weekDayIndices.length > 0) {
        scheduledDays = trimExcessAllergenRepeats(
          scheduledDays,
          allergen.id,
          weekDayIndices,
        );

        const appearances = getFoodAppearanceCount(
          scheduledDays,
          allergen.id,
          weekDayIndices,
        );

        if (appearances < ALLERGEN_WEEKLY_MIN) {
          const insertionIndex = pickBestAllergenRepeatDay(
            scheduledDays,
            allergen.id,
            weekDayIndices,
          );

          if (insertionIndex !== null) {
            scheduledDays[insertionIndex] = {
              ...scheduledDays[insertionIndex],
              items: [
                ...scheduledDays[insertionIndex].items,
                createRepeatItem(allergen),
              ],
            };
          }
        }
      }

      weekCursor = new Date(
        weekCursor.getFullYear(),
        weekCursor.getMonth(),
        weekCursor.getDate() + 7,
      );
    }
  }

  return scheduledDays;
};

import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isBefore,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { foods, foodsByCategory } from "../data/foods";
import { getFoodVisual } from "../data/foodVisuals";
import { recipesById } from "../data/recipes";
import type { DayEntry, PlannedItem } from "../types/calendar";
import { FOOD_CATEGORIES, type Food, type FoodCategory } from "../types/food";
import {
  buildSingleIntroductionMap,
  getFoodName,
  getRecipeEligibilityForDate,
} from "../utils/recipeEligibility";
import { COMBINATION_START_DATE } from "../validators/validateCombinationStartDate";

const FOOD_BY_ID = new Map(foods.map((food) => [food.id, food]));
const ALLERGEN_IDS = new Set(
  foods.filter((food) => food.isAllergen).map((food) => food.id),
);

const formatDateLabel = (date: string) => format(parseISO(date), "MMM d, yyyy");

const getPreviousAllergenIntroduction = (days: DayEntry[], index: number) => {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const match = days[cursor].items.find(
      (item) =>
        item.type === "single" &&
        item.isFirstIntroduction &&
        ALLERGEN_IDS.has(item.foodId),
    );

    if (match) {
      return {
        item: match,
        date: days[cursor].date,
      };
    }
  }

  return null;
};

const getWeekAppearanceCount = (days: DayEntry[], date: string, foodId: string) => {
  const parsedDate = parseISO(date);
  const weekStart = startOfWeek(parsedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parsedDate, { weekStartsOn: 0 });

  return days.reduce((count, day) => {
    const dayDate = parseISO(day.date);

    if (dayDate < weekStart || dayDate > weekEnd) {
      return count;
    }

    return count + (day.items.some((item) => item.foodId === foodId) ? 1 : 0);
  }, 0);
};

const getEarliestIntroductionDate = (
  days: DayEntry[],
  food: Food,
  startIndex: number,
) => {
  for (let index = Math.max(startIndex, 0); index < days.length; index += 1) {
    const previousDay = days[index - 1];
    const previousHadFirstIntroduction = previousDay?.items.some(
      (item) => item.type === "single" && item.isFirstIntroduction,
    );

    if (previousHadFirstIntroduction) {
      continue;
    }

    if (food.isAllergen) {
      const previousAllergenIntroduction = getPreviousAllergenIntroduction(days, index);

      if (previousAllergenIntroduction) {
        const gap = differenceInCalendarDays(
          parseISO(days[index].date),
          parseISO(previousAllergenIntroduction.date),
        );

        if (gap <= 3) {
          continue;
        }
      }
    }

    return days[index].date;
  }

  return null;
};

const getSelectedFoodStatus = (
  days: DayEntry[],
  selectedDay: DayEntry,
  selectedFood: Food,
  selectedDayIndex: number,
) => {
  const introMap = buildSingleIntroductionMap(days);
  const firstIntroductionDate = introMap.get(selectedFood.id);
  const scheduledOnSelectedDay = selectedDay.items.find(
    (item) => item.foodId === selectedFood.id,
  );

  if (scheduledOnSelectedDay) {
    return {
      tone: "bg-[#dfead9] text-stone-800",
      title:
        scheduledOnSelectedDay.type === "combination"
          ? `${selectedFood.name} is already part of a combination on ${formatDateLabel(selectedDay.date)}.`
          : `${selectedFood.name} is already planned on ${formatDateLabel(selectedDay.date)}.`,
      reasons: [
        scheduledOnSelectedDay.isFirstIntroduction
          ? "This day currently carries the first single-food introduction."
          : "This day already uses the food as a repeat, so no first-introduction slot is being consumed here.",
      ],
      earliestDate: firstIntroductionDate ?? selectedDay.date,
    };
  }

  if (firstIntroductionDate && firstIntroductionDate < selectedDay.date) {
    const reasons = [
      `First introduced on ${formatDateLabel(firstIntroductionDate)}, so it can be used as a repeat on the selected day.`,
    ];

    if (selectedFood.isAllergen) {
      const weeklyCount = getWeekAppearanceCount(days, selectedDay.date, selectedFood.id);
      reasons.push(
        weeklyCount === 0
          ? "This allergen is due in the selected Sunday-Saturday week."
          : `This allergen already appears ${weeklyCount} time${weeklyCount === 1 ? "" : "s"} in the selected week.`,
      );
    }

    return {
      tone: "bg-[#dfead9] text-stone-800",
      title: `${selectedFood.name} is unlocked for ${formatDateLabel(selectedDay.date)}.`,
      reasons,
      earliestDate: firstIntroductionDate,
    };
  }

  const blockingReasons: string[] = [];
  const previousDay = days[selectedDayIndex - 1];
  const previousNewItems = previousDay?.items.filter(
    (item) => item.type === "single" && item.isFirstIntroduction,
  );

  if (previousNewItems && previousNewItems.length > 0) {
    blockingReasons.push(
      `${previousNewItems.map((item) => item.label).join(", ")} was introduced on ${formatDateLabel(previousDay.date)}. The next day cannot also start a new food.`,
    );
  }

  if (selectedFood.isAllergen) {
    const previousAllergenIntroduction = getPreviousAllergenIntroduction(
      days,
      selectedDayIndex,
    );

    if (previousAllergenIntroduction) {
      const gap = differenceInCalendarDays(
        parseISO(selectedDay.date),
        parseISO(previousAllergenIntroduction.date),
      );

      if (gap <= 3) {
        blockingReasons.push(
          `${previousAllergenIntroduction.item.label} was introduced ${gap} day${gap === 1 ? "" : "s"} ago on ${formatDateLabel(previousAllergenIntroduction.date)}. Need 3 full gap days before the next allergen.`,
        );
      }
    }
  }

  if (firstIntroductionDate && firstIntroductionDate > selectedDay.date) {
    blockingReasons.push(
      `Its first introduction is currently scheduled later on ${formatDateLabel(firstIntroductionDate)}.`,
    );
  }

  const earliestDate = getEarliestIntroductionDate(days, selectedFood, selectedDayIndex);

  if (blockingReasons.length === 0) {
    return {
      tone: "bg-[#dfead9] text-stone-800",
      title: `${selectedFood.name} can be introduced on ${formatDateLabel(selectedDay.date)}.`,
      reasons: [
        "The previous day does not contain another first single-food introduction.",
        selectedFood.isAllergen
          ? "The allergen spacing buffer is clear for this date."
          : "No allergen-specific spacing applies to this food.",
      ],
      earliestDate: selectedDay.date,
    };
  }

  return {
    tone: "bg-[#f7d8cc] text-stone-900",
    title: `${selectedFood.name} is blocked on ${formatDateLabel(selectedDay.date)}.`,
    reasons: blockingReasons,
    earliestDate,
  };
};

const getItemExplanation = (
  days: DayEntry[],
  day: DayEntry,
  dayIndex: number,
  item: PlannedItem,
  introMap: Map<string, string>,
) => {
  if (item.type === "combination") {
    const recipe = item.recipeId ? recipesById.get(item.recipeId) : undefined;
    const eligibility = recipe
      ? getRecipeEligibilityForDate(recipe, day.date, introMap)
      : null;

    return {
      title: `${item.label} was placed as a combination.`,
      tone: "bg-[#e5edf6] text-sky-950",
      details: [
        isBefore(parseISO(day.date), parseISO(COMBINATION_START_DATE))
          ? "This date falls before the May 1, 2026 combination gate."
          : "The selected date is after the May 1, 2026 combination start.",
        item.ingredientFoodIds && item.ingredientFoodIds.length > 0
          ? `Ingredients: ${item.ingredientFoodIds
              .map((foodId) => {
                const introDate = introMap.get(foodId);
                return `${getFoodName(foodId)}${introDate ? ` (${format(parseISO(introDate), "MMM d")})` : " (not introduced yet)"}`;
              })
              .join(", ")}.`
          : "Ingredient list is not attached to this recipe item.",
        eligibility && eligibility.reasons.length > 0
          ? `Current validation warning: ${eligibility.reasons[0]}`
          : "Every ingredient was introduced earlier as a single food, so the recipe is unlocked here.",
      ],
    };
  }

  if (!item.isFirstIntroduction) {
    const firstIntroductionDate = introMap.get(item.foodId);
    const details = [
      firstIntroductionDate
        ? `First introduced on ${formatDateLabel(firstIntroductionDate)}, so this entry functions as a repeat.`
        : "This item is marked as a repeat, but no earlier first-introduction date was found.",
    ];

    if (ALLERGEN_IDS.has(item.foodId)) {
      const weeklyCount = getWeekAppearanceCount(days, day.date, item.foodId);
      details.push(
        `This allergen appears ${weeklyCount} time${weeklyCount === 1 ? "" : "s"} in the selected Sunday-Saturday week.`,
      );
    }

    return {
      title: `${item.label} is supporting repetition.`,
      tone: "bg-[#edf2ec] text-stone-800",
      details,
    };
  }

  const details = [
    "This item is consuming a first-introduction slot on the selected day.",
  ];
  const previousDay = days[dayIndex - 1];
  const previousNewItems = previousDay?.items.filter(
    (entry) => entry.type === "single" && entry.isFirstIntroduction,
  );

  if (previousNewItems && previousNewItems.length > 0) {
    details.push(
      `This currently conflicts with the consecutive-introduction rule because ${previousNewItems.map((entry) => entry.label).join(", ")} was introduced on ${formatDateLabel(previousDay.date)}.`,
    );
  } else {
    details.push("The previous day is clear of first single-food introductions, so the intro buffer is open.");
  }

  if (ALLERGEN_IDS.has(item.foodId)) {
    const previousAllergenIntroduction = getPreviousAllergenIntroduction(days, dayIndex);

    if (previousAllergenIntroduction) {
      const gap = differenceInCalendarDays(
        parseISO(day.date),
        parseISO(previousAllergenIntroduction.date),
      );

      details.push(
        gap <= 3
          ? `${previousAllergenIntroduction.item.label} was introduced ${gap} day${gap === 1 ? "" : "s"} earlier, so this allergen currently violates spacing.`
          : `${previousAllergenIntroduction.item.label} was introduced on ${formatDateLabel(previousAllergenIntroduction.date)}, leaving a ${gap}-day gap before this allergen.`,
      );
    } else {
      details.push("No earlier allergen introduction exists, so this allergen starts the cadence timeline.");
    }

    details.push(
      `After today, the next allergen introduction should wait until ${formatDateLabel(
        format(addDays(parseISO(day.date), 4), "yyyy-MM-dd"),
      )}.`,
    );
  }

  return {
    title: `${item.label} is a first introduction.`,
    tone: "bg-[#dfead9] text-stone-800",
    details,
  };
};

export function InspectorPanel({
  days,
  selectedDayDate,
  selectedFoodId,
  onSelectDay,
  onSelectFood,
  onAddFood,
  onRemovePlannedItem,
  onMovePlannedItem,
}: {
  days: DayEntry[];
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
  onAddFood: (date: string, foodId: string) => void;
  onRemovePlannedItem: (date: string, itemIndex: number) => void;
  onMovePlannedItem: (sourceDate: string, itemIndex: number, targetDate: string) => void;
}) {
  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDayDate) ?? days[0],
    [days, selectedDayDate],
  );
  const selectedFood = FOOD_BY_ID.get(selectedFoodId) ?? foods[0];
  const selectedDayIndex = selectedDay
    ? days.findIndex((day) => day.date === selectedDay.date)
    : -1;
  const introMap = useMemo(() => buildSingleIntroductionMap(days), [days]);
  const highlightedDays = useMemo(
    () =>
      days.filter(
        (day) =>
          day.validation.errors.length > 0 ||
          day.items.some((item) => item.isFirstIntroduction),
      ),
    [days],
  );
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>(
    selectedFood?.category ?? "fruit",
  );
  const [candidateFoodId, setCandidateFoodId] = useState(selectedFood?.id ?? "");
  const [moveTargets, setMoveTargets] = useState<Record<number, string>>({});

  useEffect(() => {
    if (selectedFood) {
      setSelectedCategory(selectedFood.category);
      setCandidateFoodId(selectedFood.id);
    }
  }, [selectedFood?.category, selectedFood?.id]);

  useEffect(() => {
    setMoveTargets({});
  }, [selectedDay?.date]);

  if (!selectedDay || !selectedFood) {
    return null;
  }

  const selectedFoodStatus = getSelectedFoodStatus(
    days,
    selectedDay,
    selectedFood,
    selectedDayIndex,
  );
  const candidateFoods = foodsByCategory[selectedCategory];
  const currentVisual = getFoodVisual(selectedFood.id);

  return (
    <section className="rounded-[2rem] bg-[#eef2ed] p-5 sm:p-6">
      <div className="space-y-4">
        <div
          className={`rounded-[1.6rem] bg-gradient-to-br ${currentVisual.accentClassName} p-4`}
        >
          <div className="flex items-center gap-4">
            <img
              src={currentVisual.imagePath}
              alt={currentVisual.alt}
              className={`h-20 w-20 rounded-[1.1rem] object-cover ${currentVisual.imageClassName ?? ""}`}
              style={currentVisual.imageStyle}
            />
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Context inspector
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {formatDateLabel(selectedDay.date)}
              </h2>
              <p className="mt-1 font-sans text-sm text-stone-700">
                Focused on {selectedFood.name}.
              </p>
            </div>
          </div>
        </div>

        <article className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Selected day
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {formatDateLabel(selectedDay.date)}
              </p>
            </div>
            <span className="rounded-full bg-[#edf2ec] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
              {selectedDay.items.length} item{selectedDay.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            <label className="space-y-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Add food category
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value as FoodCategory)}
                className="w-full rounded-[1rem] bg-[#f6f8f5] px-3 py-3 text-sm text-stone-800 outline-none"
              >
                {FOOD_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Add food
              </span>
              <select
                value={candidateFoodId}
                onChange={(event) => {
                  setCandidateFoodId(event.target.value);
                  onSelectFood(event.target.value);
                }}
                className="w-full rounded-[1rem] bg-[#f6f8f5] px-3 py-3 text-sm text-stone-800 outline-none"
              >
                {candidateFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => candidateFoodId && onAddFood(selectedDay.date, candidateFoodId)}
              className="rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-4 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
            >
              Add to selected day
            </button>
          </div>
        </article>

        <article className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Planned items
          </p>
          <div className="mt-4 space-y-3">
            {selectedDay.items.length > 0 ? (
              selectedDay.items.map((item, index) => {
                const explanation = getItemExplanation(
                  days,
                  selectedDay,
                  selectedDayIndex,
                  item,
                  introMap,
                );
                const inspectFoodId =
                  item.type === "combination"
                    ? item.ingredientFoodIds?.[0] ?? ""
                    : item.foodId;
                const moveTarget =
                  moveTargets[index] ??
                  days[selectedDayIndex + 1]?.date ??
                  selectedDay.date;

                return (
                  <div key={`${selectedDay.date}-${item.foodId}-${index}`} className="rounded-[1.1rem] bg-[#f6f8f5] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-sm font-semibold text-stone-900">
                          {item.label}
                        </p>
                        <p className={`mt-2 inline-flex rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${explanation.tone}`}>
                          {item.type === "combination"
                            ? "Combination"
                            : item.isFirstIntroduction
                              ? "New intro"
                              : "Repeat"}
                        </p>
                      </div>
                      {inspectFoodId ? (
                        <button
                          type="button"
                          onClick={() => onSelectFood(inspectFoodId)}
                          className="rounded-full bg-[#ecefe9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700"
                        >
                          Inspect
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-3 font-sans text-sm leading-6 text-stone-700">
                      {explanation.title}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onRemovePlannedItem(selectedDay.date, index)}
                        className="rounded-full bg-[#f5ddd4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-800"
                      >
                        Remove
                      </button>
                      <input
                        type="date"
                        value={moveTarget}
                        min={days[0]?.date}
                        max={days[days.length - 1]?.date}
                        onChange={(event) =>
                          setMoveTargets((current) => ({
                            ...current,
                            [index]: event.target.value,
                          }))
                        }
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-700 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onMovePlannedItem(selectedDay.date, index, moveTarget)
                        }
                        className="rounded-full bg-[#ecefe9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700"
                      >
                        Move
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
                No foods are planned here yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Food explanation
          </p>
          <p className={`mt-4 rounded-[1rem] px-3 py-3 font-sans text-sm font-medium leading-6 ${selectedFoodStatus.tone}`}>
            {selectedFoodStatus.title}
          </p>
          <ul className="mt-4 space-y-2">
            {selectedFoodStatus.reasons.map((reason, index) => (
              <li
                key={`${selectedFood.id}-reason-${index}`}
                className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700"
              >
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-[1rem] bg-[#eef2ed] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
            {selectedFoodStatus.earliestDate
              ? `Earliest workable first-introduction date from this context: ${formatDateLabel(selectedFoodStatus.earliestDate)}.`
              : "No valid first-introduction slot remains in the current planning window from this point forward."}
          </p>
        </article>

        <article className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Quick picks
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {highlightedDays.slice(0, 6).map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDay(day.date)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  day.date === selectedDay.date
                    ? "bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                    : "bg-[#ecefe9] text-stone-700 hover:bg-[#e3e7e1]"
                }`}
              >
                {format(parseISO(day.date), "MMM d")}
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

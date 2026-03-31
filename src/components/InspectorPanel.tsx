import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isBefore,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useMemo } from "react";
import { foods } from "../data/foods";
import { recipesById } from "../data/recipes";
import type { DayEntry, PlannedItem } from "../types/calendar";
import type { Food } from "../types/food";
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
          : "This day already uses the food as a repeat, so no first-introduction rule is being consumed here.",
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
}: {
  days: DayEntry[];
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
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

  if (!selectedDay || !selectedFood) {
    return null;
  }

  const selectedFoodStatus = getSelectedFoodStatus(
    days,
    selectedDay,
    selectedFood,
    selectedDayIndex,
  );

  return (
    <section className="rounded-[2rem] bg-[#eef2ed] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Inspector
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Explanations for the selected day and food
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Click any day card or food chip to inspect why it was placed, what rule buffers are active,
                and whether the selected food is unlocked or blocked on that date.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Selected Day
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {formatDateLabel(selectedDay.date)}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {selectedDay.items.length} planned item{selectedDay.items.length === 1 ? "" : "s"}.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Selected Food
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {selectedFood.name}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {selectedFood.isAllergen ? "Allergen" : "Single food"} in the {selectedFood.category} category.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <div className="space-y-4">
            <article className="rounded-[1.5rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Day Explanation
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                    Why foods were chosen on {format(parseISO(selectedDay.date), "MMM d")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectDay(highlightedDays[0]?.date ?? selectedDay.date)}
                  className="rounded-full bg-[#ecefe9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700 transition hover:bg-[#e3e7e1]"
                >
                  Jump to flagged day
                </button>
              </div>

              {selectedDay.validation.errors.length > 0 ||
              selectedDay.validation.warnings.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {selectedDay.validation.errors.map((error, index) => (
                    <p
                      key={`selected-error-${index}`}
                      className="rounded-[1rem] bg-[#f8e1d8] px-3 py-3 font-sans text-sm leading-6 text-stone-800"
                    >
                      {error}
                    </p>
                  ))}
                  {selectedDay.validation.warnings.map((warning, index) => (
                    <p
                      key={`selected-warning-${index}`}
                      className="rounded-[1rem] bg-[#efe4d2] px-3 py-3 font-sans text-sm leading-6 text-stone-800"
                    >
                      {warning}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-[1rem] bg-[#edf3ee] px-3 py-3 font-sans text-sm leading-6 text-stone-800">
                  This day currently passes all active validation checks.
                </p>
              )}

              {selectedDay.items.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {selectedDay.items.map((item, index) => {
                    const inspectFoodId =
                      item.type === "combination"
                        ? item.ingredientFoodIds?.[0] ?? ""
                        : item.foodId;
                    const explanation = getItemExplanation(
                      days,
                      selectedDay,
                      selectedDayIndex,
                      item,
                      introMap,
                    );

                    return (
                      <article
                        key={`${selectedDay.date}-${item.foodId}-${index}`}
                        className="rounded-[1.25rem] bg-[#f6f8f5] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                              {item.label}
                            </p>
                            <p className={`mt-2 inline-flex rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${explanation.tone}`}>
                              {item.type === "combination" ? "Combination" : item.isFirstIntroduction ? "New intro" : "Repeat"}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!inspectFoodId}
                            onClick={() => {
                              if (inspectFoodId) {
                                onSelectFood(inspectFoodId);
                              }
                            }}
                            className="rounded-full bg-[#ecefe9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700 transition hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:bg-[#e7ebe7] disabled:text-stone-400"
                          >
                            {item.type === "combination" ? "Inspect First Ingredient" : "Inspect Food"}
                          </button>
                        </div>

                        <p className="mt-3 font-sans text-sm font-medium text-stone-800">
                          {explanation.title}
                        </p>
                        <ul className="mt-3 space-y-2">
                          {explanation.details.map((detail, detailIndex) => (
                            <li
                              key={`${item.foodId}-detail-${detailIndex}`}
                              className="rounded-[1rem] bg-white/88 px-3 py-3 font-sans text-sm leading-6 text-stone-700"
                            >
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-[1rem] bg-white/88 px-3 py-3 font-sans text-sm leading-6 text-stone-700">
                  No foods are planned here yet. Use the selected food explanation to see whether the day is open
                  for a new introduction or better suited for a repeat.
                </p>
              )}
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-[1.5rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Food Explanation
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                Why {selectedFood.name} is allowed or blocked
              </h3>
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

            <article className="rounded-[1.5rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Quick Picks
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
              <p className="mt-4 font-sans text-sm leading-6 text-stone-700">
                These days are the fastest way to inspect first introductions or current rule violations.
              </p>
            </article>

            <article className="rounded-[1.5rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Tips
              </p>
              <ul className="mt-4 space-y-2">
                <li className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
                  If an allergen is introduced today, the next allergen intro should wait until four calendar dates later.
                </li>
                <li className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
                  If yesterday already introduced a new single food, today should usually be used for repeats instead.
                </li>
                <li className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
                  Combinations stay blocked before May 1, 2026 and until every ingredient has an earlier single-food intro.
                </li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

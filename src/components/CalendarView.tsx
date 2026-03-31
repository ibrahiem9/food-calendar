import {
  endOfWeek,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { foods, foodsByCategory } from "../data/foods";
import type { DayEntry } from "../types/calendar";
import { FOOD_CATEGORIES, type FoodCategory } from "../types/food";
import { TOTAL_DAYS, groupDaysByMonth } from "../utils/dateUtils";

function MonthJumpNav({
  months,
  activeMonthId,
  onJump,
}: {
  months: ReturnType<typeof groupDaysByMonth>;
  activeMonthId: string;
  onJump: (monthId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {months.map((month) => {
        const isActive = month.id === activeMonthId;

        return (
          <button
            key={month.id}
            type="button"
            onClick={() => onJump(month.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[linear-gradient(135deg,_#1a61a4,_#98c4ff)] text-white shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                : "bg-white/80 text-stone-700"
            }`}
          >
            {month.label}
          </button>
        );
      })}
    </div>
  );
}

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  fruit: "Fruit",
  vegetable: "Vegetables",
  starch: "Starches",
  protein: "Proteins",
  allergen: "Allergens",
};

const CATEGORY_ACCENTS: Record<FoodCategory, string> = {
  fruit: "bg-[#e8f1e0] text-stone-700",
  vegetable: "bg-[#e4ede5] text-stone-700",
  starch: "bg-[#efe4d2] text-stone-700",
  protein: "bg-[#e3e8e1] text-stone-700",
  allergen: "bg-[#f4cabf] text-stone-900",
};

const FOOD_CATEGORY_BY_ID = Object.fromEntries(
  foods.map((food) => [food.id, food.category]),
) as Record<string, FoodCategory>;
const FOOD_NAME_BY_ID = Object.fromEntries(
  foods.map((food) => [food.id, food.name]),
) as Record<string, string>;
const ALLERGEN_IDS = foods
  .filter((food) => food.isAllergen)
  .map((food) => food.id);

const getWeekIndicesForDate = (days: DayEntry[], date: string) => {
  const weekStart = startOfWeek(parseISO(date), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parseISO(date), { weekStartsOn: 0 });

  return days.flatMap((entry, index) => {
    const dayDate = parseISO(entry.date);

    if (isBefore(dayDate, weekStart) || isAfter(dayDate, weekEnd)) {
      return [];
    }

    return [index];
  });
};

const getWeeklyAllergenStatus = (days: DayEntry[], date: string) => {
  const weekIndices = getWeekIndicesForDate(days, date);
  const due: string[] = [];
  const overLimit: string[] = [];
  let satisfiedCount = 0;

  for (const allergenId of ALLERGEN_IDS) {
    const firstIntroDay = days.find((day) =>
      day.items.some(
        (item) => item.foodId === allergenId && item.isFirstIntroduction,
      ),
    );

    if (!firstIntroDay || isAfter(parseISO(firstIntroDay.date), parseISO(date))) {
      continue;
    }

    const appearances = weekIndices.reduce(
      (count, index) =>
        count +
        (days[index].items.some((item) => item.foodId === allergenId) ? 1 : 0),
      0,
    );

    if (appearances === 0) {
      due.push(FOOD_NAME_BY_ID[allergenId] ?? allergenId);
      continue;
    }

    if (appearances > 2) {
      overLimit.push(FOOD_NAME_BY_ID[allergenId] ?? allergenId);
      continue;
    }

    satisfiedCount += 1;
  }

  return {
    due,
    overLimit,
    satisfiedCount,
  };
};

const getValidationStatus = (day: DayEntry) => {
  if (day.validation.errors.length > 0) {
    return {
      icon: "✗",
      label: "Invalid",
      className: "bg-[#f7d8cc] text-stone-900",
    };
  }

  if (day.validation.warnings.length > 0) {
    return {
      icon: "⚠",
      label: "Warning",
      className: "bg-[#efe4d2] text-stone-900",
    };
  }

  return {
    icon: "✓",
    label: "Valid",
    className: "bg-[#dfead9] text-stone-800",
  };
};

function DayCell({
  day,
  days,
  onAddFood,
  onMovePlannedItem,
  onRemovePlannedItem,
  selectedDayDate,
  selectedFoodId,
  onSelectDay,
  onSelectFood,
}: {
  day: DayEntry;
  days: DayEntry[];
  onAddFood: (date: string, foodId: string) => void;
  onMovePlannedItem: (
    sourceDate: string,
    itemIndex: number,
    targetDate: string,
  ) => void;
  onRemovePlannedItem: (date: string, itemIndex: number) => void;
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
}) {
  const parsedDate = parseISO(day.date);
  const [selectedFoodToAddId, setSelectedFoodToAddId] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FoodCategory>("fruit");
  const [activeMoveIndex, setActiveMoveIndex] = useState<number | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState(day.date);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const availableFoods = foodsByCategory[selectedCategory];
  const validationStatus = getValidationStatus(day);
  const weeklyAllergenStatus = useMemo(
    () => getWeeklyAllergenStatus(days, day.date),
    [day.date, days],
  );

  useEffect(() => {
    const firstFood = availableFoods[0];

    if (firstFood) {
      setSelectedFoodToAddId((currentFoodId) => {
        const hasMatch = availableFoods.some((food) => food.id === currentFoodId);
        return hasMatch ? currentFoodId : firstFood.id;
      });
    }
  }, [availableFoods]);

  const handleAddFood = () => {
    if (!selectedFoodToAddId) {
      return;
    }

    onAddFood(day.date, selectedFoodToAddId);
  };

  const handleStartMove = (itemIndex: number) => {
    const currentIndex = days.findIndex((entry) => entry.date === day.date);
    const nextDate = days[currentIndex + 1]?.date ?? days[currentIndex - 1]?.date ?? day.date;

    setActiveMoveIndex(itemIndex);
    setMoveTargetDate(nextDate);
  };

  const handleMoveItem = () => {
    if (activeMoveIndex === null || !moveTargetDate) {
      return;
    }

    onMovePlannedItem(day.date, activeMoveIndex, moveTargetDate);
    setActiveMoveIndex(null);
  };

  const handleDragOver = (event: DragEvent<HTMLLIElement>) => {
    if (!event.dataTransfer.types.includes("text/plain")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    const draggedFoodId = event.dataTransfer.getData("text/plain");

    setIsDropTarget(false);

    if (!draggedFoodId) {
      return;
    }

    onAddFood(day.date, draggedFoodId);
  };

  return (
    <li
      onClick={() => onSelectDay(day.date)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-[1.5rem] bg-white/88 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.04)] transition ${
        isDropTarget ? "bg-[#eef5ea] ring-2 ring-[#9eb894]/60" : ""
      } ${selectedDayDate === day.date ? "ring-2 ring-[#7ea279]/70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {format(parsedDate, "EEE")}
          </p>
          <h4 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
            {format(parsedDate, "d")}
          </h4>
          <p className="mt-1 font-sans text-sm text-stone-600">
            {format(parsedDate, "MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[#edf2ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {day.items.length} item{day.items.length === 1 ? "" : "s"}
          </span>
          <span
            className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${validationStatus.className}`}
          >
            {validationStatus.icon} {validationStatus.label}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] bg-[#eef2ed] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Planned Items
          </p>
          {isDropTarget ? (
            <p className="font-sans text-xs text-stone-600">
              Release to add from library
            </p>
          ) : day.items.length > 0 ? (
            <p className="font-sans text-xs text-stone-500">
              First intro flags update automatically
            </p>
          ) : null}
        </div>

        {day.items.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {day.items.map((item, index) => {
              const foodCategory = FOOD_CATEGORY_BY_ID[item.foodId] ?? "fruit";
              const isCombination = item.type === "combination";
              const inspectFoodId =
                item.type === "combination"
                  ? item.ingredientFoodIds?.[0] ?? ""
                  : item.foodId;

              return (
                <li
                  key={`${day.date}-${item.foodId}-${index}`}
                  className="rounded-[1rem] bg-white/90 px-3 py-3 shadow-[0_8px_24px_rgba(45,52,49,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-sans text-sm font-medium text-stone-800">
                        {item.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            isCombination
                              ? "bg-[#e5edf6] text-sky-900"
                              : CATEGORY_ACCENTS[foodCategory]
                          }`}
                        >
                          {isCombination ? "Combination" : CATEGORY_LABELS[foodCategory]}
                        </span>
                        <span
                          className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            isCombination
                              ? "bg-[#edf2ec] text-stone-600"
                              : item.isFirstIntroduction
                                ? "bg-[#dfead9] text-stone-800"
                                : "bg-[#ecefea] text-stone-600"
                          }`}
                        >
                          {isCombination ? "Recipe" : item.isFirstIntroduction ? "NEW" : "REPEAT"}
                        </span>
                        {isCombination && item.ingredientFoodIds ? (
                          <span className="rounded-sm bg-[#edf2ec] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                            {item.ingredientFoodIds.length} ingredients
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={!inspectFoodId}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDay(day.date);
                          if (inspectFoodId) {
                            onSelectFood(inspectFoodId);
                          }
                        }}
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                          selectedFoodId === inspectFoodId
                            ? "bg-[#deebfb] text-sky-900"
                            : "bg-[#ecefe9] text-stone-700 hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:bg-[#e7ebe7] disabled:text-stone-400"
                        }`}
                      >
                        {isCombination ? "Inspect Food" : "Inspect"}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStartMove(index);
                        }}
                        className="rounded-full bg-[#ecefe9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-[#e3e7e1]"
                      >
                        Move
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemovePlannedItem(day.date, index);
                      }}
                      className="rounded-full bg-[#f5ddd4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-800 transition hover:bg-[#efcdbf]"
                    >
                      Remove
                    </button>
                    {activeMoveIndex === index ? (
                      <>
                        <input
                          type="date"
                          value={moveTargetDate}
                          min={days[0]?.date}
                          max={days[days.length - 1]?.date}
                          onChange={(event) => setMoveTargetDate(event.target.value)}
                          className="rounded-full bg-[#f6f8f5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-700 outline-none"
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMoveItem();
                          }}
                          className="rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
                        >
                          Apply Move
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMoveIndex(null);
                          }}
                          className="rounded-full bg-[#ecefe9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-[#e3e7e1]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 font-sans text-sm text-stone-600">
            No foods assigned yet.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-[1.25rem] bg-[#f6f8f5] p-3">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Add Food
        </p>

        <div className="mt-3 grid gap-2">
          <label className="space-y-1">
            <span className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as FoodCategory)
              }
              className="w-full rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none"
            >
              {FOOD_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
              Food
            </span>
            <select
              value={selectedFoodToAddId}
              onChange={(event) => {
                setSelectedFoodToAddId(event.target.value);
                onSelectFood(event.target.value);
              }}
              className="w-full rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none"
            >
              {availableFoods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleAddFood}
            className="rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-4 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
          >
            Add to Day
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] bg-[#f6f2ef] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Validation
          </p>
          <span
            className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${validationStatus.className}`}
          >
            {validationStatus.label}
          </span>
        </div>

        {day.validation.errors.length === 0 && day.validation.warnings.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-stone-600">
            All current validation checks pass for this day.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {day.validation.errors.map((error, index) => (
              <li
                key={`error-${index}`}
                className="rounded-[1rem] bg-[#f8e1d8] px-3 py-3 font-sans text-sm leading-6 text-stone-800"
              >
                {error}
              </li>
            ))}
            {day.validation.warnings.map((warning, index) => (
              <li
                key={`warning-${index}`}
                className="rounded-[1rem] bg-[#efe4d2] px-3 py-3 font-sans text-sm leading-6 text-stone-800"
              >
                {warning}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-[1.25rem] bg-[#edf3ee] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Allergen Week
          </p>
          <span className="rounded-sm bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
            Sun-Sat
          </span>
        </div>

        {weeklyAllergenStatus.overLimit.length > 0 ? (
          <p className="mt-3 rounded-[1rem] bg-[#f8e1d8] px-3 py-3 font-sans text-sm leading-6 text-stone-800">
            Over weekly limit: {weeklyAllergenStatus.overLimit.join(", ")}
          </p>
        ) : weeklyAllergenStatus.due.length > 0 ? (
          <p className="mt-3 rounded-[1rem] bg-[#efe4d2] px-3 py-3 font-sans text-sm leading-6 text-stone-800">
            Allergen due this week: {weeklyAllergenStatus.due.join(", ")}
          </p>
        ) : weeklyAllergenStatus.satisfiedCount > 0 ? (
          <p className="mt-3 rounded-[1rem] bg-[#dfead9] px-3 py-3 font-sans text-sm leading-6 text-stone-800">
            Allergen cadence satisfied for {weeklyAllergenStatus.satisfiedCount} active allergen
            {weeklyAllergenStatus.satisfiedCount === 1 ? "" : "s"} this week.
          </p>
        ) : (
          <p className="mt-3 font-sans text-sm text-stone-600">
            No active allergen tracking for this week yet.
          </p>
        )}
      </div>
    </li>
  );
}

export function CalendarView({
  days,
  onAddFood,
  onMovePlannedItem,
  onRemovePlannedItem,
  selectedDayDate,
  selectedFoodId,
  onSelectDay,
  onSelectFood,
}: {
  days: DayEntry[];
  onAddFood: (date: string, foodId: string) => void;
  onMovePlannedItem: (
    sourceDate: string,
    itemIndex: number,
    targetDate: string,
  ) => void;
  onRemovePlannedItem: (date: string, itemIndex: number) => void;
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
}) {
  const months = useMemo(() => groupDaysByMonth(days), [days]);
  const [activeMonthId, setActiveMonthId] = useState(months[0]?.id ?? "");
  const firstIntroductionCount = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => item.isFirstIntroduction).length,
    0,
  );
  const repeatCount = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => !item.isFirstIntroduction).length,
    0,
  );
  const firstIntroductionDays = days.filter((day) =>
    day.items.some((item) => item.isFirstIntroduction),
  ).length;
  const populatedDays = days.filter((day) => day.items.length > 0).length;
  const allergenWeekSummary = useMemo(() => {
    const processedWeeks = new Set<string>();
    let dueWeeks = 0;
    let overLimitWeeks = 0;
    let satisfiedWeeks = 0;

    for (const day of days) {
      const weekKey = format(startOfWeek(parseISO(day.date), { weekStartsOn: 0 }), "yyyy-MM-dd");

      if (processedWeeks.has(weekKey)) {
        continue;
      }

      processedWeeks.add(weekKey);
      const status = getWeeklyAllergenStatus(days, day.date);

      if (status.overLimit.length > 0) {
        overLimitWeeks += 1;
      } else if (status.due.length > 0) {
        dueWeeks += 1;
      } else if (status.satisfiedCount > 0) {
        satisfiedWeeks += 1;
      }
    }

    return { dueWeeks, overLimitWeeks, satisfiedWeeks };
  }, [days]);

  useEffect(() => {
    if (!activeMonthId && months[0]) {
      setActiveMonthId(months[0].id);
    }
  }, [activeMonthId, months]);

  const handleJump = (monthId: string) => {
    setActiveMonthId(monthId);
    document.getElementById(monthId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="rounded-[2rem] bg-[#f1f4f1] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Calendar Structure
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Phase 10 calendar editing across all {days.length} calendar days
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Single foods and validated combination recipes still share one
                timeline, and day cards now accept direct drops from the food
                library while manual edits continue to route through conflict
                checks, alternative date suggestions, and undoable history.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Total Days
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {days.length}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Planned target remains {TOTAL_DAYS} inclusive days.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Populated Days
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {populatedDays}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {firstIntroductionCount} new foods and {repeatCount} repeats across{" "}
                {firstIntroductionDays} intro days in {months.length} month groups.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Allergen Weeks
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {allergenWeekSummary.satisfiedWeeks}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {allergenWeekSummary.dueWeeks} due weeks and {allergenWeekSummary.overLimitWeeks} over-limit weeks in the current plan.
              </p>
            </div>
          </div>
        </div>

        <MonthJumpNav
          months={months}
          activeMonthId={activeMonthId}
          onJump={handleJump}
        />

        <div className="grid gap-5">
          {months.map((month) => (
            <article
              key={month.id}
              id={month.id}
              className="rounded-[1.75rem] bg-[#e8eee8] p-5 sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    {month.monthStart} - {month.monthEnd}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-stone-900">
                    {month.label}
                  </h3>
                </div>
                <p className="font-sans text-sm text-stone-600">
                  {month.days.length} days in view
                </p>
              </div>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {month.days.map((day) => (
                  <DayCell
                    key={day.date}
                    day={day}
                    days={days}
                    onAddFood={onAddFood}
                    onMovePlannedItem={onMovePlannedItem}
                    onRemovePlannedItem={onRemovePlannedItem}
                    selectedDayDate={selectedDayDate}
                    selectedFoodId={selectedFoodId}
                    onSelectDay={onSelectDay}
                    onSelectFood={onSelectFood}
                  />
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
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

function DayCell({
  day,
  onAddFood,
  onRemoveFood,
}: {
  day: DayEntry;
  onAddFood: (date: string, foodId: string) => void;
  onRemoveFood: (date: string, foodId: string) => void;
}) {
  const parsedDate = parseISO(day.date);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FoodCategory>("fruit");

  const availableFoods = foodsByCategory[selectedCategory];

  useEffect(() => {
    const firstFood = availableFoods[0];

    if (firstFood) {
      setSelectedFoodId((currentFoodId) => {
        const hasMatch = availableFoods.some((food) => food.id === currentFoodId);
        return hasMatch ? currentFoodId : firstFood.id;
      });
    }
  }, [availableFoods]);

  const handleAddFood = () => {
    if (!selectedFoodId) {
      return;
    }

    onAddFood(day.date, selectedFoodId);
  };

  return (
    <li className="rounded-[1.5rem] bg-white/88 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
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

        <span className="rounded-full bg-[#edf2ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          {day.items.length} item{day.items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 rounded-[1.25rem] bg-[#eef2ed] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Planned Items
          </p>
          {day.items.length > 0 ? (
            <p className="font-sans text-xs text-stone-500">
              First intro flags update automatically
            </p>
          ) : null}
        </div>

        {day.items.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {day.items.map((item, index) => {
              const foodCategory = FOOD_CATEGORY_BY_ID[item.foodId] ?? "fruit";

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
                          className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${CATEGORY_ACCENTS[foodCategory]}`}
                        >
                          {CATEGORY_LABELS[foodCategory]}
                        </span>
                        <span
                          className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            item.isFirstIntroduction
                              ? "bg-[#dfead9] text-stone-800"
                              : "bg-[#ecefea] text-stone-600"
                          }`}
                        >
                          {item.isFirstIntroduction ? "New" : "Repeat"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveFood(day.date, item.foodId)}
                      className="rounded-full bg-[#f5ddd4] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-800 transition hover:bg-[#efcdbf]"
                    >
                      Remove
                    </button>
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
              value={selectedFoodId}
              onChange={(event) => setSelectedFoodId(event.target.value)}
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
    </li>
  );
}

export function CalendarView({
  days,
  onAddFood,
  onRemoveFood,
}: {
  days: DayEntry[];
  onAddFood: (date: string, foodId: string) => void;
  onRemoveFood: (date: string, foodId: string) => void;
}) {
  const months = useMemo(() => groupDaysByMonth(days), [days]);
  const [activeMonthId, setActiveMonthId] = useState(months[0]?.id ?? "");

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
                Phase 3 manual planning across all 176 calendar days
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Each day now supports direct food assignment with inline add and
                remove controls. Placements persist in localStorage so the
                calendar survives page refreshes while the rule engine is still
                pending.
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
                Assigned Foods
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {days.reduce((total, day) => total + day.items.length, 0)}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Across {months.length} month groups from March to September 2026.
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
                    onAddFood={onAddFood}
                    onRemoveFood={onRemoveFood}
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

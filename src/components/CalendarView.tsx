import { format, parseISO, startOfWeek } from "date-fns";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { foods } from "../data/foods";
import { getFoodVisual } from "../data/foodVisuals";
import type { DayEntry } from "../types/calendar";
import { TOTAL_DAYS, groupDaysByMonth } from "../utils/dateUtils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FOOD_NAME_BY_ID = new Map(foods.map((food) => [food.id, food.name]));

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

const getWeekKey = (date: string) =>
  format(startOfWeek(parseISO(date), { weekStartsOn: 0 }), "yyyy-MM-dd");

function DayCell({
  day,
  selectedDayDate,
  onSelectDay,
  onSelectFood,
  onAddFood,
}: {
  day: DayEntry;
  selectedDayDate: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
  onAddFood: (date: string, foodId: string) => void;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const parsedDate = parseISO(day.date);
  const validationStatus = getValidationStatus(day);
  const previewItems = day.items.slice(0, 2);
  const additionalCount = Math.max(day.items.length - previewItems.length, 0);

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    if (!event.dataTransfer.types.includes("text/plain")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropTarget(true);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const foodId = event.dataTransfer.getData("text/plain");

    setIsDropTarget(false);

    if (foodId) {
      onAddFood(day.date, foodId);
      onSelectFood(foodId);
      onSelectDay(day.date);
    }
  };

  return (
    <button
      id={`day-${day.date}`}
      type="button"
      onClick={() => onSelectDay(day.date)}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
      className={`min-h-[13rem] rounded-[1.5rem] p-4 text-left shadow-[0_8px_32px_rgba(45,52,49,0.04)] transition print-day-card ${
        selectedDayDate === day.date
          ? "bg-[#f7faf4] ring-2 ring-[#7ea279]/70"
          : "bg-white/88 hover:bg-white"
      } ${isDropTarget ? "ring-2 ring-[#98c4ff] bg-[#eff6ff]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {format(parsedDate, "EEE")}
          </p>
          <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
            {format(parsedDate, "d")}
          </h3>
          <p className="mt-1 font-sans text-sm text-stone-600">
            {format(parsedDate, "MMM d")}
          </p>
        </div>

        <span
          className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${validationStatus.className}`}
        >
          {validationStatus.icon} {validationStatus.label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-[#edf2ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
          {day.items.length} item{day.items.length === 1 ? "" : "s"}
        </span>
        {day.items.some((item) => item.isFirstIntroduction) ? (
          <span className="rounded-full bg-[#dfead9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
            New intro day
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 print-planned-items">
        {previewItems.length > 0 ? (
          previewItems.map((item, index) => {
            const visual = getFoodVisual(item.foodId);

            return (
              <div
                key={`${day.date}-${item.foodId}-${index}`}
                className="flex items-center gap-3 rounded-[1rem] bg-[#f5f7f3] px-3 py-3"
              >
                <div
                  className={`h-11 w-11 shrink-0 rounded-[0.9rem] bg-gradient-to-br ${visual.accentClassName} p-1.5`}
                >
                  <img
                    src={visual.imagePath}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full rounded-[0.7rem] object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-medium text-stone-900">
                    {item.label}
                  </p>
                  <p className="font-sans text-xs uppercase tracking-[0.14em] text-stone-500">
                    {item.type === "combination"
                      ? "Recipe"
                      : item.isFirstIntroduction
                        ? "First introduction"
                        : "Repeat"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1rem] bg-[#f5f7f3] px-3 py-4">
            <p className="font-sans text-sm text-stone-600">
              Select this day, then add a food from the inspector or drag one from the library.
            </p>
          </div>
        )}

        {additionalCount > 0 ? (
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            +{additionalCount} more item{additionalCount === 1 ? "" : "s"} in inspector
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-[1rem] bg-[#eef2ed] px-3 py-3">
        <p className="font-sans text-xs uppercase tracking-[0.14em] text-stone-500">
          {isDropTarget
            ? "Release to place dragged food"
            : selectedDayDate === day.date
              ? "Selected day for editing"
              : "Tap to inspect and edit"}
        </p>
      </div>
    </button>
  );
}

export function CalendarView({
  days,
  onAddFood,
  selectedDayDate,
  onSelectDay,
  onSelectFood,
}: {
  days: DayEntry[];
  onAddFood: (date: string, foodId: string) => void;
  onMovePlannedItem: (sourceDate: string, itemIndex: number, targetDate: string) => void;
  onRemovePlannedItem: (date: string, itemIndex: number) => void;
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
}) {
  const months = useMemo(() => groupDaysByMonth(days), [days]);
  const [activeMonthId, setActiveMonthId] = useState(months[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  useEffect(() => {
    const matchingMonth = months.find((month) =>
      month.days.some((day) => day.date === selectedDayDate),
    );

    if (matchingMonth && matchingMonth.id !== activeMonthId) {
      setActiveMonthId(matchingMonth.id);
    }
  }, [activeMonthId, months, selectedDayDate]);

  const activeMonth = months.find((month) => month.id === activeMonthId) ?? months[0];
  const selectedDay = days.find((day) => day.date === selectedDayDate) ?? activeMonth?.days[0];
  const visibleDays = useMemo(() => {
    if (!activeMonth) {
      return [];
    }

    if (viewMode === "month" || !selectedDay) {
      return activeMonth.days;
    }

    const targetWeek = getWeekKey(selectedDay.date);
    return activeMonth.days.filter((day) => getWeekKey(day.date) === targetWeek);
  }, [activeMonth, selectedDay, viewMode]);

  const introducedCount = days.reduce(
    (count, day) => count + day.items.filter((item) => item.isFirstIntroduction).length,
    0,
  );
  const repeatCount = days.reduce(
    (count, day) => count + day.items.filter((item) => !item.isFirstIntroduction).length,
    0,
  );
  const selectedDaySummary = selectedDay?.items
    .slice(0, 3)
    .map((item) => FOOD_NAME_BY_ID.get(item.foodId) ?? item.label)
    .join(", ");

  return (
    <section className="rounded-[2rem] bg-[#f1f4f1] p-5 print-calendar-shell sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-white/84 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Timeline
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
                {days.length}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Inclusive window target remains {TOTAL_DAYS} planned days.
              </p>
            </div>

            <div className="rounded-[1.4rem] bg-white/84 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                New vs Repeat
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
                {introducedCount}/{repeatCount}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                First introductions over repeats in the full plan.
              </p>
            </div>

            <div className="rounded-[1.4rem] bg-[#e8f0f8] p-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-sky-900/70">
                Selected day
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-stone-900">
                {selectedDay ? format(parseISO(selectedDay.date), "MMM d, yyyy") : "None"}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {selectedDaySummary || "Open the inspector to add foods or review conflicts."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "month"
                  ? "bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                  : "bg-white/80 text-stone-700"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "week"
                  ? "bg-[linear-gradient(135deg,_#1a61a4,_#98c4ff)] text-white shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                  : "bg-white/80 text-stone-700"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {months.map((month) => {
            const isActive = month.id === activeMonthId;

            return (
              <button
                key={month.id}
                type="button"
                onClick={() => setActiveMonthId(month.id)}
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

        {activeMonth ? (
          <article className="rounded-[1.75rem] bg-[#e8eee8] p-4 sm:p-5 print-month-section">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {viewMode === "month" ? "Month canvas" : "Selected week"}
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
                  {activeMonth.label}
                </h3>
              </div>
              <p className="font-sans text-sm text-stone-600">
                Showing {visibleDays.length} day{visibleDays.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="rounded-full bg-white/70 px-3 py-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 print-month-days">
              {visibleDays.map((day) => (
                <DayCell
                  key={day.date}
                  day={day}
                  selectedDayDate={selectedDayDate}
                  onSelectDay={onSelectDay}
                  onSelectFood={onSelectFood}
                  onAddFood={onAddFood}
                />
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

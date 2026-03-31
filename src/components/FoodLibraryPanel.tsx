import { format, parseISO } from "date-fns";
import { useMemo, useState, type DragEvent } from "react";
import { foodsByCategory } from "../data/foods";
import { FOOD_CATEGORIES, type Food, type FoodCategory } from "../types/food";
import {
  getFoodLibraryStatuses,
  type FoodLibraryStatusKind,
} from "../utils/foodLibraryStatus";
import type { DayEntry } from "../types/calendar";

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  fruit: "Fruit",
  vegetable: "Vegetables",
  starch: "Starches",
  protein: "Proteins",
  allergen: "Allergens",
};

const CATEGORY_TONES: Record<FoodCategory, string> = {
  fruit: "bg-[#eef4ea]",
  vegetable: "bg-[#edf1ec]",
  starch: "bg-[#f4efe7]",
  protein: "bg-[#ecefe8]",
  allergen: "bg-[#fde7df]",
};

const STATUS_TONES: Record<FoodLibraryStatusKind, string> = {
  pending: "bg-[#ecefe9] text-stone-700",
  scheduled: "bg-[#deebfb] text-sky-900",
  introduced: "bg-[#dfead9] text-stone-800",
  due: "bg-[#efe4d2] text-stone-900",
  satisfied: "bg-[#dfead9] text-stone-800",
  "over-limit": "bg-[#f7d8cc] text-stone-900",
};

const FILTER_OPTIONS: Array<{ label: string; value: FoodCategory | "all" }> = [
  { label: "All foods", value: "all" },
  ...FOOD_CATEGORIES.map((category) => ({
    label: CATEGORY_LABELS[category],
    value: category,
  })),
];

const STATUS_OPTIONS: Array<{ label: string; value: FoodLibraryStatusKind | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Coming Up", value: "scheduled" },
  { label: "Introduced", value: "introduced" },
  { label: "Due", value: "due" },
  { label: "Satisfied", value: "satisfied" },
];

function FoodChip({
  food,
  statusKind,
  statusLabel,
  statusSummary,
  firstIntroductionDate,
  isSelected,
  onInspect,
}: {
  food: Food;
  statusKind: FoodLibraryStatusKind;
  statusLabel: string;
  statusSummary: string;
  firstIntroductionDate?: string;
  isSelected: boolean;
  onInspect: (foodId: string) => void;
}) {
  const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", food.id);
  };

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      className={`flex cursor-grab flex-col gap-3 rounded-2xl bg-white/88 px-4 py-4 text-sm text-stone-700 shadow-[0_8px_32px_rgba(45,52,49,0.04)] active:cursor-grabbing ${
        isSelected ? "ring-2 ring-[#7ea279]/70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium text-stone-900">{food.name}</p>
          <p className="font-sans text-xs leading-5 text-stone-500">
            {statusSummary}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_TONES[statusKind]}`}
          >
            {statusLabel}
          </span>
          {food.isAllergen ? (
            <span className="rounded-sm bg-[#f3b5a8] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900">
              Allergen
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
        <span>{CATEGORY_LABELS[food.category]}</span>
        <button
          type="button"
          onClick={() => onInspect(food.id)}
          className="rounded-full bg-[#eef2ed] px-3 py-1 font-semibold text-stone-600 transition hover:bg-[#e3e8e1]"
        >
          Inspect
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
        <span>
          {firstIntroductionDate
            ? format(parseISO(firstIntroductionDate), "MMM d")
            : "No intro date"}
        </span>
        <span>{isSelected ? "Selected" : "Draggable"}</span>
      </div>
    </li>
  );
}

export function FoodLibraryPanel({
  days,
  selectedFoodId,
  onInspectFood,
}: {
  days: DayEntry[];
  selectedFoodId: string;
  onInspectFood: (foodId: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<FoodCategory | "all">("all");
  const [activeStatus, setActiveStatus] = useState<FoodLibraryStatusKind | "all">(
    "all",
  );
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const { referenceDate, weekLabel, statusByFoodId } = useMemo(
    () => getFoodLibraryStatuses(days),
    [days],
  );

  const visibleSections = useMemo(() => {
    const categories =
      activeFilter === "all" ? FOOD_CATEGORIES : [activeFilter];

    return categories
      .map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        foods: foodsByCategory[category].filter((food) => {
          const status = statusByFoodId.get(food.id);

          if (!status) {
            return false;
          }

          const matchesQuery =
            normalizedQuery.length === 0 ||
            food.name.toLowerCase().includes(normalizedQuery);
          const matchesStatus =
            activeStatus === "all" || status.kind === activeStatus;

          return matchesQuery && matchesStatus;
        }),
      }))
      .filter((section) => section.foods.length > 0);
  }, [activeFilter, activeStatus, normalizedQuery, statusByFoodId]);

  const visibleFoodCount = visibleSections.reduce(
    (total, section) => total + section.foods.length,
    0,
  );

  const statusCounts = useMemo(
    () =>
      Array.from(statusByFoodId.values()).reduce(
        (counts, status) => {
          counts[status.kind] += 1;
          return counts;
        },
        {
          pending: 0,
          scheduled: 0,
          introduced: 0,
          due: 0,
          satisfied: 0,
          "over-limit": 0,
        } as Record<FoodLibraryStatusKind, number>,
      ),
    [statusByFoodId],
  );

  return (
    <section className="rounded-[2rem] bg-[#f1f4f1] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Food Library
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Phase 11 library with live food status and drag-to-calendar
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Search the catalog, narrow by category or status, and drag any
                food onto a calendar day. Allergen cards reflect the active
                Sunday-Saturday week so due repeats stay visible while you edit.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Visible Foods
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {visibleFoodCount}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Reference date {format(parseISO(referenceDate), "MMM d, yyyy")}.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Status Snapshot
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {statusCounts.introduced + statusCounts.satisfied}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                {statusCounts.pending} pending, {statusCounts.scheduled} coming
                up, {statusCounts.due} due in {weekLabel}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_auto_auto]">
          <label className="rounded-[1.5rem] bg-white/78 px-4 py-3 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Search Foods
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by food name"
              className="mt-2 w-full bg-transparent font-sans text-sm text-stone-800 outline-none placeholder:text-stone-400"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {FILTER_OPTIONS.map((option) => {
              const isActive = option.value === activeFilter;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[linear-gradient(135deg,_#1a61a4,_#98c4ff)] text-white shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                      : "bg-white/78 text-stone-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((option) => {
              const isActive = option.value === activeStatus;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveStatus(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                      : "bg-white/78 text-stone-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-[#ecefe9] px-4 py-2 text-sm font-semibold text-stone-700">
            Pending {statusCounts.pending}
          </span>
          <span className="rounded-full bg-[#deebfb] px-4 py-2 text-sm font-semibold text-sky-900">
            Coming Up {statusCounts.scheduled}
          </span>
          <span className="rounded-full bg-[#dfead9] px-4 py-2 text-sm font-semibold text-stone-800">
            Introduced {statusCounts.introduced}
          </span>
          <span className="rounded-full bg-[#efe4d2] px-4 py-2 text-sm font-semibold text-stone-900">
            Due {statusCounts.due}
          </span>
          <span className="rounded-full bg-[#dfead9] px-4 py-2 text-sm font-semibold text-stone-800">
            Satisfied {statusCounts.satisfied}
          </span>
          {statusCounts["over-limit"] > 0 ? (
            <span className="rounded-full bg-[#f7d8cc] px-4 py-2 text-sm font-semibold text-stone-900">
              Over Limit {statusCounts["over-limit"]}
            </span>
          ) : null}
        </div>

        {visibleSections.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleSections.map((section) => (
              <article
                key={section.category}
                className={`rounded-[1.75rem] p-5 sm:p-6 ${CATEGORY_TONES[section.category]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                      {section.label}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-stone-900">
                      {section.foods.length} items
                    </h3>
                  </div>
                  {section.category === "allergen" ? (
                    <span className="rounded-sm bg-[#f3b5a8] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900">
                      Week {weekLabel}
                    </span>
                  ) : null}
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {section.foods.map((food) => {
                    const status = statusByFoodId.get(food.id);

                    if (!status) {
                      return null;
                    }

                    return (
                      <FoodChip
                        key={food.id}
                        food={food}
                        statusKind={status.kind}
                        statusLabel={status.label}
                        statusSummary={status.summary}
                        firstIntroductionDate={status.firstIntroductionDate}
                        isSelected={food.id === selectedFoodId}
                        onInspect={onInspectFood}
                      />
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-[#eef2ed] p-8 text-center">
            <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-stone-900">
              No foods match this search
            </p>
            <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
              Clear the search or widen the status and category filters to see
              more of the library.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

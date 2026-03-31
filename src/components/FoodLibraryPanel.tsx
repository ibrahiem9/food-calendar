import { format, parseISO } from "date-fns";
import { useMemo, useState, type DragEvent } from "react";
import { foodsByCategory } from "../data/foods";
import { getCategoryVisual, getFoodVisual } from "../data/foodVisuals";
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
  fruit: "bg-[#f5f0e6]",
  vegetable: "bg-[#edf3e8]",
  starch: "bg-[#f6efe3]",
  protein: "bg-[#eef1ec]",
  allergen: "bg-[#fbefe9]",
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

function FeaturedCategoryCard({
  category,
  onFocus,
}: {
  category: FoodCategory;
  onFocus: (category: FoodCategory) => void;
}) {
  const visual = getCategoryVisual(category);

  return (
    <button
      type="button"
      onClick={() => onFocus(category)}
      className={`overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${visual.accentClassName} p-4 text-left shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:translate-y-[-1px]`}
    >
        <img
          src={visual.imagePath}
          alt={visual.alt}
          className={`h-36 w-full rounded-[1.2rem] object-cover ${visual.imageClassName ?? ""}`}
          style={visual.imageStyle}
        />
      <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {CATEGORY_LABELS[category]}
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
        Explore {CATEGORY_LABELS[category].toLowerCase()}
      </h3>
      <p className="mt-2 font-sans text-sm leading-6 text-stone-700">
        Jump to a visual slice of the library and drag any item into the selected calendar day.
      </p>
    </button>
  );
}

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
  const visual = getFoodVisual(food.id);

  const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", food.id);
  };

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      className={`flex cursor-grab gap-3 rounded-[1.35rem] bg-white/88 p-3 text-sm text-stone-700 shadow-[0_8px_32px_rgba(45,52,49,0.04)] active:cursor-grabbing ${
        isSelected ? "ring-2 ring-[#7ea279]/70" : ""
      }`}
    >
      <div
        className={`h-20 w-20 shrink-0 rounded-[1rem] bg-gradient-to-br ${visual.accentClassName} p-2`}
      >
        <img
          src={visual.imagePath}
          alt=""
          aria-hidden="true"
          className={`h-full w-full rounded-[0.8rem] object-cover ${visual.imageClassName ?? ""}`}
          style={visual.imageStyle}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-stone-900">{food.name}</p>
            <p className="mt-1 font-sans text-xs leading-5 text-stone-500">
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

        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
          <span>{CATEGORY_LABELS[food.category]}</span>
          <span>
            {firstIntroductionDate
              ? format(parseISO(firstIntroductionDate), "MMM d")
              : "No intro date"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onInspect(food.id)}
          className="mt-3 rounded-full bg-[#eef2ed] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 transition hover:bg-[#e3e8e1]"
        >
          {isSelected ? "Selected" : "Inspect"}
        </button>
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
  const isSingleSectionView = visibleSections.length === 1;

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
    <section className="rounded-[2rem] bg-[#f1f4f1] p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {FOOD_CATEGORIES.map((category) => (
              <FeaturedCategoryCard
                key={category}
                category={category}
                onFocus={(nextCategory) => setActiveFilter(nextCategory)}
              />
            ))}
          </div>

          <div className="grid gap-3.5">
            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Visible foods
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-stone-900">
                {visibleFoodCount}
              </p>
              <p className="mt-2 font-sans text-sm text-stone-600">
                Reference date {format(parseISO(referenceDate), "MMM d, yyyy")}.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Weekly allergen pulse
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-stone-900">
                {statusCounts.due} due in {weekLabel}
              </p>
              <p className="mt-2 font-sans text-sm text-stone-600">
                {statusCounts.introduced + statusCounts.satisfied} foods are already unlocked and stable.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#edf2ec] p-4 sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Drag workflow
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-stone-700">
                Drag from any card here to a calendar day. For mobile, inspect a food first, then use the selected day controls in the inspector.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <label className="rounded-[1.5rem] bg-white/78 px-4 py-3.5 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Search foods
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by food name"
              className="mt-2 w-full bg-transparent font-sans text-sm text-stone-800 outline-none placeholder:text-stone-400"
            />
          </label>

          <div className="grid gap-4">
            <div className="space-y-2.5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Category
              </p>
              <div className="flex flex-wrap gap-2.5">
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
            </div>

            <div className="space-y-2.5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Status
              </p>
              <div className="flex flex-wrap gap-2.5">
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
          <div
            className={`grid gap-5 ${
              isSingleSectionView
                ? "grid-cols-1"
                : "xl:grid-cols-[repeat(auto-fit,minmax(22rem,1fr))]"
            }`}
          >
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

                <ul
                  className={`mt-5 grid gap-3.5 ${
                    isSingleSectionView ? "xl:grid-cols-2" : ""
                  }`}
                >
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
              Clear the search or widen the status and category filters to see more of the library.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

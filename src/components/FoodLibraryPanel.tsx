import { useMemo, useState } from "react";
import { foodsByCategory } from "../data/foods";
import { FOOD_CATEGORIES, type Food, type FoodCategory } from "../types/food";

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

const FILTER_OPTIONS: Array<{ label: string; value: FoodCategory | "all" }> = [
  { label: "All foods", value: "all" },
  ...FOOD_CATEGORIES.map((category) => ({
    label: CATEGORY_LABELS[category],
    value: category,
  })),
];

function FoodChip({ food }: { food: Food }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-white/88 px-4 py-3 text-sm text-stone-700 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
      <span className="font-medium">{food.name}</span>
      {food.isAllergen ? (
        <span className="rounded-sm bg-[#f3b5a8] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900">
          Allergen
        </span>
      ) : null}
    </li>
  );
}

export function FoodLibraryPanel() {
  const [activeFilter, setActiveFilter] = useState<FoodCategory | "all">("all");

  const visibleSections = useMemo(() => {
    const categories =
      activeFilter === "all" ? FOOD_CATEGORIES : [activeFilter];

    return categories.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      foods: foodsByCategory[category],
    }));
  }, [activeFilter]);

  const visibleFoodCount = visibleSections.reduce(
    (total, section) => total + section.foods.length,
    0,
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
                Phase 1 catalog with the full rule-backed food list
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Every food from the source rules is available here, grouped by
                category with allergen items visually called out for the later
                scheduling and validation phases.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Visible Foods
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
              {visibleFoodCount}
            </p>
            <p className="mt-1 font-sans text-sm text-stone-600">
              94 foods total, including 16 allergens.
            </p>
          </div>
        </div>

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
                    Spacing rules apply
                  </span>
                ) : null}
              </div>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.foods.map((food) => (
                  <FoodChip key={food.id} food={food} />
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

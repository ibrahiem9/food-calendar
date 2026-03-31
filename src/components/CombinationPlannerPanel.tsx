import { format, isBefore, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { foods } from "../data/foods";
import { recipeHeroVisual } from "../data/foodVisuals";
import { recipes } from "../data/recipes";
import type { DayEntry } from "../types/calendar";
import {
  buildSingleIntroductionMap,
  getRecipeEligibilityForDate,
} from "../utils/recipeEligibility";
import { COMBINATION_START_DATE } from "../validators/validateCombinationStartDate";

const FOOD_NAME_BY_ID = new Map(foods.map((food) => [food.id, food.name]));

const formatDateLabel = (date: string) => format(parseISO(date), "MMM d, yyyy");

export function CombinationPlannerPanel({
  days,
  onAddRecipe,
}: {
  days: DayEntry[];
  onAddRecipe: (
    date: string,
    recipeId: string,
  ) => { added: boolean; reason?: string };
}) {
  const comboReadyDays = useMemo(
    () =>
      days.filter(
        (day) => !isBefore(parseISO(day.date), parseISO(COMBINATION_START_DATE)),
      ),
    [days],
  );
  const [selectedDate, setSelectedDate] = useState(comboReadyDays[0]?.date ?? "");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (
      comboReadyDays.length > 0 &&
      !comboReadyDays.some((day) => day.date === selectedDate)
    ) {
      setSelectedDate(comboReadyDays[0].date);
    }
  }, [comboReadyDays, selectedDate]);

  useEffect(() => {
    setFeedbackMessage("");
  }, [selectedDate]);

  const introMap = useMemo(() => buildSingleIntroductionMap(days), [days]);
  const recipeStatuses = useMemo(
    () =>
      recipes.map((recipe) => {
        const eligibility = selectedDate
          ? getRecipeEligibilityForDate(recipe, selectedDate, introMap)
          : {
              eligible: false,
              reasons: ["Select a valid planning date."],
              missingIngredientIds: [],
              missingIngredientNames: [],
            };

        const scheduledCount = days.reduce(
          (count, day) =>
            count +
            day.items.filter(
              (item) => item.type === "combination" && item.recipeId === recipe.id,
            ).length,
          0,
        );

        return {
          recipe,
          scheduledCount,
          ...eligibility,
        };
      }),
    [days, introMap, selectedDate],
  );
  const eligibleCount = recipeStatuses.filter((status) => status.eligible).length;
  const blockedCount = recipeStatuses.length - eligibleCount;

  const handleAddRecipe = (recipeId: string, recipeName: string) => {
    if (!selectedDate) {
      setFeedbackMessage("Select a planning date first.");
      return;
    }

    const result = onAddRecipe(selectedDate, recipeId);

    setFeedbackMessage(
      result.added
        ? `${recipeName} added to ${formatDateLabel(selectedDate)}.`
        : result.reason ?? `${recipeName} could not be added.`,
    );
  };

  return (
    <section className="rounded-[2rem] bg-[#eff3f6] p-5 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div
            className={`overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${recipeHeroVisual.accentClassName} p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]`}
          >
            <img
              src={recipeHeroVisual.imagePath}
              alt={recipeHeroVisual.alt}
              className="h-44 w-full rounded-[1.25rem] object-cover"
            />
            <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Recipe builder
            </p>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
              Visual combo planning
            </h3>
            <p className="mt-2 font-sans text-sm leading-6 text-stone-700">
              Use the selected day as your staging point, then review which ingredient sets are already unlocked.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
            <label className="space-y-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Plan combinations on
              </span>
              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-[1rem] bg-[#f6f8f5] px-3 py-3 text-sm text-stone-800 outline-none"
              >
                {comboReadyDays.map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDateLabel(day.date)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1rem] bg-[#eef2ed] px-3 py-3">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Selected day
                </p>
                <p className="mt-1 font-display text-xl font-semibold tracking-[-0.03em] text-stone-900">
                  {selectedDate ? formatDateLabel(selectedDate) : "Unavailable"}
                </p>
              </div>
              <div className="rounded-[1rem] bg-[#e7eef8] px-3 py-3">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Eligibility split
                </p>
                <p className="mt-1 font-display text-xl font-semibold tracking-[-0.03em] text-stone-900">
                  {eligibleCount} ready / {blockedCount} blocked
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-[1rem] bg-[#f6f8f5] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
              {feedbackMessage ||
                "Choose a date, review blocked reasons, then add any eligible recipe directly into the calendar."}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Ingredient sets
            </p>
            <div className="mt-4 space-y-3">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="rounded-[1rem] bg-[#f6f8f5] px-3 py-3">
                  <p className="font-sans text-sm font-semibold text-stone-900">
                    {recipe.name}
                  </p>
                  <p className="mt-1 font-sans text-xs leading-5 text-stone-500">
                    {recipe.ingredientFoodIds
                      .map((foodId) => FOOD_NAME_BY_ID.get(foodId) ?? foodId)
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Earliest combo gate
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                May 1, 2026
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Eligible recipes
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {eligibleCount}/{recipes.length}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Already planned
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {recipeStatuses.reduce((count, status) => count + status.scheduledCount, 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {recipeStatuses.map((status) => (
              <article
                key={status.recipe.id}
                className="rounded-[1.6rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Curated recipe
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                      {status.recipe.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      status.eligible
                        ? "bg-[#dfead9] text-stone-800"
                        : "bg-[#f7d8cc] text-stone-900"
                    }`}
                  >
                    {status.eligible ? "Eligible" : "Blocked"}
                  </span>
                </div>

                <div className="mt-4 rounded-[1.25rem] bg-[#f5f7f8] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Ingredient line-up
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status.recipe.ingredientFoodIds.map((foodId) => (
                      <span
                        key={`${status.recipe.id}-${foodId}`}
                        className="rounded-full bg-white px-3 py-2 text-sm font-medium text-stone-700"
                      >
                        {FOOD_NAME_BY_ID.get(foodId) ?? foodId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-sm bg-[#e5edf6] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-900">
                    Combination
                  </span>
                  <span className="rounded-sm bg-[#edf2ec] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                    Planned {status.scheduledCount} time{status.scheduledCount === 1 ? "" : "s"}
                  </span>
                </div>

                {status.reasons.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {status.reasons.map((reason, index) => (
                      <li
                        key={`${status.recipe.id}-${index}`}
                        className="rounded-[1rem] bg-[#f8e1d8] px-3 py-3 font-sans text-sm leading-6 text-stone-800"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-[1rem] bg-[#edf3ee] px-3 py-3 font-sans text-sm leading-6 text-stone-800">
                    All ingredients were introduced earlier as singles. This recipe can be placed on the selected day.
                  </p>
                )}

                <button
                  type="button"
                  disabled={!status.eligible}
                  onClick={() => handleAddRecipe(status.recipe.id, status.recipe.name)}
                  className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                    status.eligible
                      ? "bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] hover:brightness-[1.02]"
                      : "bg-[#e7ebe7] text-stone-400"
                  }`}
                >
                  Add Recipe to {selectedDate ? format(parseISO(selectedDate), "MMM d") : "Day"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

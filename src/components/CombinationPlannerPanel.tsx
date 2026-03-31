import { format, isBefore, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { foods } from "../data/foods";
import { recipes } from "../data/recipes";
import type { DayEntry } from "../types/calendar";
import { buildSingleIntroductionMap, getRecipeEligibilityForDate } from "../utils/recipeEligibility";
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
    <section className="rounded-[2rem] bg-[#eff3f6] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Combination Planner
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Phase 9 recipe eligibility by calendar day
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Combination foods stay blocked until May 1, 2026 and every
                ingredient has already appeared as a single food on an earlier
                day. Eligibility and add actions run through the same checks.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Selected Day
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {selectedDate ? formatDateLabel(selectedDate) : "Unavailable"}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Earliest combo date is May 1, 2026.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Eligible Recipes
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {eligibleCount} / {recipes.length}
              </p>
              <p className="mt-1 font-sans text-sm text-stone-600">
                Recipes with all ingredients already unlocked for this date.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] bg-white/78 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
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

            <p className="mt-4 rounded-[1rem] bg-[#eef2ed] px-3 py-3 font-sans text-sm leading-6 text-stone-700">
              {feedbackMessage ||
                "Choose a date, review blocked reasons, then add any eligible recipe directly into the calendar."}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {recipeStatuses.map((status) => (
              <article
                key={status.recipe.id}
                className="rounded-[1.5rem] bg-white/82 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                      {status.recipe.name}
                    </p>
                    <p className="mt-1 font-sans text-sm text-stone-600">
                      Ingredients:{" "}
                      {status.recipe.ingredientFoodIds
                        .map((foodId) => FOOD_NAME_BY_ID.get(foodId) ?? foodId)
                        .join(", ")}
                    </p>
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
                    All ingredients were introduced earlier as singles. This
                    recipe can be placed on the selected day.
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

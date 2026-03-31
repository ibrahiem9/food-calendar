import { endOfWeek, format, isAfter, isBefore, parseISO } from "date-fns";
import { foods } from "../data/foods";
import { recipesById } from "../data/recipes";
import type { DayEntry } from "../types/calendar";
import { buildSingleIntroductionMap } from "../utils/recipeEligibility";
import { validateAllergenSpacing } from "../validators/validateAllergenSpacing";
import { validateCombinationIngredients } from "../validators/validateCombinationIngredients";
import { validateCombinationStartDate } from "../validators/validateCombinationStartDate";
import { validateDailyMinimum } from "../validators/validateDailyMinimum";
import { validateNoConsecutiveNewFoods } from "../validators/validateNoConsecutiveNewFoods";
import { validateRecipeRestrictions } from "../validators/validateRecipeRestrictions";
import { validateWeeklyAllergenCadence } from "../validators/validateWeeklyAllergenCadence";

type RuleViolation = {
  date: string;
  message: string;
};

type RuleSummary = {
  id: string;
  label: string;
  detail: string;
  passing: boolean;
  passingLabel: string;
  failingLabel: string;
  violations: RuleViolation[];
};

const MAX_VISIBLE_VIOLATIONS = 3;
const ALLERGEN_FOODS = foods.filter((food) => food.isAllergen);
const WEEK_OF_PATTERN = /week of (\d{4}-\d{2}-\d{2})/i;

const formatDateLabel = (date: string) => format(parseISO(date), "MMM d");

const scrollToDay = (date: string, onSelectDay: (date: string) => void) => {
  onSelectDay(date);

  window.requestAnimationFrame(() => {
    document
      .getElementById(`day-${date}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const getDailyMinimumViolations = (days: DayEntry[]) =>
  days.flatMap((day) =>
    validateDailyMinimum(day).errors.map((message) => ({
      date: day.date,
      message,
    })),
  );

const getNoConsecutiveViolations = (days: DayEntry[]) =>
  days.flatMap((day, index) =>
    validateNoConsecutiveNewFoods(days, index).errors.map((message) => ({
      date: day.date,
      message,
    })),
  );

const getAllergenSpacingViolations = (days: DayEntry[]) =>
  days.flatMap((day, index) =>
    validateAllergenSpacing(days, index).errors.map((message) => ({
      date: day.date,
      message,
    })),
  );

const getCombinationStartViolations = (days: DayEntry[]) =>
  days.flatMap((day) =>
    validateCombinationStartDate(day).errors.map((message) => ({
      date: day.date,
      message,
    })),
  );

const getCombinationIngredientViolations = (days: DayEntry[]) => {
  const introMap = buildSingleIntroductionMap(days);

  return days.flatMap((day) =>
    validateCombinationIngredients(day, introMap).errors.map((message) => ({
      date: day.date,
      message,
    })),
  );
};

const getRecipeRestrictionViolations = (days: DayEntry[]) =>
  days.flatMap((day) =>
    day.items
      .filter((item) => item.type === "combination" && item.recipeId)
      .flatMap((item) => {
        const recipe = recipesById.get(item.recipeId ?? "");

        if (!recipe) {
          return [];
        }

        return validateRecipeRestrictions(recipe).errors.map((message) => ({
          date: day.date,
          message,
        }));
      }),
  );

const countDistinctViolationDays = (violations: RuleViolation[]) =>
  new Set(violations.map((violation) => violation.date)).size;

const getAllergenMaintenanceViolations = (days: DayEntry[]) => {
  if (days.length === 0) {
    return [];
  }

  const violations: RuleViolation[] = [];

  for (const allergen of ALLERGEN_FOODS) {
    const cadenceResult = validateWeeklyAllergenCadence(days, allergen.id);

    for (const message of cadenceResult.errors) {
      const weekOf = message.match(WEEK_OF_PATTERN)?.[1];
      const weekStart = weekOf ? parseISO(weekOf) : null;
      const weekEnd = weekStart ? endOfWeek(weekStart, { weekStartsOn: 0 }) : null;
      const weekDays =
        weekStart && weekEnd
          ? days.filter((day) => {
              const dayDate = parseISO(day.date);

              return !isBefore(dayDate, weekStart) && !isAfter(dayDate, weekEnd);
            })
          : [];
      const targetDate = weekDays[0]?.date ?? days[0]?.date;

      if (!targetDate) {
        continue;
      }

      violations.push({
        date: targetDate,
        message,
      });
    }
  }

  return violations;
};

const buildRuleSummaries = (days: DayEntry[]): RuleSummary[] => {
  const dailyMinimumViolations = getDailyMinimumViolations(days);
  const consecutiveViolations = getNoConsecutiveViolations(days);
  const allergenSpacingViolations = getAllergenSpacingViolations(days);
  const allergenMaintenanceViolations = getAllergenMaintenanceViolations(days);
  const combinationStartViolations = getCombinationStartViolations(days);
  const combinationIngredientViolations = getCombinationIngredientViolations(days);
  const recipeRestrictionViolations = getRecipeRestrictionViolations(days);
  const nonEmptyDays = days.filter((day) => day.items.length > 0).length;
  const daysWithoutConsecutiveConflicts =
    days.length - countDistinctViolationDays(consecutiveViolations);

  return [
    {
      id: "daily-minimum",
      label: "Daily minimum",
      detail: "Every day needs at least one planned food item.",
      passing: dailyMinimumViolations.length === 0,
      passingLabel: `${nonEmptyDays}/${days.length || 1} days populated`,
      failingLabel: `${dailyMinimumViolations.length} empty day${dailyMinimumViolations.length === 1 ? "" : "s"}`,
      violations: dailyMinimumViolations,
    },
    {
      id: "no-consecutive-new-foods",
      label: "No consecutive new foods",
      detail: "A first introduction cannot follow another first introduction on the prior day.",
      passing: consecutiveViolations.length === 0,
      passingLabel: `${daysWithoutConsecutiveConflicts}/${days.length || 1} days clear`,
      failingLabel: `${consecutiveViolations.length} consecutive intro conflict${consecutiveViolations.length === 1 ? "" : "s"}`,
      violations: consecutiveViolations,
    },
    {
      id: "allergen-spacing",
      label: "Allergen spacing",
      detail: "First-time allergens need 3 full calendar gap days between introductions.",
      passing: allergenSpacingViolations.length === 0,
      passingLabel: "All allergen gaps respected",
      failingLabel: `${allergenSpacingViolations.length} allergen spacing violation${allergenSpacingViolations.length === 1 ? "" : "s"}`,
      violations: allergenSpacingViolations,
    },
    {
      id: "allergen-maintenance",
      label: "Allergen maintenance",
      detail: "After introduction, each allergen should appear 1-2 times per Sunday-Saturday week.",
      passing: allergenMaintenanceViolations.length === 0,
      passingLabel: "Weekly allergen cadence satisfied",
      failingLabel: `${allergenMaintenanceViolations.length} weekly cadence gap${allergenMaintenanceViolations.length === 1 ? "" : "s"}`,
      violations: allergenMaintenanceViolations,
    },
    {
      id: "combination-start-date",
      label: "Combination timing",
      detail: "Combination recipes stay locked until May 1, 2026.",
      passing: combinationStartViolations.length === 0,
      passingLabel: "No early combinations scheduled",
      failingLabel: `${combinationStartViolations.length} early combination placement${combinationStartViolations.length === 1 ? "" : "s"}`,
      violations: combinationStartViolations,
    },
    {
      id: "combination-eligibility",
      label: "Combination eligibility",
      detail: "Every recipe ingredient must be introduced as a single food before the combo date.",
      passing: combinationIngredientViolations.length === 0,
      passingLabel: "All combinations use unlocked ingredients",
      failingLabel: `${combinationIngredientViolations.length} blocked combination${combinationIngredientViolations.length === 1 ? "" : "s"}`,
      violations: combinationIngredientViolations,
    },
    {
      id: "recipe-restrictions",
      label: "Recipe restrictions",
      detail: "Recipes cannot include added sodium, added sugar, or hot spices.",
      passing: recipeRestrictionViolations.length === 0,
      passingLabel: "All recipes stay within restrictions",
      failingLabel: `${recipeRestrictionViolations.length} prohibited recipe flag${recipeRestrictionViolations.length === 1 ? "" : "s"}`,
      violations: recipeRestrictionViolations,
    },
  ];
};

export function RuleStatusPanel({
  days,
  onSelectDay,
}: {
  days: DayEntry[];
  onSelectDay: (date: string) => void;
}) {
  const ruleSummaries = buildRuleSummaries(days);
  const passingRules = ruleSummaries.filter((rule) => rule.passing).length;
  const validDays = days.filter((day) => day.validation.valid).length;
  const invalidDays = days.filter((day) => day.validation.errors.length > 0).length;
  const complianceScore =
    days.length === 0 ? 0 : Math.round((validDays / days.length) * 100);

  return (
    <section className="rounded-[2rem] bg-[#eef3ec] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Rules Summary
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Compliance dashboard
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Each planning rule now reports live pass or fail state with direct
                links back into the affected calendar days. The panel stays rule-first,
                so it is easier to see which constraint broke instead of scanning a flat
                issue feed.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Compliance Score
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {complianceScore}%
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#dfead9] p-4 sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Rules Passing
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {passingRules}/{ruleSummaries.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#f7e3d4] p-4 sm:p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
                Valid Days
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {validDays}/{days.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {ruleSummaries.map((rule) => (
            <article
              key={rule.id}
              className="rounded-[1.5rem] bg-white/80 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          rule.passing
                            ? "bg-[#dfead9] text-stone-800"
                            : "bg-[#f7d8cc] text-stone-900"
                        }`}
                      >
                        {rule.passing ? "✓ Passing" : "✗ Failing"}
                      </span>
                      <p className="font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                        {rule.label}
                      </p>
                    </div>
                    <p className="font-sans text-sm leading-6 text-stone-600">
                      {rule.detail}
                    </p>
                  </div>

                  <p className="rounded-full bg-[#eef2ed] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                    {rule.passing ? rule.passingLabel : rule.failingLabel}
                  </p>
                </div>

                {rule.violations.length === 0 ? (
                  <p className="rounded-[1rem] bg-[#eef4ea] px-4 py-3 font-sans text-sm leading-6 text-stone-700">
                    This rule currently passes across the full plan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Linked violations
                      </p>
                      {rule.violations.length > MAX_VISIBLE_VIOLATIONS ? (
                        <p className="font-sans text-xs text-stone-500">
                          Showing {MAX_VISIBLE_VIOLATIONS} of {rule.violations.length}
                        </p>
                      ) : null}
                    </div>

                    <ul className="space-y-2">
                      {rule.violations.slice(0, MAX_VISIBLE_VIOLATIONS).map((violation, index) => (
                        <li key={`${rule.id}-${violation.date}-${index}`}>
                          <button
                            type="button"
                            onClick={() => scrollToDay(violation.date, onSelectDay)}
                            className="w-full rounded-[1rem] bg-[#f8e1d8] px-4 py-3 text-left transition hover:bg-[#f3d5c8]"
                          >
                            <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                              Jump to {formatDateLabel(violation.date)}
                            </span>
                            <span className="mt-1 block font-sans text-sm leading-6 text-stone-800">
                              {violation.message}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[1.5rem] bg-white/70 p-4">
          <p className="font-sans text-sm leading-7 text-stone-700">
            {invalidDays === 0
              ? "All day cards currently validate cleanly, and each active rule is passing."
              : `${invalidDays} day${invalidDays === 1 ? "" : "s"} still carry validation errors. Use the linked rule cards above to jump directly into the affected calendar dates.`}
          </p>
        </div>
      </div>
    </section>
  );
}

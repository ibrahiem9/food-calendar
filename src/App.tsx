import { useEffect, useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { CombinationPlannerPanel } from "./components/CombinationPlannerPanel";
import { ConflictResolutionModal } from "./components/ConflictResolutionModal";
import { FoodLibraryPanel } from "./components/FoodLibraryPanel";
import { InspectorPanel } from "./components/InspectorPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import { foods } from "./data/foods";
import { recipes } from "./data/recipes";
import { usePlannerStore } from "./store/plannerStore";
import { downloadPlannerCsv } from "./utils/csvExport";

function App() {
  const days = usePlannerStore((state) => state.days);
  const initializeDays = usePlannerStore((state) => state.initializeDays);
  const requestAddFoodToDay = usePlannerStore((state) => state.requestAddFoodToDay);
  const addRecipeToDay = usePlannerStore((state) => state.addRecipeToDay);
  const requestRemovePlannedItem = usePlannerStore(
    (state) => state.requestRemovePlannedItem,
  );
  const requestMovePlannedItem = usePlannerStore(
    (state) => state.requestMovePlannedItem,
  );
  const pendingConflict = usePlannerStore((state) => state.pendingConflict);
  const confirmPendingConflict = usePlannerStore(
    (state) => state.confirmPendingConflict,
  );
  const dismissPendingConflict = usePlannerStore(
    (state) => state.dismissPendingConflict,
  );
  const applyConflictSuggestion = usePlannerStore(
    (state) => state.applyConflictSuggestion,
  );
  const warningBanner = usePlannerStore((state) => state.warningBanner);
  const clearWarningBanner = usePlannerStore((state) => state.clearWarningBanner);
  const canUndo = usePlannerStore((state) => state.canUndo);
  const canRedo = usePlannerStore((state) => state.canRedo);
  const undo = usePlannerStore((state) => state.undo);
  const redo = usePlannerStore((state) => state.redo);
  const generateFirstIntroductions = usePlannerStore(
    (state) => state.generateFirstIntroductions,
  );
  const clearAllDays = usePlannerStore((state) => state.clearAllDays);
  const savePlan = usePlannerStore((state) => state.savePlan);
  const [saveMessage, setSaveMessage] = useState("");
  const [inspectedDayDate, setInspectedDayDate] = useState("");
  const [inspectedFoodId, setInspectedFoodId] = useState(foods[0]?.id ?? "");
  const scheduledFirstIntroductions = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => item.isFirstIntroduction).length,
    0,
  );
  const repeatCount = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => !item.isFirstIntroduction).length,
    0,
  );
  const combinationCount = days.reduce(
    (count, day) =>
      count + day.items.filter((item) => item.type === "combination").length,
    0,
  );
  const firstIntroductionDays = days.filter((day) =>
    day.items.some((item) => item.isFirstIntroduction),
  ).length;
  const populatedDays = days.filter((day) => day.items.length > 0).length;
  const hasValidationErrors = days.some((day) => day.validation.errors.length > 0);

  useEffect(() => {
    if (days.length === 0) {
      initializeDays();
    }
  }, [days.length, initializeDays]);

  useEffect(() => {
    if (days.length > 0 && !days.some((day) => day.date === inspectedDayDate)) {
      setInspectedDayDate(days[0].date);
    }
  }, [days, inspectedDayDate]);

  useEffect(() => {
    if (!foods.some((food) => food.id === inspectedFoodId)) {
      setInspectedFoodId(foods[0]?.id ?? "");
    }
  }, [inspectedFoodId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        redo();
        return;
      }

      undo();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveMessage("");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const handleSave = () => {
    savePlan();
    setSaveMessage(
      hasValidationErrors ? "Plan saved locally with warnings" : "Plan saved locally",
    );
  };

  const handleGenerate = () => {
    const summary = generateFirstIntroductions();

    setSaveMessage(
      summary.unscheduledFoodIds.length === 0
        ? `Generated ${summary.populatedDayCount} populated days with ${summary.scheduledCount} first introductions`
        : `Generated ${summary.populatedDayCount} populated days. ${summary.unscheduledFoodIds.length} foods could not be introduced.`,
    );
  };

  const handleClearAll = () => {
    clearAllDays();
    setSaveMessage("Calendar reset");
  };

  const handleExportCsv = () => {
    const exported = downloadPlannerCsv({ days, foods });

    setSaveMessage(
      exported
        ? `Exported ${days.length} days to CSV`
        : "Nothing to export yet. Add foods or generate the calendar first.",
    );
  };

  const handlePrint = () => {
    window.print();
    setSaveMessage("Opened print preview");
  };

  const handleAddFood = (date: string, foodId: string) => {
    const result = requestAddFoodToDay(date, foodId);

    if (result.applied) {
      setSaveMessage(`Food added to ${date}`);
      return;
    }

    if (result.reason && !result.requiresConfirmation) {
      setSaveMessage(result.reason);
    }
  };

  const handleRemovePlannedItem = (date: string, itemIndex: number) => {
    const result = requestRemovePlannedItem(date, itemIndex);

    if (result.applied) {
      setSaveMessage(`Item removed from ${date}`);
      return;
    }

    if (result.reason && !result.requiresConfirmation) {
      setSaveMessage(result.reason);
    }
  };

  const handleMovePlannedItem = (
    sourceDate: string,
    itemIndex: number,
    targetDate: string,
  ) => {
    const result = requestMovePlannedItem(sourceDate, itemIndex, targetDate);

    if (result.applied) {
      setSaveMessage(`Item moved to ${targetDate}`);
      return;
    }

    if (result.reason && !result.requiresConfirmation) {
      setSaveMessage(result.reason);
    }
  };

  const handleUseConflictSuggestion = (date: string) => {
    const result = applyConflictSuggestion(date);

    if (result.applied) {
      setSaveMessage(`Applied suggested date ${date}`);
      return;
    }

    if (result.reason && !result.requiresConfirmation) {
      setSaveMessage(result.reason);
    }
  };

  const handleConfirmConflict = () => {
    confirmPendingConflict();
    setSaveMessage("Edit applied with warnings");
  };

  const handleCancelConflict = () => {
    dismissPendingConflict();
    setSaveMessage("Edit cancelled");
  };

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,196,255,0.2),_transparent_38%),linear-gradient(180deg,_#f8faf7_0%,_#edf3ee_100%)] px-5 py-8 text-stone-800 sm:px-8 sm:py-10"
      data-print-root
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header
          className="overflow-hidden rounded-[2rem] bg-white/80 p-6 shadow-[0_8px_32px_rgba(45,52,49,0.06)] ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
          data-print-hide
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-sky-700/70">
                Baby Food Introduction Planner
              </p>
              <div className="space-y-3">
                <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-stone-900 sm:text-5xl">
                  BabyBite Calendar
                </h1>
                <p className="max-w-2xl font-sans text-sm leading-6 text-stone-700 sm:text-base">
                  Manual planning and first-introduction generation now share
                  the same rule-aware calendar. You can seed the full catalog,
                  backfill empty dates with repeat foods, keep allergen cadence
                  visible week by week, validate combination recipes against
                  unlocked ingredients, adjust any day inline, and persist the
                  working plan in the browser.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:min-w-[24rem]">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-5 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
                >
                  Generate Calendar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-[#ecefe9] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1]"
                >
                  {hasValidationErrors ? "Save with Warnings" : "Save Plan"}
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full bg-[#f1e2da] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#ecd6cb]"
                >
                  Clear All Days
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="rounded-full bg-[#dfe9df] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#d5e1d4]"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-full bg-[#e4ebe3] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#dae4d9]"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className="rounded-full bg-[#ecefe9] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className="rounded-full bg-[#ecefe9] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Redo
                </button>
              </div>

              <div className="min-h-[1.5rem] font-sans text-sm text-stone-500">
                {saveMessage ||
                  "Generation auto-saves, fills every empty day, schedules allergen maintenance across Sunday-Saturday weeks, and exports the working plan as CSV."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f1f4f1] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Phase Status
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                    Phase 14 in app
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    The food library now shows live introduction status, weekly
                    allergen due state, text search, and drag-to-calendar on
                    top of the Phase 10 conflict-aware editing and undo/redo
                    workflow. CSV export now captures date, foods, new
                    introductions, allergen presence, combination usage, and
                    validation status, while print mode strips the editing UI
                    into a month-by-month planner layout that is ready for
                    black-and-white PDF output alongside the {recipes.length}{" "}
                    curated recipes already available on the same planner
                    surface.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-[#f1f4f1] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Calendar Coverage
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                    {populatedDays} / {days.length || 0}
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    {scheduledFirstIntroductions} first introductions and{" "}
                    {repeatCount} repeat placements currently occupy{" "}
                    {firstIntroductionDays} intro days across the full plan.
                    {combinationCount > 0
                      ? ` ${combinationCount} combination recipes are also scheduled.`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {warningBanner ? (
          <section
            className="rounded-[1.75rem] bg-[#f4e0d5] p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
            data-print-hide
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
                  Warning Banner
                </p>
                <p className="mt-2 font-sans text-sm leading-7 text-stone-800">
                  {warningBanner}
                </p>
              </div>
              <button
                type="button"
                onClick={clearWarningBanner}
                className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <div data-print-hide>
          <ValidationPanel days={days} />
        </div>
        <div data-print-hide>
          <InspectorPanel
            days={days}
            selectedDayDate={inspectedDayDate}
            selectedFoodId={inspectedFoodId}
            onSelectDay={setInspectedDayDate}
            onSelectFood={setInspectedFoodId}
          />
        </div>
        <div data-print-hide>
          <CombinationPlannerPanel days={days} onAddRecipe={addRecipeToDay} />
        </div>
        <CalendarView
          days={days}
          onAddFood={handleAddFood}
          onMovePlannedItem={handleMovePlannedItem}
          onRemovePlannedItem={handleRemovePlannedItem}
          selectedDayDate={inspectedDayDate}
          selectedFoodId={inspectedFoodId}
          onSelectDay={setInspectedDayDate}
          onSelectFood={setInspectedFoodId}
        />
        <div data-print-hide>
          <FoodLibraryPanel
            days={days}
            selectedFoodId={inspectedFoodId}
            onInspectFood={setInspectedFoodId}
          />
        </div>
      </div>
      <ConflictResolutionModal
        conflict={pendingConflict}
        onCancel={handleCancelConflict}
        onConfirm={handleConfirmConflict}
        onUseSuggestion={handleUseConflictSuggestion}
      />
    </main>
  );
}

export default App;

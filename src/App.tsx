import { useEffect, useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { FoodLibraryPanel } from "./components/FoodLibraryPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import { usePlannerStore } from "./store/plannerStore";

function App() {
  const days = usePlannerStore((state) => state.days);
  const initializeDays = usePlannerStore((state) => state.initializeDays);
  const addFoodToDay = usePlannerStore((state) => state.addFoodToDay);
  const removeFoodFromDay = usePlannerStore((state) => state.removeFoodFromDay);
  const generateFirstIntroductions = usePlannerStore(
    (state) => state.generateFirstIntroductions,
  );
  const clearAllDays = usePlannerStore((state) => state.clearAllDays);
  const savePlan = usePlannerStore((state) => state.savePlan);
  const [saveMessage, setSaveMessage] = useState("");
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
  const firstIntroductionDays = days.filter((day) =>
    day.items.some((item) => item.isFirstIntroduction),
  ).length;
  const populatedDays = days.filter((day) => day.items.length > 0).length;

  useEffect(() => {
    if (days.length === 0) {
      initializeDays();
    }
  }, [days.length, initializeDays]);

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
    setSaveMessage("Plan saved locally");
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,196,255,0.2),_transparent_38%),linear-gradient(180deg,_#f8faf7_0%,_#edf3ee_100%)] px-5 py-8 text-stone-800 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-[2rem] bg-white/80 p-6 shadow-[0_8px_32px_rgba(45,52,49,0.06)] ring-1 ring-white/60 backdrop-blur-xl sm:p-8">
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
                  visible week by week, adjust any day inline, and persist the
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
                  Save Plan
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full bg-[#f1e2da] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#ecd6cb]"
                >
                  Clear All Days
                </button>
              </div>

              <div className="min-h-[1.5rem] font-sans text-sm text-stone-500">
                {saveMessage ||
                  "Generation auto-saves, fills every empty day, and now schedules allergen maintenance across Sunday-Saturday weeks."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f1f4f1] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Phase Status
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                    Phase 7 in app
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    Auto-generation now reserves space for allergen
                    maintenance, fills remaining gaps with repeat foods, and
                    tracks weekly cadence status directly in the calendar.
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
                    {repeatCount} repeats currently occupy{" "}
                    {firstIntroductionDays} intro days across the full plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <ValidationPanel days={days} />
        <CalendarView
          days={days}
          onAddFood={addFoodToDay}
          onRemoveFood={removeFoodFromDay}
        />
        <FoodLibraryPanel />
      </div>
    </main>
  );
}

export default App;

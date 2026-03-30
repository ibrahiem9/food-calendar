import { useEffect, useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { FoodLibraryPanel } from "./components/FoodLibraryPanel";
import { usePlannerStore } from "./store/plannerStore";
import { foodsByCategory } from "./data/foods";

const totalFoods = Object.values(foodsByCategory).reduce(
  (count, foods) => count + foods.length,
  0,
);

function App() {
  const days = usePlannerStore((state) => state.days);
  const initializeDays = usePlannerStore((state) => state.initializeDays);
  const addFoodToDay = usePlannerStore((state) => state.addFoodToDay);
  const removeFoodFromDay = usePlannerStore((state) => state.removeFoodFromDay);
  const clearAllDays = usePlannerStore((state) => state.clearAllDays);
  const savePlan = usePlannerStore((state) => state.savePlan);
  const [saveMessage, setSaveMessage] = useState("");

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
                  Manual planning is now live. You can assign foods directly to
                  calendar days, remove them inline, and keep the working plan
                  persisted in the browser before validation rules arrive.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:min-w-[24rem]">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-5 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
                >
                  Save Plan
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full bg-[#ecefe9] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1]"
                >
                  Clear All Days
                </button>
              </div>

              <div className="min-h-[1.5rem] font-sans text-sm text-stone-500">
                {saveMessage || "Changes also auto-save after each edit."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f1f4f1] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Phase Status
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                    Phase 3 in app
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    The calendar now supports direct manual placement, removal,
                    and browser persistence on top of the Phase 2 timeline.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-[#f1f4f1] p-4">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Catalog Size
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                    {totalFoods} foods
                  </p>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    20 fruits, 20 vegetables, 17 starches, 21 proteins, and 16
                    allergens from the rules document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

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

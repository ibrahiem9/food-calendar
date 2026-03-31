import { useEffect, useMemo, useState } from "react";
import { ConflictResolutionModal } from "./components/ConflictResolutionModal";
import { InspectorPanel } from "./components/InspectorPanel";
import { CalendarScreen } from "./components/screens/CalendarScreen";
import { LibraryScreen } from "./components/screens/LibraryScreen";
import { RecipesScreen } from "./components/screens/RecipesScreen";
import { RulesScreen } from "./components/screens/RulesScreen";
import { MobileNavDrawer } from "./components/shell/MobileNavDrawer";
import { SidebarNav } from "./components/shell/SidebarNav";
import { TopBar } from "./components/shell/TopBar";
import { foods } from "./data/foods";
import { recipes } from "./data/recipes";
import { usePlannerStore } from "./store/plannerStore";
import type { AppView } from "./types/appShell";
import { downloadPlannerCsv } from "./utils/csvExport";

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "calendar",
    label: "Calendar",
    description: "Focused month and week planning canvas",
    icon: "◫",
  },
  {
    id: "library",
    label: "Food Library",
    description: "Search, inspect, and drag foods into the plan",
    icon: "◌",
  },
  {
    id: "rules",
    label: "Rules Checklist",
    description: "Compliance dashboard and live validation feed",
    icon: "△",
  },
  {
    id: "recipes",
    label: "Recipes",
    description: "Combination planner with unlock checks",
    icon: "✦",
  },
];

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
  const [activeView, setActiveView] = useState<AppView>("calendar");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

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

  const selectedDay = days.find((day) => day.date === inspectedDayDate);
  const statusMessage = saveMessage
    ? saveMessage
    : `Coverage ${populatedDays}/${days.length || 0} days, ${scheduledFirstIntroductions} intros, ${repeatCount} repeats${combinationCount > 0 ? `, ${combinationCount} recipes` : ""}.`;

  const renderPrimaryAction = (fullWidth = false) => (
    <button
      type="button"
      onClick={() => {
        setActiveView("calendar");
        const summary = generateFirstIntroductions();

        setSaveMessage(
          summary.unscheduledFoodIds.length === 0
            ? `Generated ${summary.populatedDayCount} populated days with ${summary.scheduledCount} first introductions`
            : `Generated ${summary.populatedDayCount} populated days. ${summary.unscheduledFoodIds.length} foods could not be introduced.`,
        );
      }}
      className={`${fullWidth ? "w-full" : "w-full sm:w-auto"} rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] px-5 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]`}
    >
      Generate Calendar
    </button>
  );

  const actionBar = (
    <div className="flex flex-wrap items-stretch gap-2.5 sm:gap-3">
      {renderPrimaryAction()}
      <button
        type="button"
        onClick={() => {
          savePlan();
          setSaveMessage(
            hasValidationErrors ? "Plan saved locally with warnings" : "Plan saved locally",
          );
        }}
        className="rounded-full bg-[#ecefe9] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1]"
      >
        {hasValidationErrors ? "Save with Warnings" : "Save Plan"}
      </button>
      <button
        type="button"
        onClick={() => {
          const exported = downloadPlannerCsv({ days, foods });

          setSaveMessage(
            exported
              ? `Exported ${days.length} days to CSV`
              : "Nothing to export yet. Add foods or generate the calendar first.",
          );
        }}
        className="rounded-full bg-[#dfe9df] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#d5e1d4]"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => {
          window.print();
          setSaveMessage("Opened print preview");
        }}
        className="rounded-full bg-[#e4ebe3] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#dae4d9]"
      >
        Print
      </button>
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="rounded-full bg-[#ecefe9] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="rounded-full bg-[#ecefe9] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Redo
      </button>
      <button
        type="button"
        onClick={() => {
          clearAllDays();
          setSaveMessage("Calendar reset");
        }}
        className="rounded-full bg-[#f1e2da] px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#ecd6cb]"
      >
        Clear All
      </button>
    </div>
  );

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

  const mainWorkspace = useMemo(() => {
    if (activeView === "library") {
      return (
        <LibraryScreen
          days={days}
          selectedFoodId={inspectedFoodId}
          onInspectFood={setInspectedFoodId}
        />
      );
    }

    if (activeView === "rules") {
      return <RulesScreen days={days} onSelectDay={setInspectedDayDate} />;
    }

    if (activeView === "recipes") {
      return <RecipesScreen days={days} onAddRecipe={addRecipeToDay} />;
    }

    return (
      <CalendarScreen
        days={days}
        onAddFood={handleAddFood}
        onMovePlannedItem={handleMovePlannedItem}
        onRemovePlannedItem={handleRemovePlannedItem}
        selectedDayDate={inspectedDayDate}
        selectedFoodId={inspectedFoodId}
        onSelectDay={setInspectedDayDate}
        onSelectFood={setInspectedFoodId}
      />
    );
  }, [activeView, addRecipeToDay, days, inspectedDayDate, inspectedFoodId]);

  const showInspector = activeView === "calendar" || activeView === "library";

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(152,196,255,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(185,207,168,0.26),_transparent_34%),linear-gradient(180deg,_#f8faf7_0%,_#edf3ee_100%)] px-4 py-6 text-stone-800 sm:px-6 sm:py-8"
      data-print-root
    >
      <MobileNavDrawer
        open={mobileNavOpen}
        items={NAV_ITEMS.map((item) => ({ ...item, icon: <span>{item.icon}</span> }))}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setMobileInspectorOpen(false);
        }}
        onClose={() => setMobileNavOpen(false)}
        actionSlot={renderPrimaryAction(true)}
      />

      <div className="mx-auto flex max-w-[1600px] gap-5 xl:gap-6">
        <SidebarNav
          items={NAV_ITEMS.map((item) => ({ ...item, icon: <span>{item.icon}</span> }))}
          activeView={activeView}
          onChangeView={(view) => {
            setActiveView(view);
            setMobileInspectorOpen(false);
          }}
          primaryAction={renderPrimaryAction(true)}
        />

        <div className="min-w-0 flex-1 space-y-5">
          <TopBar
            items={NAV_ITEMS}
            activeView={activeView}
            onChangeView={(view) => {
              setActiveView(view);
              setMobileInspectorOpen(false);
            }}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            statusMessage={statusMessage}
            actionSlot={actionBar}
          />

          {warningBanner ? (
            <section
              className="rounded-[1.75rem] bg-[#f4e0d5] p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-6"
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

          {(activeView === "calendar" || activeView === "library") && (
            <div className="xl:hidden" data-print-hide>
              <button
                type="button"
                onClick={() => setMobileInspectorOpen((current) => !current)}
                className="w-full rounded-[1.6rem] bg-white/78 px-5 py-4 text-left shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:px-6"
              >
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Inspector
                </p>
                <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                  {selectedDay ? selectedDay.date : "Select a day"}
                </p>
                <p className="mt-1 font-sans text-sm text-stone-600">
                  {mobileInspectorOpen ? "Hide" : "Show"} selected-day controls and food explanation.
                </p>
              </button>
            </div>
          )}

          <div
            className={`grid gap-5 xl:gap-6 ${
              showInspector ? "xl:grid-cols-[minmax(0,1fr)_24rem]" : ""
            }`}
          >
            <div className="min-w-0">{mainWorkspace}</div>

            {showInspector ? (
              <div
                className={`${mobileInspectorOpen ? "block" : "hidden"} xl:block`}
                data-print-hide
              >
                <InspectorPanel
                  days={days}
                  selectedDayDate={inspectedDayDate}
                  selectedFoodId={inspectedFoodId}
                  onSelectDay={(date) => {
                    setInspectedDayDate(date);
                    setActiveView("calendar");
                  }}
                  onSelectFood={setInspectedFoodId}
                  onAddFood={handleAddFood}
                  onRemovePlannedItem={handleRemovePlannedItem}
                  onMovePlannedItem={handleMovePlannedItem}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:gap-5 sm:grid-cols-3" data-print-hide>
            <div className="rounded-[1.5rem] bg-white/76 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Planner overview
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                One active workspace
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                Desktop keeps the sidebar and top bar persistent while mobile shifts navigation and secondary controls into drawers.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/76 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Calendar coverage
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {populatedDays}/{days.length || 0}
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                {scheduledFirstIntroductions} first introductions with {repeatCount} repeats and {recipes.length} curated recipes available.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/76 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.04)]">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Selected food
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                {foods.find((food) => food.id === inspectedFoodId)?.name ?? "None"}
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                Inspect from the library or any day summary, then use the right rail to place or move items.
              </p>
            </div>
          </div>
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

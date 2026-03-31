import { CalendarView } from "../CalendarView";
import { WorkspaceFrame } from "../shell/WorkspaceFrame";
import { calendarHeroVisual } from "../../data/foodVisuals";
import type { DayEntry } from "../../types/calendar";

export function CalendarScreen(props: {
  days: DayEntry[];
  onAddFood: (date: string, foodId: string) => void;
  onMovePlannedItem: (sourceDate: string, itemIndex: number, targetDate: string) => void;
  onRemovePlannedItem: (date: string, itemIndex: number) => void;
  selectedDayDate: string;
  selectedFoodId: string;
  onSelectDay: (date: string) => void;
  onSelectFood: (foodId: string) => void;
}) {
  return (
    <WorkspaceFrame
      eyebrow="Calendar Workspace"
      title="One month at a time with the selected day driving edits"
      description="The calendar now stays focused on one visible slice of the plan. Day cells stay summary-first while detail editing and rule explanations live in the inspector rail."
      aside={
        <div
          className={`rounded-[1.5rem] bg-gradient-to-br ${calendarHeroVisual.accentClassName} p-3`}
        >
          <img
            src={calendarHeroVisual.imagePath}
            alt={calendarHeroVisual.alt}
            className="h-28 w-full rounded-[1.2rem] object-cover"
          />
        </div>
      }
    >
      <CalendarView {...props} />
    </WorkspaceFrame>
  );
}

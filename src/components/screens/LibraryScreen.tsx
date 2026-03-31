import { FoodLibraryPanel } from "../FoodLibraryPanel";
import { WorkspaceFrame } from "../shell/WorkspaceFrame";
import type { DayEntry } from "../../types/calendar";

export function LibraryScreen({
  days,
  selectedFoodId,
  onInspectFood,
}: {
  days: DayEntry[];
  selectedFoodId: string;
  onInspectFood: (foodId: string) => void;
}) {
  return (
    <WorkspaceFrame
      eyebrow="Library Workspace"
      title="Editorial food library with featured imagery and live statuses"
      description="Browse foods by category, search or filter the catalog, inspect readiness, and drag any visible food onto the selected calendar day."
    >
      <FoodLibraryPanel
        days={days}
        selectedFoodId={selectedFoodId}
        onInspectFood={onInspectFood}
      />
    </WorkspaceFrame>
  );
}

import { CombinationPlannerPanel } from "../CombinationPlannerPanel";
import { WorkspaceFrame } from "../shell/WorkspaceFrame";
import type { DayEntry } from "../../types/calendar";

export function RecipesScreen({
  days,
  onAddRecipe,
}: {
  days: DayEntry[];
  onAddRecipe: (date: string, recipeId: string) => { added: boolean; reason?: string };
}) {
  return (
    <WorkspaceFrame
      eyebrow="Recipe Workspace"
      title="Combination planning with a visual composer and unlock checks"
      description="Recipes stay in their own focused screen so eligibility, blocked reasons, and add actions are easier to compare without the rest of the planner stacked underneath."
    >
      <CombinationPlannerPanel days={days} onAddRecipe={onAddRecipe} />
    </WorkspaceFrame>
  );
}

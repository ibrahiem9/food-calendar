import { RuleStatusPanel } from "../RuleStatusPanel";
import { ValidationPanel } from "../ValidationPanel";
import { WorkspaceFrame } from "../shell/WorkspaceFrame";
import type { DayEntry } from "../../types/calendar";

export function RulesScreen({
  days,
  onSelectDay,
}: {
  days: DayEntry[];
  onSelectDay: (date: string) => void;
}) {
  return (
    <WorkspaceFrame
      eyebrow="Rules Checklist"
      title="Rule-first review for calendar health and current violations"
      description="The rules view keeps the compliance dashboard and validation feed together as a checklist workspace instead of scattering them across the main planner shell."
    >
      <div className="space-y-5">
        <RuleStatusPanel days={days} onSelectDay={onSelectDay} />
        <ValidationPanel days={days} />
      </div>
    </WorkspaceFrame>
  );
}

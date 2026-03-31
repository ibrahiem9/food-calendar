import { WorkspaceFrame } from "../shell/WorkspaceFrame";

const gettingStartedSteps = [
  {
    title: "Start in Calendar View",
    detail:
      "Review the current timeline, pick a day, and use that selected day as the target for edits.",
  },
  {
    title: "Use Food Library to inspect foods",
    detail:
      "Search or filter the catalog, then inspect a food to understand its current status before placing it.",
  },
  {
    title: "Add foods to the selected day",
    detail:
      "Use the inspector controls or drag from the library when available. Every edit runs validation right away.",
  },
  {
    title: "Check Rules Checklist often",
    detail:
      "Use the rules screen to confirm the plan still satisfies daily minimums, intro spacing, and allergen cadence.",
  },
  {
    title: "Plan recipes only after ingredients unlock",
    detail:
      "Move into the recipes workspace once single-food introductions are done and the combination date rules are satisfied.",
  },
];

const workspaceGuide = [
  {
    title: "Calendar",
    summary:
      "Best for reviewing the schedule by day and month, then placing, moving, or removing foods.",
  },
  {
    title: "Food Library",
    summary:
      "Best for browsing categories, checking status labels like Pending or Introduced, and inspecting foods before scheduling them.",
  },
  {
    title: "Rules Checklist",
    summary:
      "Best for finding errors, warnings, and understanding which rules the current plan is failing.",
  },
  {
    title: "Recipes",
    summary:
      "Best for combinations after ingredients have been introduced and the May 1, 2026 combination start date has been reached.",
  },
];

const statusGuide = [
  "Pending means the food is not yet introduced or scheduled.",
  "Coming Up means the first introduction is already planned on a future date.",
  "Introduced means the first introduction already happened.",
  "Due usually means an allergen or follow-up food needs attention this week.",
  "Satisfied means the food is currently on track and does not need immediate action.",
];

const ruleGuide = [
  "Each day needs at least one food item.",
  "Do not place first introductions on back-to-back days.",
  "Leave at least three full calendar days between first-time allergen introductions.",
  "After an allergen is introduced, keep it appearing one to two times per week.",
  "Do not schedule combinations before May 1, 2026.",
  "Do not schedule a combination before all of its ingredients have been introduced individually.",
];

export function GuideScreen() {
  return (
    <WorkspaceFrame
      eyebrow="Onboarding Guide"
      title="How to use BabyBite from first pass to rule check"
      description="Use this screen any time you need a quick refresher on the planner workflow, the meaning of food statuses, or the rules the calendar is enforcing."
      aside={
        <div className="rounded-[1.5rem] bg-[linear-gradient(145deg,_#f4f7f2,_#ebf1ea)] p-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Best workflow
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-stone-900">
            Calendar → Library → Rules
          </p>
          <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
            Place foods, inspect details, then confirm the plan still complies before moving on.
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-[1.8rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Start here
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {gettingStartedSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[1.4rem] bg-[#f6f8f5] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] text-sm font-semibold text-stone-900">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-stone-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-[1.8rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-6">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Workspaces
            </p>
            <div className="mt-4 grid gap-3.5">
              {workspaceGuide.map((item) => (
                <article key={item.title} className="rounded-[1.35rem] bg-[#eef2ed] p-4">
                  <h3 className="font-sans text-sm font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-5">
            <section className="rounded-[1.8rem] bg-white/82 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-6">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Status labels
              </p>
              <div className="mt-4 space-y-3">
                {statusGuide.map((item) => (
                  <div key={item} className="rounded-[1.2rem] bg-[#f6f8f5] px-4 py-3">
                    <p className="font-sans text-sm leading-6 text-stone-600">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] bg-[#edf2ec] p-5 sm:p-6">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Rule reminders
              </p>
              <div className="mt-4 space-y-3">
                {ruleGuide.map((item) => (
                  <div key={item} className="rounded-[1.2rem] bg-white/74 px-4 py-3">
                    <p className="font-sans text-sm leading-6 text-stone-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </WorkspaceFrame>
  );
}

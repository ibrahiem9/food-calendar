import type { DayEntry } from "../types/calendar";

const MAX_ISSUES = 12;

const getDayIssues = (days: DayEntry[]) =>
  days.flatMap((day) => [
    ...day.validation.errors.map((message) => ({
      date: day.date,
      level: "error" as const,
      message,
    })),
    ...day.validation.warnings.map((message) => ({
      date: day.date,
      level: "warning" as const,
      message,
    })),
  ]);

export function ValidationPanel({ days }: { days: DayEntry[] }) {
  const issues = getDayIssues(days);
  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter((issue) => issue.level === "warning").length;

  return (
    <section className="rounded-[2rem] bg-[#f1f4f1] p-6 sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Validation
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Phase 10 rule feedback
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                Manual overrides now surface here immediately. Add, move, and
                remove actions all re-run the same validators, so ingredient
                unlock failures, cadence gaps, empty days, and spacing issues
                stay visible before and after an override.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Valid Days
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {days.filter((day) => day.validation.valid).length}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#f7e3d4] p-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
                Errors
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {errorCount}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#edf2ec] p-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Warnings
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {warningCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white/78 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
          {issues.length === 0 ? (
            <p className="font-sans text-sm text-stone-700">
              No validation issues right now.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Current issues
                </p>
                <p className="font-sans text-xs text-stone-500">
                  Showing {Math.min(issues.length, MAX_ISSUES)} of {issues.length}
                </p>
              </div>

              <ul className="space-y-2">
                {issues.slice(0, MAX_ISSUES).map((issue, index) => (
                  <li
                    key={`${issue.date}-${issue.level}-${index}`}
                    className={`rounded-[1rem] px-4 py-3 ${
                      issue.level === "error" ? "bg-[#f8e1d8]" : "bg-[#ecefea]"
                    }`}
                  >
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {issue.date}
                    </p>
                    <p className="mt-1 font-sans text-sm leading-6 text-stone-800">
                      {issue.message}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

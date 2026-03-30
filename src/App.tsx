function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,196,255,0.2),_transparent_38%),linear-gradient(180deg,_#f8faf7_0%,_#edf3ee_100%)] px-5 py-8 text-stone-800 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
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
                  Evidence-based planning for a 175-day food introduction timeline,
                  built as a calm editorial workspace rather than a clinical tracker.
                </p>
              </div>
            </div>

            <div className="max-w-sm rounded-[1.5rem] bg-[#f1f4f1] p-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Phase 0 Baseline
              </p>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-stone-900">
                March 28 to September 19, 2026
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-stone-600">
                The project scaffold, design tokens, and source folders are in
                place. Food data and planning logic start in the next phase.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <article className="rounded-[1.75rem] bg-[#f1f4f1] p-6">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Project Foundation
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-stone-900">
              Ready for phased implementation
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-7 text-stone-700">
              This shell intentionally stays light. It establishes the visual
              language, build tooling, and folder structure needed for the food
              catalog, calendar store, validators, and generation engine that
              follow.
            </p>
          </article>

          <aside className="rounded-[1.75rem] bg-white/75 p-6 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Source Folders
            </p>
            <ul className="mt-4 grid gap-3 font-sans text-sm text-stone-700">
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/components</li>
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/data</li>
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/types</li>
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/utils</li>
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/validators</li>
              <li className="rounded-2xl bg-[#e4e9e5] px-4 py-3">src/store</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;

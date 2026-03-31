import type { ReactNode } from "react";
import type { AppView } from "../../types/appShell";

type NavItem = {
  id: AppView;
  label: string;
  description: string;
  icon: ReactNode;
};

export function SidebarNav({
  items,
  activeView,
  onChangeView,
  primaryAction,
}: {
  items: NavItem[];
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  primaryAction: ReactNode;
}) {
  return (
    <aside className="hidden min-h-[calc(100vh-3rem)] w-[18.5rem] flex-col rounded-[2rem] bg-white/76 p-6 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl xl:flex">
      <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,_#f4f7f2,_#ebf1ea)] p-5">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
          BabyBite Calendar
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-stone-900">
          Planner shell
        </h1>
        <p className="mt-3 font-sans text-sm leading-6 text-stone-600">
          One focused workspace at a time with a contextual right rail for editing.
        </p>
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-[#edf2ec] p-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Family profile
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#7ea279,_#b9cfa8)] font-display text-lg font-semibold text-stone-900">
            BB
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-stone-900">
              March to September 2026
            </p>
            <p className="font-sans text-xs uppercase tracking-[0.16em] text-stone-500">
              Intro plan window
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 space-y-2.5">
        {items.map((item) => {
          const isActive = item.id === activeView;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`flex w-full items-start gap-3 rounded-[1.5rem] px-4 py-4 text-left transition ${
                isActive
                  ? "bg-[linear-gradient(135deg,_#eef4ea,_#dbe8d4)] shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                  : "bg-transparent hover:bg-white/68"
              }`}
            >
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-stone-700">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-sm font-semibold text-stone-900">
                  {item.label}
                </span>
                <span className="mt-1 block font-sans text-xs leading-5 text-stone-500">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-7">{primaryAction}</div>

      <div className="mt-auto rounded-[1.5rem] bg-[#eff3f6] p-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Settings + Support
        </p>
        <p className="mt-3 font-sans text-sm leading-6 text-stone-600">
          Undo and redo remain available globally. Use the top bar for save, export, and print.
        </p>
      </div>
    </aside>
  );
}

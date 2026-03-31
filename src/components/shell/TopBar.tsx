import type { ReactNode } from "react";
import type { AppView } from "../../types/appShell";

type TopBarItem = {
  id: AppView;
  label: string;
};

export function TopBar({
  items,
  activeView,
  onChangeView,
  onOpenMobileNav,
  statusMessage,
  actionSlot,
}: {
  items: TopBarItem[];
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenMobileNav: () => void;
  statusMessage: string;
  actionSlot: ReactNode;
}) {
  return (
    <header className="rounded-[2rem] bg-white/74 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef2ed] text-stone-700 xl:hidden"
              aria-label="Open navigation"
            >
              <span className="text-lg">☰</span>
            </button>
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/70">
                Editorial planner
              </p>
              <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-stone-900">
                BabyBite
              </p>
            </div>
          </div>

          <div className="hidden xl:flex">{actionSlot}</div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-2">
            {items.map((item) => {
              const isActive = item.id === activeView;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeView(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[linear-gradient(135deg,_#1a61a4,_#98c4ff)] text-white shadow-[0_8px_32px_rgba(45,52,49,0.06)]"
                      : "bg-[#eef2ed] text-stone-700 hover:bg-[#e4ebe3]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <p className="font-sans text-sm text-stone-500">{statusMessage}</p>
        </div>

        <div className="xl:hidden">{actionSlot}</div>
      </div>
    </header>
  );
}

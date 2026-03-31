import type { ReactNode } from "react";
import type { AppView } from "../../types/appShell";

type DrawerItem = {
  id: AppView;
  label: string;
  description: string;
  icon: ReactNode;
};

export function MobileNavDrawer({
  open,
  items,
  activeView,
  onChangeView,
  onClose,
  actionSlot,
}: {
  open: boolean;
  items: DrawerItem[];
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onClose: () => void;
  actionSlot: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 xl:hidden" data-print-hide>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30"
      />
      <div className="absolute left-4 right-4 top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] bg-white/80 p-5 shadow-[0_8px_32px_rgba(45,52,49,0.06)] backdrop-blur-[20px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Workspaces
            </p>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-stone-900">
              Navigate planner
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ed] text-stone-700"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {items.map((item) => {
            const isActive = item.id === activeView;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChangeView(item.id);
                  onClose();
                }}
                className={`flex w-full items-start gap-3 rounded-[1.5rem] px-4 py-4 text-left ${
                  isActive ? "bg-[#eef4ea]" : "bg-[#f6f8f5]"
                }`}
              >
                <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700">
                  {item.icon}
                </span>
                <span>
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
        </div>

        <div className="mt-6">{actionSlot}</div>
      </div>
    </div>
  );
}

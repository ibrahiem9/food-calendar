import type { PendingConflict } from "../types/calendar";

interface ConflictResolutionModalProps {
  conflict: PendingConflict | null;
  onCancel: () => void;
  onConfirm: () => void;
  onUseSuggestion: (date: string) => void;
}

export function ConflictResolutionModal({
  conflict,
  onCancel,
  onConfirm,
  onUseSuggestion,
}: ConflictResolutionModalProps) {
  if (!conflict) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d3431]/20 px-4 py-6 backdrop-blur-[20px]">
      <div className="w-full max-w-2xl rounded-[2rem] bg-[rgba(248,250,247,0.8)] p-6 shadow-[0_8px_32px_rgba(45,52,49,0.06)] sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Conflict Resolution
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {conflict.title}
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                {conflict.summary}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white/82 p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              New validation errors
            </p>
            <ul className="mt-3 space-y-2">
              {conflict.errors.map((error) => (
                <li
                  key={error}
                  className="rounded-[1rem] bg-[#f8e1d8] px-4 py-3 font-sans text-sm leading-6 text-stone-800"
                >
                  {error}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.5rem] bg-[#eef2ed] p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Suggested alternatives
              </p>
              <p className="font-sans text-xs text-stone-500">
                {conflict.suggestions.length > 0
                  ? "Try one of these dates first."
                  : "No clean alternative date found yet."}
              </p>
            </div>

            {conflict.suggestions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {conflict.suggestions.map((suggestion) => (
                  <li
                    key={suggestion.date}
                    className="flex flex-col gap-3 rounded-[1rem] bg-white/88 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-sans text-sm font-semibold text-stone-800">
                        {suggestion.label}
                      </p>
                      <p className="mt-1 font-sans text-sm leading-6 text-stone-600">
                        {suggestion.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUseSuggestion(suggestion.date)}
                      className="rounded-full bg-[#ecefe9] px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1]"
                    >
                      Use Date
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-[#ecefe9] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#e3e7e1]"
            >
              Cancel Edit
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-[linear-gradient(135deg,_#d8a691,_#f1d4c7)] px-5 py-3 text-sm font-semibold text-stone-900 shadow-[0_8px_32px_rgba(45,52,49,0.06)] transition hover:brightness-[1.02]"
            >
              Apply Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

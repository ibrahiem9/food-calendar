import type { ReactNode } from "react";

export function WorkspaceFrame({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-white/55 p-4 shadow-[0_8px_32px_rgba(45,52,49,0.04)] backdrop-blur-sm sm:p-5 lg:p-6">
      <div className="rounded-[1.8rem] bg-[#eef2ed] p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3.5">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {eyebrow}
            </p>
            <div className="space-y-2.5">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                {title}
              </h2>
              <p className="font-sans text-sm leading-7 text-stone-700">
                {description}
              </p>
            </div>
          </div>
          {aside ? <div className="max-w-sm self-start lg:self-auto">{aside}</div> : null}
        </div>

        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

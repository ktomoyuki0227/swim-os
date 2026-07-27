import { STEPS } from "./form-helpers"

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const isLast = i === STEPS.length - 1
        return (
          <div key={i} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex w-10 shrink-0 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? "bg-[#005F8C] text-white"
                    : active
                    ? "border-2 border-[#005F8C] bg-white text-[#005F8C]"
                    : "border-2 border-[#dce3ea] bg-white text-[#64748b]"
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#005F8C]" : "text-[#64748b]"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mb-4 h-0.5 flex-1 transition-colors ${done ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

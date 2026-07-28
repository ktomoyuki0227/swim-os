"use client"

export function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-[#005F8C] bg-[#005F8C] text-white"
          : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40 hover:text-[#005F8C]"
      }`}
    >
      {label}
    </button>
  )
}

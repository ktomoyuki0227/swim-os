'use client'

interface MonthPickerProps {
  defaultValue: string
}

export function MonthPicker({ defaultValue }: MonthPickerProps) {
  return (
    <form>
      <input
        type="month"
        name="month"
        defaultValue={defaultValue}
        onChange={(e) => {
          const form = e.target.form
          if (form) form.submit()
        }}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </form>
  )
}

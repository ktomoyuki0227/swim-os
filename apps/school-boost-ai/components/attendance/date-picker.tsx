'use client'

interface DatePickerProps {
  defaultValue: string
  scheduleId?: string
}

export function DatePicker({ defaultValue, scheduleId }: DatePickerProps) {
  return (
    <form>
      <input
        type="date"
        name="date"
        defaultValue={defaultValue}
        onChange={(e) => {
          const form = e.target.form
          if (form) form.submit()
        }}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {scheduleId && (
        <input type="hidden" name="schedule_id" value={scheduleId} />
      )}
    </form>
  )
}

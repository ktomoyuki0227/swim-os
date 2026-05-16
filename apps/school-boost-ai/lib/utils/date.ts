export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function formatMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(dateStr))
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '-'
  return timeStr.slice(0, 5) // "HH:MM"
}

export function getAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function monthLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(dateStr))
}

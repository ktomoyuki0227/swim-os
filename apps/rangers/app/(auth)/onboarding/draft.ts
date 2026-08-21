import type { PersonalInfoForm, SwimmerProfileForm } from "./types"

const DRAFT_KEY = "rangers-onboarding-draft-v1"

// avatarFile(File)はJSONにできないため下書きには含めない。avatarPreview
// (data URL)だけを保存し、復元時にdataUrlToFileで完全に再構成する。
export interface OnboardingDraft {
  step: number
  personalForm: PersonalInfoForm
  swimmerForm: Omit<SwimmerProfileForm, "avatarFile">
}

export function saveDraft(draft: OnboardingDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // 容量超過・プライベートブラウジング等で保存できなくても致命的ではないため無視する
  }
}

export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingDraft
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // no-op
  }
}

export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) return null
  const [, mime, base64] = match
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

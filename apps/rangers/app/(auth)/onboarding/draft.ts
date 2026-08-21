import type { PersonalInfoForm, SwimmerProfileForm } from "./types"

const DRAFT_KEY = "rangers-onboarding-draft-v1"

// 下書きには氏名以外の個人情報(住所・緊急連絡先・生年月日・本人確認用の顔写真等)が
// 含まれる。共有端末での離脱を想定し、無期限に残さないようTTLを設ける。
const DRAFT_TTL_MS = 6 * 60 * 60 * 1000 // 6時間

// avatarFile(File)はJSONにできないため下書きには含めない。avatarPreview
// (data URL)だけを保存し、復元時にdataUrlToFileで完全に再構成する。
export interface OnboardingDraft {
  step: number
  personalForm: PersonalInfoForm
  swimmerForm: Omit<SwimmerProfileForm, "avatarFile">
  savedAt: number
}

export function saveDraft(draft: Omit<OnboardingDraft, "savedAt">) {
  try {
    const withTimestamp: OnboardingDraft = { ...draft, savedAt: Date.now() }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(withTimestamp))
  } catch {
    // 容量超過・プライベートブラウジング等で保存できなくても致命的ではないため無視する
  }
}

export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as OnboardingDraft
    // TTL切れ(共有端末に離脱データが残り続けるのを防ぐ)、または旧バージョンで
    // savedAtが存在しない下書きは、機微情報を残さないよう即座に破棄する
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      clearDraft()
      return null
    }
    return draft
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

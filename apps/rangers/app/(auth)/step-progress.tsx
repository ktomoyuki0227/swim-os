import { Fragment } from "react"

// 登録〜オンボーディング全体を通じて使う単一のステップ定義。
// register / register/sent / onboarding の3ページがそれぞれ別の尺度で
// 進捗を表示していると、ページ間を移動するたびにステップ数が変わって見え
// ユーザーが混乱するため、ここで一本化する。
export const REGISTRATION_STEPS = [
  { num: 1, label: "アカウント作成" },
  { num: 2, label: "メール確認" },
  { num: 3, label: "自己紹介" },
  { num: 4, label: "基本情報①" },
  { num: 5, label: "基本情報②" },
  { num: 6, label: "緊急連絡先" },
  { num: 7, label: "競技登録" },
  { num: 8, label: "お支払い" },
] as const

export function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-4 flex items-center">
      {REGISTRATION_STEPS.map(({ num, label }, i) => (
        <Fragment key={num}>
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                num < current
                  ? "bg-[#005F8C]/20 text-[#005F8C]"
                  : num === current
                  ? "bg-[#005F8C] text-white shadow-md"
                  : "bg-[#dce3ea] text-[#64748b]"
              }`}
            >
              {num < current ? "✓" : num}
            </div>
            <p
              className={`mt-1 hidden text-xs sm:block ${
                num === current ? "font-medium text-[#005F8C]" : "text-[#64748b]"
              }`}
            >
              {label}
            </p>
          </div>
          {i < REGISTRATION_STEPS.length - 1 && (
            <div
              className={`mx-1 h-[2px] flex-1 transition-colors ${
                num < current ? "bg-[#005F8C]/30" : "bg-[#dce3ea]"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

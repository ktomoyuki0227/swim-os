import Link from "next/link"

/**
 * プロフィール写真(本人確認用)が未設定の既存ユーザーに向けた警告バナー。
 * 2026-08-04にオンボーディングでは任意化した経緯があるが、本人確認の観点から
 * 再度必須化したため、それ以前・任意期間に登録した既存ユーザーには
 * ログインをブロックせずこのバナーで設定を促す。
 */
export function AvatarWarningBanner() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#b8860b]/30 bg-[#fdf6e3] px-4 py-3">
      <p className="text-sm text-[#8a6d1a]">
        本人確認のため、ご本人の顔がわかるプロフィール写真の設定をお願いしています
      </p>
      <Link
        href="/profile"
        className="shrink-0 rounded-full bg-[#b8860b] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#9c7209]"
      >
        設定する
      </Link>
    </div>
  )
}

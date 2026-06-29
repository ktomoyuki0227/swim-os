import Image from "next/image"

export function PublicFooter() {
  return (
    <footer className="border-t border-[#dce3ea] bg-[#1a2332] py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={40} height={40} className="object-contain" />
          <Image src="/rangers-name-背景透過.png" alt="Rangers" width={110} height={30} className="object-contain" />
        </div>
        <p className="mb-6 text-sm leading-relaxed text-[#8d99a8]">
          マスターズ水泳グループのスケジュール管理・参加登録・会費管理をひとつのアプリで。
        </p>
        <div className="border-t border-white/10 pt-6 text-xs text-[#8d99a8]">
          © 2025 Rangers — Groove House
        </div>
      </div>
    </footer>
  )
}

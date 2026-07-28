import Image from "next/image"
import Link from "next/link"

const legalLinks = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/tokushoho", label: "特定商取引法に基づく表記" },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-[#dce3ea] bg-[#1a2332] py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/rangers-logo-背景透過.png" alt="Rangers logo" width={40} height={40} className="object-contain" />
          <Image src="/rangers-name-背景透過.png" alt="Rangers" width={90} height={30} className="object-contain" />
        </div>
        <p className="mb-6 text-sm leading-relaxed text-[#64748b]">
          マスターズ水泳グループのスケジュール管理・参加登録・会費管理をひとつのアプリで。
        </p>
        <nav className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#94a3b8]">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-[44px] py-2 hover:text-white hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-6 text-xs text-[#64748b]">
          © 2025 Rangers — Groove House
        </div>
      </div>
    </footer>
  )
}

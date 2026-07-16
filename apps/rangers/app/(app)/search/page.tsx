import Link from "next/link"

export default function SearchPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold text-[#1a2332]">探す</h1>

      {/* セッション - 全幅 */}
      <Link href="/search/sessions" className="block">
        <div
          className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg, #005F8C 0%, #003F62 100%)" }}
        >
          {/* SVG イラスト: 泳ぐ人 + 波 */}
          <svg
            className="absolute right-0 top-0 h-full w-auto"
            viewBox="0 0 200 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="130" cy="72" r="80" fill="rgba(255,255,255,0.05)" />
            <circle cx="148" cy="42" r="13" fill="rgba(255,255,255,0.22)" />
            <ellipse
              cx="118"
              cy="65"
              rx="30"
              ry="10"
              fill="rgba(255,255,255,0.18)"
              transform="rotate(-12 118 65)"
            />
            <path d="M82 62 Q106 50 130 58" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round" />
            <path d="M130 58 Q154 62 168 50" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
            <path d="M100 72 Q120 82 140 76 Q155 72 165 80" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            <path d="M20 100 Q50 90 80 100 Q110 110 140 100 Q165 92 190 100" stroke="rgba(255,255,255,0.28)" strokeWidth="3" strokeLinecap="round" />
            <path d="M0 114 Q35 105 65 114 Q95 123 125 114 Q155 105 185 114" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M10 127 Q45 120 75 127 Q105 134 135 127 Q160 120 190 127" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <div className="absolute bottom-0 left-0 p-5">
            <p className="text-xl font-bold tracking-tight text-white">セッション</p>
            <p className="mt-0.5 text-sm text-white/70">スイミングセッションを探す</p>
          </div>

          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* チーム + パーソナル - 同じ行・同じ高さ */}
      <div className="flex gap-3">
        {/* チーム */}
        <Link href="/search/teams" className="flex-1">
          <div
            className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
          >
            <svg
              className="absolute right-0 top-0 h-full w-auto"
              viewBox="0 0 130 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="80" cy="80" r="70" fill="rgba(255,255,255,0.05)" />
              <circle cx="35" cy="52" r="11" fill="rgba(255,255,255,0.2)" />
              <rect x="25" y="67" width="20" height="30" rx="6" fill="rgba(255,255,255,0.15)" />
              <line x1="25" y1="78" x2="12" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              <line x1="45" y1="78" x2="56" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="68" cy="44" r="13" fill="rgba(255,255,255,0.26)" />
              <rect x="56" y="61" width="24" height="34" rx="7" fill="rgba(255,255,255,0.2)" />
              <line x1="56" y1="74" x2="42" y2="66" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
              <line x1="80" y1="74" x2="94" y2="66" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="102" cy="52" r="11" fill="rgba(255,255,255,0.2)" />
              <rect x="92" y="67" width="20" height="30" rx="6" fill="rgba(255,255,255,0.15)" />
              <line x1="92" y1="78" x2="80" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              <line x1="112" y1="78" x2="124" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            <div className="absolute bottom-0 left-0 p-4">
              <p className="text-base font-bold text-white">チーム</p>
              <p className="mt-0.5 text-xs text-white/70">仲間と一緒に泳ぐ</p>
            </div>
          </div>
        </Link>

        {/* パーソナル */}
        <Link href="/search/personal" className="flex-1">
          <div
            className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
          >
            <svg
              className="absolute right-0 top-0 h-full w-auto"
              viewBox="0 0 130 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="80" cy="80" r="70" fill="rgba(255,255,255,0.05)" />
              <circle cx="80" cy="42" r="24" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="rgba(255,255,255,0.07)" />
              <line x1="80" y1="18" x2="80" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
              <line x1="74" y1="11" x2="86" y2="11" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="42" x2="80" y2="27" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="80" y1="42" x2="92" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="60" cy="82" r="12" fill="rgba(255,255,255,0.22)" />
              <rect x="49" y="97" width="22" height="32" rx="7" fill="rgba(255,255,255,0.17)" />
              <line x1="49" y1="109" x2="36" y2="101" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
              <line x1="71" y1="109" x2="84" y2="101" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            <div className="absolute bottom-0 left-0 p-4">
              <p className="text-base font-bold text-white">パーソナル</p>
              <p className="mt-0.5 text-xs text-white/70">個別指導を受ける</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

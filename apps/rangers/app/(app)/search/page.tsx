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
            <p className="mt-0.5 text-sm text-white/70">練習・合宿・大会・イベントを探す</p>
          </div>

          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* チーム */}
      <Link href="/search/teams" className="block">
        <div
          className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
        >
          <svg
            className="absolute right-0 top-0 h-full w-auto"
            viewBox="0 0 200 112"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="160" cy="56" r="80" fill="rgba(255,255,255,0.05)" />
            <circle cx="90" cy="40" r="13" fill="rgba(255,255,255,0.2)" />
            <rect x="78" y="57" width="24" height="34" rx="7" fill="rgba(255,255,255,0.15)" />
            <line x1="78" y1="70" x2="62" y2="62" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            <line x1="102" y1="70" x2="116" y2="62" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="130" cy="32" r="15" fill="rgba(255,255,255,0.26)" />
            <rect x="116" y="51" width="28" height="38" rx="8" fill="rgba(255,255,255,0.2)" />
            <line x1="116" y1="66" x2="100" y2="57" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
            <line x1="144" y1="66" x2="160" y2="57" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="168" cy="40" r="13" fill="rgba(255,255,255,0.2)" />
            <rect x="156" y="57" width="24" height="34" rx="7" fill="rgba(255,255,255,0.15)" />
            <line x1="156" y1="70" x2="144" y2="62" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            <line x1="180" y1="70" x2="194" y2="62" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
          </svg>

          <div className="absolute bottom-0 left-0 p-5">
            <p className="text-xl font-bold tracking-tight text-white">チーム</p>
            <p className="mt-0.5 text-sm text-white/70">仲間と一緒に泳ぐ</p>
          </div>

          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* パーソナル */}
      <Link href="/search/personal" className="block">
        <div
          className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
        >
          <svg
            className="absolute right-0 top-0 h-full w-auto"
            viewBox="0 0 200 112"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="160" cy="56" r="80" fill="rgba(255,255,255,0.05)" />
            <circle cx="140" cy="34" r="24" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="rgba(255,255,255,0.07)" />
            <line x1="140" y1="10" x2="140" y2="5" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
            <line x1="134" y1="3" x2="146" y2="3" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
            <line x1="140" y1="34" x2="140" y2="19" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="34" x2="152" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="110" cy="68" r="14" fill="rgba(255,255,255,0.22)" />
            <rect x="97" y="85" width="26" height="36" rx="8" fill="rgba(255,255,255,0.17)" />
            <line x1="97" y1="99" x2="82" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
            <line x1="123" y1="99" x2="138" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
          </svg>

          <div className="absolute bottom-0 left-0 p-5">
            <p className="text-xl font-bold tracking-tight text-white">パーソナル</p>
            <p className="mt-0.5 text-sm text-white/70">個別指導を受ける</p>
          </div>

          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  )
}

"use client"

type TeamType = "team" | "personal"

export function TypeSelectStep({ onSelect }: { onSelect: (type: TeamType) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#475569]">作成するグループの種別を選んでください。</p>
      <div className="grid grid-cols-2 gap-3">
        {/* チームカード */}
        <button
          type="button"
          onClick={() => onSelect("team")}
          className="flex flex-col items-center gap-4 rounded-[14px] border-2 border-[#dce3ea] bg-white p-5 text-center transition-all hover:border-[#005F8C] hover:shadow-[0_2px_8px_rgba(0,95,140,0.10)] active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#005F8C]/10">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-[#1a2332]">チーム</p>
            <p className="mt-1 text-xs leading-relaxed text-[#475569]">クラブや水泳チームなど複数メンバーで活動するグループ</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005F8C] text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>

        {/* パーソナルカード */}
        <button
          type="button"
          onClick={() => onSelect("personal")}
          className="flex flex-col items-center gap-4 rounded-[14px] border-2 border-[#dce3ea] bg-white p-5 text-center transition-all hover:border-[#0f8a4f] hover:shadow-[0_2px_8px_rgba(15,138,79,0.10)] active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0f8a4f]/10">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="8" r="4" />
              <path d="M4 20v-2a6 6 0 0 1 9.5-5.5" />
              <path d="M19.5 2.5 L21 5.5 L24 6.5 L21 7.5 L19.5 10.5 L18 7.5 L15 6.5 L18 5.5 Z" fill="#0f8a4f" stroke="none" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-[#1a2332]">パーソナル</p>
            <p className="mt-1 text-xs leading-relaxed text-[#475569]">コーチと生徒の1対1または少人数のプライベートレッスン</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f8a4f] text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}

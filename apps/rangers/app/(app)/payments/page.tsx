import { Card, CardContent } from "@/components/ui/card"

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a2332]">お支払い</h1>

      <Card className="border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#005F8C]/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="12" cy="15" r="1.5" fill="#005F8C" stroke="none" />
            </svg>
          </div>
          <p className="font-medium text-[#1a2332]">お支払い履歴</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">この機能は近日公開予定です</p>
        </CardContent>
      </Card>
    </div>
  )
}

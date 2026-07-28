"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusCardProps {
  isActive: boolean
  onChange: (next: boolean) => void
}

export function StatusCard({ isActive, onChange }: StatusCardProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1a2332]">グループのステータス</CardTitle>
        <p className="text-xs text-[#475569]">非アクティブにすると公開ページから非表示になります。</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-xl border border-[#dce3ea] p-3">
          <button
            type="button"
            onClick={() => onChange(!isActive)}
            className={`relative h-6 w-10 rounded-full transition-colors ${
              isActive ? "bg-[#005F8C]" : "bg-[#dce3ea]"
            }`}
            style={{ minHeight: "24px" }}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-[#1a2332]">
            {isActive ? "アクティブ" : "非アクティブ"}
          </span>
          <span className="ml-auto text-xs text-[#64748b]">
            {isActive ? "公開中" : "非公開"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { SYSTEM_TAGS } from "@/types/database"
import type { CompetitionField, FormData } from "./types"

const TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "試合",
  event: "イベント",
  meeting: "ミーティング",
}

interface StepConfirmProps {
  form: FormData
  competitionFields: CompetitionField[]
  selectedTags: string[]
  selectedMemberIds: string[]
  teamMembersCount: number
}

export function StepConfirm({ form, competitionFields, selectedTags, selectedMemberIds, teamMembersCount }: StepConfirmProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardContent className="space-y-5 pt-5">
        <p className="text-sm text-[#475569]">以下の内容でセッションを作成します。確認してください。</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">基本情報</p>
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">タイトル</span>
              <span className="font-medium text-[#1a2332]">{form.title}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">種類</span>
              <span className="text-[#1a2332]">{TYPE_LABELS[form.type] || form.type}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">{form.type === "camp" ? "開始日時" : "日時"}</span>
              <span className="text-[#1a2332]">{form.scheduled_at ? new Date(form.scheduled_at).toLocaleString("ja-JP") : "—"}</span>
            </div>
            {form.end_at && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">終了日時</span>
                <span className="text-[#1a2332]">{new Date(form.end_at).toLocaleString("ja-JP")}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">場所</span>
              <span className="text-[#1a2332]">{form.location}</span>
            </div>
            {form.meeting_point && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">待ち合わせ</span>
                <span className="text-[#1a2332]">{form.meeting_point}</span>
              </div>
            )}
            {form.gender_filter !== "all" && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">対象性別</span>
                <span className="text-[#1a2332]">{form.gender_filter === "male" ? "男性のみ" : "女性のみ"}</span>
              </div>
            )}
            {form.description && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">説明・メニュー</span>
                <span className="whitespace-pre-wrap text-[#1a2332]">{form.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">参加費</p>
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">メンバー</span>
              <span className="text-[#1a2332]">¥{parseInt(form.member_price || "0").toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">ゲスト</span>
              <span className="text-[#1a2332]">¥{parseInt(form.guest_price || "0").toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">回数券</span>
              <span className="text-[#1a2332]">{form.allow_point_card ? "利用可" : "利用不可"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">詳細設定</p>
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
            {form.registration_deadline && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">申込締切</span>
                <span className="text-[#1a2332]">{new Date(form.registration_deadline).toLocaleDateString("ja-JP")}</span>
              </div>
            )}
            {form.min_participants && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">最低人数</span>
                <span className="text-[#1a2332]">{form.min_participants}人</span>
              </div>
            )}
            {form.max_participants && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">定員</span>
                <span className="text-[#1a2332]">{form.max_participants}人</span>
              </div>
            )}
            {form.cancellation_days && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">キャンセル期限</span>
                <span className="text-[#1a2332]">{form.cancellation_days}日前まで</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">外部公開</span>
              <span className="text-[#1a2332]">{form.is_external ? "あり" : "なし"}</span>
            </div>
          </div>
        </div>

        {form.type === "competition" && competitionFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">エントリー項目</p>
            <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-1.5">
              {competitionFields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#1a2332]">{f.label || "（未入力）"}</span>
                  {f.required && (
                    <span className="rounded-full bg-[#fdecea] px-1.5 py-0.5 text-xs font-medium text-[#c0392b]">必須</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">配信対象</p>
          <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-sm space-y-2">
            {selectedTags.length > 0 && (
              <div className="flex gap-2">
                <span className="w-24 shrink-0 text-[#64748b]">タグ絞込</span>
                <span className="text-[#1a2332]">
                  {selectedTags.map((t) => SYSTEM_TAGS.find((s) => s.id === t)?.label || t).join("、")}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-[#64748b]">選択人数</span>
              <span className="text-[#1a2332]">
                {selectedMemberIds.length === teamMembersCount
                  ? `全メンバー（${teamMembersCount}人）`
                  : `${selectedMemberIds.length}人を選択`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface StripeConnectSectionProps {
  stripeAccountId: string | null
  stripeOnboardingCompleted: boolean
  isConnecting: boolean
  onConnect: () => void
}

/** チーム編集フォームのStripe Connect(売上受取設定)カード。Stripe設定済み時のみ表示される */
export function StripeConnectSection({
  stripeAccountId,
  stripeOnboardingCompleted,
  isConnecting,
  onConnect,
}: StripeConnectSectionProps) {
  return (
    <Card className="border-[#dce3ea]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1a2332]">
          Stripe Connect（売上受取設定）
        </CardTitle>
        <p className="text-xs text-[#475569]">
          セッション参加費の売上をこのグループの Stripe アカウントに自動送金します。設定するとプラットフォーム手数料を差し引いた金額がグループに入金されます。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dce3ea] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-lg">
              💳
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a2332]">Connect ステータス</p>
              <div className="mt-0.5">
                {stripeOnboardingCompleted ? (
                  <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent">設定完了</Badge>
                ) : stripeAccountId ? (
                  <Badge className="bg-[#fdf6e3] text-[#b8860b] border-transparent">審査・設定中</Badge>
                ) : (
                  <Badge className="bg-[#edf0f4] text-[#475569] border-transparent">未設定</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            variant={stripeOnboardingCompleted ? "outline" : "default"}
            className={
              stripeOnboardingCompleted
                ? "rounded-full border-[#dce3ea] text-[#475569] shrink-0"
                : "rounded-full bg-[#005F8C] hover:bg-[#004E73] shrink-0"
            }
            style={{ minHeight: "44px" }}
          >
            {isConnecting
              ? "移動中..."
              : stripeAccountId
              ? "設定を続ける"
              : "設定を開始"}
          </Button>
        </div>
        {stripeOnboardingCompleted && (
          <p className="text-xs text-[#64748b]">
            Stripe ダッシュボードから売上・入金状況を確認できます。設定を変更する場合は「設定を続ける」から Stripe 管理画面にアクセスしてください。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

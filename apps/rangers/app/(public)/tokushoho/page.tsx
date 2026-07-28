import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "特定商取引法に基づく表記です。",
}

/**
 * TODO: 依頼企業から事業者名・所在地・連絡先を受領後、rows の値を実データに差し替えること。
 * このプレースホルダーのままでのリリースは不可(特定商取引法上の表示義務違反)。
 */
const rows: { label: string; value: string }[] = [
  { label: "販売事業者", value: "［依頼企業からの受領後に記載］" },
  { label: "運営統括責任者", value: "［依頼企業からの受領後に記載］" },
  { label: "所在地", value: "ご請求をいただいた場合には、遅滞なく開示いたします。" },
  { label: "電話番号", value: "ご請求をいただいた場合には、遅滞なく開示いたします。" },
  { label: "メールアドレス", value: "［依頼企業からの受領後に記載］" },
  { label: "URL", value: "［依頼企業からの受領後に記載］" },
  {
    label: "販売価格",
    value: "各チームが設定するセッション参加費・年会費・月謝・回数券代金は、それぞれの案内画面に表示された金額とします。",
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続料金、通信料金等はお客様のご負担となります。",
  },
  {
    label: "お支払い方法",
    value: "クレジットカード決済（Stripeを通じたVISA・Mastercard・JCB・American Express・Diners Club等）、または各チームが指定する方法（現金等）",
  },
  {
    label: "お支払い時期",
    value: "クレジットカード決済の場合、セッション開催確定時または申込時に決済が実行されます。詳細は各チームの案内をご確認ください。",
  },
  {
    label: "サービス提供時期",
    value: "決済完了後、直ちに本サービスをご利用いただけます。",
  },
  {
    label: "返品・キャンセルについて",
    value: "各チームが定めるキャンセルポリシーに従います。詳細はセッション詳細ページまたはチームの案内をご確認ください。",
  },
  {
    label: "動作環境",
    value: "最新版のGoogle Chrome、Safari、Microsoft Edge、Firefoxを推奨します。",
  },
]

export default function TokushohoPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">Legal Notice</p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">特定商取引法に基づく表記</h1>
          <p className="text-sm text-[#64748b]">最終改定日: 2026年7月28日</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[#dce3ea] bg-white">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex flex-col gap-1 px-6 py-5 sm:flex-row sm:gap-6 ${
                i !== rows.length - 1 ? "border-b border-[#e8edf2]" : ""
              }`}
            >
              <div className="w-full shrink-0 text-sm font-semibold text-[#475569] sm:w-40">{row.label}</div>
              <div className="flex-1 text-[15px] leading-relaxed text-[#1a2332]">{row.value}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-[#64748b]">
          事業者情報の未確定項目は仮表記です。運営事業者からの情報受領後、速やかに正式な内容へ更新します。
        </p>
      </div>
    </div>
  )
}

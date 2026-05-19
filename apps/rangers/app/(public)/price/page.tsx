import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "料金について",
  description: "Rangers の料金体系。入会金・月会費不要。受けたレッスン分だけお支払い。",
}

export default function PricePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold">シンプルな料金体系</h1>
        <p className="text-muted-foreground">
          入会金・月会費は一切不要。受けたレッスン分だけお支払い。
        </p>
      </div>

      {/* 無料要素 */}
      <div className="mb-10 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl font-bold text-blue-500">¥0</div>
        <h2 className="mb-2 text-xl font-bold">入会金・月会費</h2>
        <p className="mb-6 text-muted-foreground">アカウント作成から利用まで追加費用なし</p>
        <ul className="mx-auto mb-6 max-w-xs space-y-2 text-sm">
          {[
            "アカウント登録：無料",
            "コーチ検索：無料",
            "メッセージ・相談：無料",
            "月会費：無料",
            "解約費用：無料",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-left">
              <Check className="h-4 w-4 shrink-0 text-green-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* レッスン料金 */}
      <div className="mb-10 rounded-2xl border bg-card p-8">
        <h2 className="mb-6 text-xl font-bold">レッスン料金</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          レッスン料金はコーチによって異なります。
          各レッスンの詳細ページで料金をご確認いただき、ご予約ください。
        </p>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">形式</th>
                <th className="px-4 py-3 text-left font-medium">目安</th>
                <th className="px-4 py-3 text-left font-medium">特徴</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-medium">個人指導</td>
                <td className="px-4 py-3 text-muted-foreground">¥5,000〜¥20,000 / 回</td>
                <td className="px-4 py-3 text-muted-foreground">コーチとマンツーマン</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">グループレッスン</td>
                <td className="px-4 py-3 text-muted-foreground">¥2,000〜¥8,000 / 回</td>
                <td className="px-4 py-3 text-muted-foreground">複数名参加、リーズナブル</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          ※ 料金はコーチ・レッスン内容・地域によって異なります
        </p>
      </div>

      {/* 決済 */}
      <div className="mb-10 rounded-2xl border bg-card p-8">
        <h2 className="mb-4 text-xl font-bold">お支払い方法</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          クレジットカードでのオンライン決済のみ対応しています。
          予約時にカード情報を入力していただきます。
        </p>
        <div className="flex flex-wrap gap-2">
          {["VISA", "Mastercard", "JCB", "American Express", "Diners Club"].map((brand) => (
            <span
              key={brand}
              className="rounded-lg border bg-muted px-3 py-1.5 text-sm font-medium"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/instructors">
          <Button size="lg" className="bg-blue-500 px-10 hover:bg-blue-600">
            コーチを探して予約する
          </Button>
        </Link>
      </div>
    </div>
  )
}

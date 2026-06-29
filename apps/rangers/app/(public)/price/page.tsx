import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "料金について",
  description: "Rangers の料金体系。入会金・月会費不要。受けたレッスン分だけお支払い。",
}

const freeItems = [
  "アカウント登録：無料",
  "コーチ検索：無料",
  "メッセージ・相談：無料",
  "月会費：無料",
  "解約費用：無料",
]

const lessonTypes = [
  {
    type: "個人指導",
    price: "¥5,000〜¥20,000 / 回",
    note: "コーチとマンツーマン",
    featured: true,
  },
  {
    type: "グループレッスン",
    price: "¥2,000〜¥8,000 / 回",
    note: "複数名参加、リーズナブル",
    featured: false,
  },
]

const cardBrands = ["VISA", "Mastercard", "JCB", "American Express", "Diners Club"]

export default function PricePage() {
  return (
    <div>
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            Pricing
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            シンプルな料金体系
          </h1>
          <p className="text-lg text-[#5c6a7a]">
            入会金・月会費は一切不要。受けたレッスン分だけお支払い。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* 無料バッジ */}
        <div className="mb-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-[#005F8C] px-8 py-6 text-center text-white">
            <div className="mb-1 text-6xl font-bold">¥0</div>
            <div className="text-lg font-semibold">入会金・月会費</div>
          </div>
          <div className="px-8 py-6">
            <p className="mb-6 text-center text-[#5c6a7a]">
              アカウント作成から利用まで追加費用なし
            </p>
            <ul className="mx-auto max-w-xs space-y-3">
              {freeItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eaf7f0] text-xs font-bold text-[#0f8a4f]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* レッスン料金 */}
        <div className="mb-8 rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">レッスン料金</h2>
          <p className="mb-6 text-sm leading-relaxed text-[#5c6a7a]">
            レッスン料金はコーチによって異なります。
            各レッスンの詳細ページで料金をご確認いただき、ご予約ください。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {lessonTypes.map(({ type, price, note, featured }) => (
              <div
                key={type}
                className={`rounded-xl border p-5 ${
                  featured
                    ? "border-[#005F8C]/20 bg-[#005F8C]/[0.08]"
                    : "border-border bg-[#f2f7fa]/30"
                }`}
              >
                <div
                  className={`mb-1 text-xs font-semibold uppercase tracking-wider ${
                    featured ? "text-[#005F8C]" : "text-[#5c6a7a]"
                  }`}
                >
                  {type}
                </div>
                <div className={`mb-1 text-2xl font-bold ${featured ? "text-[#005F8C]" : ""}`}>
                  {price}
                </div>
                <div className="text-sm text-[#5c6a7a]">{note}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#5c6a7a]">
            ※ 料金はコーチ・レッスン内容・地域によって異なります
          </p>
        </div>

        {/* 決済方法 */}
        <div className="mb-12 rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">お支払い方法</h2>
          <p className="mb-5 text-sm leading-relaxed text-[#5c6a7a]">
            クレジットカードでのオンライン決済のみ対応しています。
            予約時にカード情報を入力していただきます。
          </p>
          <div className="flex flex-wrap gap-2">
            {cardBrands.map((brand) => (
              <span
                key={brand}
                className="rounded-lg border bg-[#f2f7fa] px-3 py-1.5 text-sm font-medium"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/register">
            <Button size="lg" className="bg-[#005F8C] px-12 hover:bg-[#004E73]">
              無料で登録する
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

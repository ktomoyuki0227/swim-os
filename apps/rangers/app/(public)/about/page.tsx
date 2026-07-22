import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "ご利用ガイド",
  description: "Rangers はトップアスリートによるマンツーマン水泳指導を提供するプラットフォームです。",
}

const features = [
  {
    img: "/images/lp/icons/icon-elite-coach.jpg",
    title: "厳選されたコーチ陣",
    description:
      "元日本代表・オリンピック経験者・競技歴豊富なコーチのみ在籍。実績と指導力を厳格に審査します。",
  },
  {
    img: "/images/lp/icons/icon-individual-coaching.jpg",
    title: "マンツーマン指導",
    description:
      "あなただけのレッスン。コーチがあなたの目標・レベルに合わせてカリキュラムをカスタマイズします。",
  },
  {
    img: "/images/lp/icons/icon-location.jpg",
    title: "好きな場所・施設で",
    description:
      "近くのプールや水泳施設など、あなたが指定した場所でレッスンを受けられます。",
  },
  {
    img: "/images/lp/icons/icon-flexible-schedule.jpg",
    title: "好きな時間に予約",
    description:
      "コーチのカレンダーから空き日程を選んで予約。都合の合わない場合は日程リクエストも可能です。",
  },
  {
    img: "/images/lp/icons/icon-payment.jpg",
    title: "安心のオンライン決済",
    description:
      "入会金・月会費は一切不要。受けたレッスン分だけお支払い。Stripeによる安全な決済。",
  },
  {
    img: "/images/lp/icons/icon-safety.jpg",
    title: "安全・安心のサポート",
    description:
      "コーチの身元確認・保険加入。個人情報の適切な管理。いつでもサポートグループに相談可能。",
  },
]

const steps = [
  { step: 1, title: "無料会員登録", desc: "メールアドレスとパスワードで簡単登録" },
  { step: 2, title: "コーチを選ぶ", desc: "種目・地域・口コミからコーチを検索" },
  { step: 3, title: "日程・場所を決める", desc: "カレンダーから予約または日程リクエスト" },
  { step: 4, title: "レッスン開始", desc: "当日コーチと合流してレッスン！" },
]

export default function AboutPage() {
  return (
    <div>
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            How it works
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            水泳の個別指導を、
            <br />
            もっと身近に。
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#475569]">
            Rangers は元日本代表・競技経験豊富なコーチによる
            マンツーマン水泳指導のプラットフォームです。
            あなたのペースで、好きな場所・好きな時間に上達できます。
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-[#005F8C] hover:bg-[#004E73]">
                無料で登録する
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                無料で登録
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6つの特徴 */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            Features
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Rangers の6つの特徴
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ img, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 h-14 w-14 overflow-hidden rounded-xl">
                  <Image
                    src={img}
                    alt={title}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-[#475569]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 利用の流れ */}
      <section className="bg-sky-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            How to start
          </p>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight">利用の流れ</h2>

          {/* デスクトップ: 横並び + 矢印 */}
          <div className="hidden sm:flex sm:items-start sm:gap-0">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="flex flex-1 items-start">
                <div className="flex-1 text-center">
                  <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C] text-xl font-bold text-white shadow-md shadow-[#005F8C]/20">
                    {step}
                  </div>
                  <h3 className="mb-1.5 font-semibold">{title}</h3>
                  <p className="mx-auto max-w-[120px] text-sm leading-relaxed text-[#475569]">
                    {desc}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="relative mt-6 flex w-8 shrink-0 items-center justify-center">
                    <div
                      className="step-arrow h-[2px] w-full bg-[#005F8C]/30"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    />
                    <div
                      className="step-arrowhead absolute right-0 h-0 w-0"
                      style={{
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: "7px solid #5BC0EB",
                        animationDelay: `${i * 0.3 + 0.2}s`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* モバイル: 縦並び + 下矢印 */}
          <div className="flex flex-col gap-0 sm:hidden">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="flex w-full max-w-xs items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#005F8C] text-lg font-bold text-white shadow-md shadow-[#005F8C]/20">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-[#475569]">{desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex h-10 w-px flex-col items-center justify-center">
                    <div className="h-6 w-px bg-[#005F8C]/30" />
                    <div
                      className="h-0 w-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "7px solid #5BC0EB",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="mb-3 text-2xl font-bold">さっそく始めましょう</h2>
          <p className="mb-8 text-[#475569]">入会金・月会費は一切かかりません</p>
          <Link href="/register">
            <Button size="lg" className="bg-[#005F8C] px-12 hover:bg-[#004E73]">
              無料で始める
            </Button>
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes growRight {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .step-arrow {
          animation: growRight 0.5s ease-out forwards;
          transform-origin: left;
        }
        .step-arrowhead {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

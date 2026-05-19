import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Star, Users, Clock, CreditCard, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Rangers とは",
  description: "Rangers はトップアスリートによるマンツーマン水泳指導を提供するプラットフォームです。",
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* ヒーロー */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold leading-tight">
          マスターズ水泳指導を、
          <br />
          もっと身近に。
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Rangers は元日本代表・競技経験豊富なコーチによる
          マンツーマン水泳指導のプラットフォームです。
          あなたのペースで、好きな場所・好きな時間に上達できます。
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/instructors">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
              コーチを探す
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              無料で登録
            </Button>
          </Link>
        </div>
      </div>

      {/* 6つの特徴 */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">Rangers の6つの特徴</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <FeatureItem
            icon={<Star className="h-6 w-6" />}
            title="厳選されたコーチ陣"
            description="元日本代表・オリンピック経験者・競技歴豊富なコーチのみ在籍。実績と指導力を厳格に審査します。"
          />
          <FeatureItem
            icon={<Users className="h-6 w-6" />}
            title="マンツーマン指導"
            description="あなただけのレッスン。コーチがあなたの目標・レベルに合わせてカリキュラムをカスタマイズします。"
          />
          <FeatureItem
            icon={<MapPin className="h-6 w-6" />}
            title="好きな場所・施設で"
            description="近くのプールや水泳施設など、あなたが指定した場所でレッスンを受けられます。"
          />
          <FeatureItem
            icon={<Clock className="h-6 w-6" />}
            title="好きな時間に予約"
            description="コーチのカレンダーから空き日程を選んで予約。都合の合わない場合は日程リクエストも可能です。"
          />
          <FeatureItem
            icon={<CreditCard className="h-6 w-6" />}
            title="安心のオンライン決済"
            description="入会金・月会費は一切不要。受けたレッスン分だけお支払い。Stripeによる安全な決済。"
          />
          <FeatureItem
            icon={<Shield className="h-6 w-6" />}
            title="安全・安心のサポート"
            description="コーチの身元確認・保険加入。個人情報の適切な管理。いつでもサポートチームに相談可能。"
          />
        </div>
      </section>

      {/* 利用の流れ */}
      <section className="mb-16 rounded-2xl bg-muted/50 p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">利用の流れ</h2>
        <div className="grid gap-6 sm:grid-cols-4">
          {[
            { step: 1, title: "無料会員登録", desc: "メールアドレスとパスワードで簡単登録" },
            { step: 2, title: "コーチを選ぶ", desc: "種目・地域・口コミからコーチを検索" },
            { step: 3, title: "日程・場所を決める", desc: "カレンダーから予約または日程リクエスト" },
            { step: 4, title: "レッスン開始", desc: "当日コーチと合流してレッスン！" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                {step}
              </div>
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <h2 className="mb-3 text-2xl font-bold">さっそく始めましょう</h2>
        <p className="mb-6 text-muted-foreground">入会金・月会費は一切かかりません</p>
        <Link href="/register">
          <Button size="lg" className="bg-blue-500 px-10 hover:bg-blue-600">
            無料で始める
          </Button>
        </Link>
      </div>
    </div>
  )
}

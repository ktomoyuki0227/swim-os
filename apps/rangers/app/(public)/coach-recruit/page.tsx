import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "コーチ登録について",
  description: "マスターズ水泳グループのコーチとして Rangers に登録しませんか。あなたの指導経験を活かして、会員の技術向上をサポートしましょう。",
}

const benefits = [
  {
    num: "01",
    title: "グループの会員さんに寄り添う指導",
    desc: "既存の会員さんとの信頼関係を活かして、個別指導でさらに深いサポートができます。",
  },
  {
    num: "02",
    title: "スケジュールを自分で管理",
    desc: "空き時間にレッスンを設定できます。グループの練習スケジュールと柔軟に組み合わせられます。",
  },
  {
    num: "03",
    title: "シンプルな報酬体系",
    desc: "入会金・月会費不要。レッスン料金から手数料を差し引いた金額が振り込まれます。",
  },
  {
    num: "04",
    title: "サポート体制が充実",
    desc: "運営グループがプロフィール作成から予約管理まで丁寧にサポートします。",
  },
]

const steps = [
  { step: 1, title: "アカウント登録", desc: "メールアドレスで無料登録。「指導員」を選択してください。" },
  { step: 2, title: "プロフィール入力", desc: "経歴・得意種目・活動地域・料金などを設定します。" },
  { step: 3, title: "審査・承認", desc: "Rangers 運営グループが経歴・実績を確認します（1〜3営業日）。" },
  { step: 4, title: "レッスン公開", desc: "承認後すぐにレッスンを公開してコーチ活動を開始できます！" },
]

const requirements = [
  "水泳指導の実務経験があること",
  "本人確認書類の提出に同意できること",
  "レッスン中の写真・動画掲載に同意できること",
  "Rangers の利用規約・行動指針に同意できること",
]

export default function CoachRecruitPage() {
  return (
    <div>
      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-sky-900">
        <Image
          src="/images/lp/coach-recruit-hero.jpg"
          alt="コーチ募集"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-white">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-300">
            For Coaches
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-tight sm:text-5xl">
            マスターズグループを持つ
            <br />
            あなたへ。
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-sky-100">
            Rangers は、マスターズ水泳グループの指導者・コーチを対象にした
            個別レッスン予約プラットフォームです。
            グループの会員さんにさらに深く寄り添う指導の場を提供します。
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-[#005F8C] px-10 hover:bg-[#004E73]">
              コーチとして登録する
            </Button>
          </Link>
        </div>
      </section>

      {/* Rangers の特徴 */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            Why Rangers
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Rangers でコーチ活動するメリット
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map(({ num, title, desc }) => (
              <div
                key={num}
                className="rounded-2xl border bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 text-4xl font-bold text-[#005F8C]/20">{num}</div>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-[#5c6a7a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 登録の流れ */}
      <section className="bg-sky-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            Registration
          </p>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight">登録の流れ</h2>

          {/* デスクトップ */}
          <div className="hidden sm:flex sm:items-start sm:gap-0">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="flex flex-1 items-start">
                <div className="flex-1 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C] text-xl font-bold text-white shadow-md shadow-[#005F8C]/20">
                    {step}
                  </div>
                  <h3 className="mb-1.5 font-semibold">{title}</h3>
                  <p className="mx-auto max-w-[130px] text-xs leading-relaxed text-[#5c6a7a]">
                    {desc}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="relative mt-6 flex w-8 shrink-0 items-center justify-center">
                    <div className="h-[2px] w-full bg-[#005F8C]/30" />
                    <div
                      className="absolute right-0 h-0 w-0"
                      style={{
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: "7px solid #5BC0EB",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* モバイル */}
          <div className="flex flex-col gap-0 sm:hidden">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="flex w-full max-w-xs items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#005F8C] text-lg font-bold text-white">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs leading-relaxed text-[#5c6a7a]">{desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex h-10 flex-col items-center justify-center">
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

      {/* 登録要件 */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            Requirements
          </p>
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">登録要件</h2>
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <ul className="space-y-4">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-bold text-[#005F8C]">
                    ✓
                  </span>
                  {req}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[#5c6a7a]">
              ※ 審査の結果、登録をお断りする場合があります。あらかじめご了承ください。
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#005F8C] py-20 text-center text-white">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="mb-3 text-2xl font-bold">まずは無料で登録しましょう</h2>
          <p className="mb-8 text-[#f7f9fb]">
            登録・審査は無料です。審査通過後にレッスンを公開できます。
          </p>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent px-12 text-white hover:bg-white hover:text-[#005F8C]"
            >
              コーチとして登録する
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

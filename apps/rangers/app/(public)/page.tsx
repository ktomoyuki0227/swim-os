import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: publicSessionsRaw } = await supabase
    .from("practice_sessions")
    .select("*, team:teams(id, name)")
    .eq("is_external", true)
    .eq("session_status", "open")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5)

  const publicSessions = (publicSessionsRaw ?? []) as Record<string, unknown>[]

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[600px] sm:min-h-[680px] flex items-center bg-[#1a2332]">
        {/* Full-bleed video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero-bg.mp4"
          poster="/hero-bg.jpg"
        />
        {/* Extra vignette to ensure left text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/70 via-[#1a2332]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/50 via-transparent to-transparent" />

        <div className="relative w-full px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-xl">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#005F8C]/40 bg-[#005F8C]/20 px-3 py-1 text-xs font-medium text-[#5BC0EB]">
                マスターズ水泳チーム専用
              </span>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                チーム運営を、
                <br />
                <span className="text-[#5BC0EB]">もっとスマートに。</span>
              </h1>
              <p className="mb-8 text-base leading-relaxed text-slate-300 sm:text-lg">
                LINE一斉配信・Excel管理・現金集金——
                <br />
                マスターズ水泳チームの運営課題をまとめて解決。
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-[#06C755] px-8 py-4 text-base font-bold text-white hover:bg-[#05b04c] sm:w-auto"
                    style={{ minHeight: "52px" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    LINEで無料スタート
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-white/30 px-8 text-white backdrop-blur-sm hover:bg-white/10 sm:w-auto"
                    style={{ minHeight: "52px" }}
                  >
                    機能を見る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 課題提起 ===== */}
      <section className="bg-[#f2f7fa] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">
              こんな運営の悩み、ありませんか？
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8614D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                title: "LINE で10回に分けて配信",
                desc: "練習日程、人数確認、場所変更……毎回LINEグループに送るのが面倒。誰が読んだかも分からない。",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8614D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                ),
                title: "Excel で参加者管理",
                desc: "誰が来るか、何コース必要か、毎回手作業で集計。ファイルが古いまま使われていることも。",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8614D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                ),
                title: "現金集金が大変",
                desc: "月謝や会費の払い忘れ、誰が払ったか管理が煩雑。お金の話をするのが気まずい。",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-[#E8614D]/20 bg-white p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8614D]/10">
                  {icon}
                </div>
                <h3 className="mb-2 font-bold text-[#1a2332]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#5c6a7a]">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-base font-medium text-[#1a2332]">
            <Image src="/rangers-name-背景透過.png" alt="Rangers" width={100} height={28} className="object-contain" />
            はこれらをまとめて解決します。
          </p>
        </div>
      </section>

      {/* ===== 機能紹介 ===== */}
      <section id="features" className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-[#1a2332] sm:text-3xl">
              <Image src="/rangers-name-背景透過.png" alt="Rangers" width={120} height={32} className="object-contain" />
              でできること
            </h2>
            <p className="mt-2 text-sm text-[#5c6a7a]">チーム運営に必要な機能をひとつのアプリに</p>
          </div>

          {/* App mockup visual */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <Image
                src="/app-mockup.jpg"
                alt="Rangers アプリ画面"
                width={280}
                height={373}
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-[#005F8C]/20 to-transparent blur-xl" />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {[
              {
                color: "#005F8C",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
                title: "セッション配信・参加登録",
                desc: "練習日程をアプリで配信。メンバーはタップひとつで参加登録。誰が来るか一目で分かります。",
                points: ["タグで対象メンバーを絞り込み", "締め切り・最少人数を設定", "開催確定・中止を一括通知"],
              },
              {
                color: "#0f8a4f",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                title: "チーム・メンバー管理",
                desc: "招待リンクを共有するだけで簡単参加。メンバーのレベル・種目タグで配信対象を選べます。",
                points: ["招待リンク / QR コードで参加", "メンバーのタグ管理", "コース判定（人数→コース数）自動計算"],
              },
              {
                color: "#7B5EA7",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <circle cx="12" cy="15" r="1.5" fill="white" stroke="none" />
                  </svg>
                ),
                title: "会費・月謝管理",
                desc: "年会費・月謝の支払い状況を一覧で確認。現金払いの記録もアプリで管理できます。",
                points: ["全メンバー分を一括生成", "支払い済み / 未払いを記録", "オンライン決済（Stripe）にも対応予定"],
              },
              {
                color: "#E8614D",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                title: "お知らせ・LINE通知",
                desc: "練習の確定・中止・お知らせをアプリ通知 + LINEでメンバーに届けます。",
                points: ["アプリ内通知（未読バッジ）", "セッション確定・中止を即通知", "LINE連携（ベータ）"],
              },
            ].map(({ color, icon, title, desc, points }) => (
              <div key={title} className="rounded-2xl border border-[#dce3ea] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: color }}
                  >
                    {icon}
                  </div>
                  <h3 className="font-bold text-[#1a2332]">{title}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-[#5c6a7a]">{desc}</p>
                <ul className="space-y-1">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-[#5c6a7a]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 公開セッション ===== */}
      {publicSessions.length > 0 && (
        <section className="bg-[#f2f7fa] px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">参加できるマスターズ練習</h2>
              <p className="mt-1 text-sm text-[#5c6a7a]">
                チームに参加しなくても、単発でゲスト参加できるセッション
              </p>
            </div>
            <div className="space-y-3">
              {publicSessions.map((session) => {
                const team = session.team as { id: string; name: string } | null
                const scheduledAt = new Date(session.scheduled_at as string)
                return (
                  <Link key={session.id as string} href="/login">
                    <div className="flex items-center gap-4 rounded-2xl border border-[#dce3ea] bg-white p-4 transition hover:border-[#005F8C]">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2 text-center">
                        <span className="text-[10px] font-medium text-[#005F8C]">
                          {scheduledAt.toLocaleDateString("ja-JP", { month: "short" })}
                        </span>
                        <span className="text-xl font-bold leading-tight text-[#005F8C]">
                          {scheduledAt.getDate()}
                        </span>
                        <span className="text-[10px] text-[#005F8C]">
                          {scheduledAt.toLocaleDateString("ja-JP", { weekday: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                        <p className="text-xs text-[#5c6a7a]">
                          {scheduledAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          {session.location ? ` · ${session.location as string}` : ""}
                          {team ? ` · ${team.name}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#005F8C]">
                          ¥{((session.guest_price as number) || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[#8d99a8]">ゲスト参加</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/login">
                <Button className="rounded-full bg-[#005F8C] px-8 hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
                  ログインして参加する
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== フロー ===== */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">3ステップで始められる</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "LINEでログイン",
                desc: "LINEアカウントで即スタート。メール登録不要、パスワード不要。",
              },
              {
                step: "02",
                title: "チームを作成",
                desc: "チーム名を入力するだけで完成。招待リンクをLINEグループにシェア。",
              },
              {
                step: "03",
                title: "セッションを配信",
                desc: "練習日程を作成して配信。メンバーはタップで参加登録できます。",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#005F8C]/10">
                  <span className="text-2xl font-bold text-[#005F8C]">{step}</span>
                </div>
                <h3 className="mb-2 font-bold text-[#1a2332]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#5c6a7a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#1a2332] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            マスターズ水泳チームの
            <br />
            運営をアップデートしよう
          </h2>
          <p className="mb-8 text-slate-400">
            無料でスタート。クレジットカード不要。
          </p>
          <Link href="/login">
            <button
              className="flex mx-auto items-center justify-center gap-3 rounded-full bg-[#06C755] px-10 py-4 text-base font-bold text-white transition-colors hover:bg-[#05b04c]"
              style={{ minHeight: "56px" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEで無料スタート
            </button>
          </Link>
          <p className="mt-4 text-xs text-slate-500">
            デモ用のメールログインは
            <Link href="/login" className="ml-1 text-slate-400 hover:text-white underline">
              ログインページ
            </Link>
            から
          </p>
        </div>
      </section>
    </>
  )
}

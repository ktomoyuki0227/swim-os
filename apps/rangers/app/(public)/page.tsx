import Image from "next/image"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/types/database"

export default async function HomePage() {
  const admin = createAdminClient()

  // ===== 人気グループ =====
  const { data: teamsRaw } = await admin
    .from("teams")
    .select("id, name, description, avatar_url")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5)

  const teams = (teamsRaw ?? []) as { id: string; name: string; description: string | null; avatar_url: string | null }[]

  // ===== 人気コーチ =====
  const { data: adminMemberships } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("role", "admin")
    .eq("status", "active")

  const coachIds = [...new Set((adminMemberships ?? []).map((m: { swimmer_id: string }) => m.swimmer_id))].slice(0, 8)

  let coaches: Profile[] = []
  if (coachIds.length > 0) {
    const { data: coachData } = await admin
      .from("profiles")
      .select("id, name, avatar_url, bio, specialties, prefectures")
      .in("id", coachIds)
      .order("review_count", { ascending: false })
      .limit(4)
    coaches = (coachData ?? []) as Profile[]

    // コーチの自己紹介は「パーソナル」チーム(teams.bio)に一元化されているため
    // (00067_personal_team_fields.sql)、表示があればprofiles.bioより優先する。
    // 未設定のコーチはprofiles.bio(オンボーディング時の自己紹介)にフォールバックする。
    if (coaches.length > 0) {
      const { data: personalTeams } = await admin
        .from("teams")
        .select("coach_id, bio")
        .in("coach_id", coaches.map((c) => c.id))
        .eq("team_type", "personal")
        .eq("status", "active")
      const bioByCoachId = new Map((personalTeams ?? []).map((t) => [t.coach_id, t.bio]))
      coaches = coaches.map((c) => ({ ...c, bio: bioByCoachId.get(c.id) || c.bio }))
    }
  }

  // ===== 新着イベント・合宿 =====
  const { data: eventsRaw } = await admin
    .from("practice_sessions")
    .select("id, title, type, scheduled_at, location, guest_price, team:teams(id, name)")
    .eq("is_external", true)
    .eq("session_status", "open")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5)

  const events = (eventsRaw ?? []) as Record<string, unknown>[]

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[620px] sm:min-h-[700px] flex items-center bg-[#1a2332]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero-bg.mp4"
          poster="/hero-bg.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/75 via-[#1a2332]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/60 via-transparent to-transparent" />

        <div className="relative w-full px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#5BC0EB]/40 bg-[#5BC0EB]/15 px-4 py-1.5 text-xs font-medium text-[#5BC0EB]">
                水泳×テクノロジーで、泳ぐ人をつなぐ
              </span>
              <h1 className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-[3.5rem]">
                水泳のすべてが、<br />
                <span className="text-[#5BC0EB]">ここにある。</span>
              </h1>
              <p className="mb-8 text-base leading-relaxed text-slate-300 sm:text-lg max-w-xl">
                グループ、パーソナルレッスン、合宿、イベント。<br className="hidden sm:block" />
                水泳に関わる人と機会をつなぐプラットフォーム。
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-[#005F8C] px-8 text-base font-bold text-white hover:bg-[#004E73] sm:w-auto"
                    style={{ minHeight: "52px" }}
                  >
                    無料会員登録
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-2 border-white bg-transparent px-8 text-white backdrop-blur-sm hover:bg-white hover:text-[#005F8C] sm:w-auto"
                    style={{ minHeight: "52px" }}
                  >
                    グループ・コーチ登録
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== できること ===== */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">Rangers でできること</h2>
            <p className="mt-2 text-sm text-[#475569]">スイマーも、コーチも、グループも——みんなのための水泳プラットフォーム</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "🔍",
                color: "#005F8C",
                bg: "#e8f2f8",
                title: "探せる",
                subtitle: "Find",
                points: [
                  "近くのマスターズグループを検索",
                  "種目・地域でコーチを探す",
                  "参加できる合宿・イベントを発見",
                ],
              },
              {
                icon: "🏊",
                color: "#0f8a4f",
                bg: "#eaf7f0",
                title: "参加できる",
                subtitle: "Join",
                points: [
                  "タップひとつでセッションに参加",
                  "ゲストとして単発参加もOK",
                  "合宿・大会に申し込む",
                ],
              },
              {
                icon: "🤝",
                color: "#7B5EA7",
                bg: "#f3efff",
                title: "つながれる",
                subtitle: "Connect",
                points: [
                  "コーチとダイレクトでやりとり",
                  "グループメンバーとコミュニティ形成",
                  "水泳仲間の輪を広げる",
                ],
              },
            ].map(({ icon, color, bg, title, subtitle, points }) => (
              <div key={title} className="rounded-2xl border border-[#dce3ea] p-6">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: bg }}
                >
                  {icon}
                </div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                  {subtitle}
                </p>
                <h3 className="mb-4 text-xl font-bold text-[#1a2332]">{title}</h3>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[#475569]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" className="mt-0.5 shrink-0">
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

      {/* ===== 掲載するメリット ===== */}
      <section className="bg-[#f2f7fa] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">グループ・コーチが掲載するメリット</h2>
            <p className="mt-2 text-sm text-[#475569]">無料で始めて、必要な機能だけ使う</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                title: "無料で専用ページ作成",
                desc: "グループ・コーチの専用ページを無料で作成。URLをシェアするだけで集客できます。",
                color: "#005F8C",
              },
              {
                num: "02",
                title: "募集・参加管理が簡単",
                desc: "セッション配信から参加申込・確定・キャンセルまで、アプリ上で完結します。",
                color: "#0f8a4f",
              },
              {
                num: "03",
                title: "会費・料金を一元管理",
                desc: "月謝・年会費・回数券の管理、支払い状況の確認がひと目でわかります。",
                color: "#7B5EA7",
              },
              {
                num: "04",
                title: "スイマーが見つけてくれる",
                desc: "Rangers に登録することで、水泳を探している人に自然に発見されます。",
                color: "#E8614D",
              },
            ].map(({ num, title, desc, color }) => (
              <div key={num} className="rounded-2xl bg-white border border-[#dce3ea] p-6">
                <div className="mb-3 text-3xl font-bold" style={{ color, opacity: 0.3 }}>
                  {num}
                </div>
                <h3 className="mb-2 font-bold text-[#1a2332]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#475569]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/coach-recruit">
              <Button
                className="rounded-full bg-[#005F8C] px-10 hover:bg-[#004E73]"
                style={{ minHeight: "52px" }}
              >
                グループ・コーチ登録はこちら
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 目指す未来 ===== */}
      <section className="bg-[#1a2332] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5BC0EB]">Our Vision</p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Rangers が目指す未来</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-2xl mx-auto">
              水泳業界のインフラになる。<br />
              グループ・コーチ・レッスン・合宿・イベント・大会・プール施設——<br />
              すべての情報が一箇所に集まる場所をつくります。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "👤",
                label: "スイマー",
                desc: "目標や好みに合ったグループ・コーチ・練習を見つけられる",
              },
              {
                icon: "🏊",
                label: "コーチ・グループ",
                desc: "専用ページで集客し、運営・管理コストをゼロに近づける",
              },
              {
                icon: "🏟",
                label: "場所・機会",
                desc: "合宿施設、大会、イベント——水泳の機会が集まるハブになる",
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <div className="mb-3 text-4xl">{icon}</div>
                <h3 className="mb-2 font-bold text-white">{label}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-base font-medium text-[#5BC0EB]">
              「探す人」と「募集する人」が同じ場所に集まるプラットフォーム
            </p>
          </div>
        </div>
      </section>

      {/* ===== 人気のマスターズグループ ===== */}
      {teams.length > 0 && (
        <section className="bg-white px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">人気のマスターズグループ</h2>
                <p className="mt-1 text-sm text-[#475569]">活動中のグループを探して、参加してみよう</p>
              </div>
              <Link href="/login" className="hidden text-sm font-medium text-[#005F8C] hover:text-[#004E73] sm:block">
                すべて見る →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <div className="group flex gap-4 rounded-2xl border border-[#dce3ea] bg-white p-5 transition hover:border-[#005F8C] hover:shadow-sm">
                    <div className="shrink-0">
                      {team.avatar_url ? (
                        <Image
                          src={team.avatar_url}
                          alt={team.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#005F8C]/10 text-2xl font-bold text-[#005F8C]">
                          {team.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#1a2332] group-hover:text-[#005F8C] truncate">{team.name}</h3>
                      {team.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569]">
                          {team.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-medium text-[#005F8C]">参加を申し込む →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href="/login" className="text-sm font-medium text-[#005F8C]">
                すべて見る →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 人気のパーソナルレッスン ===== */}
      {coaches.length > 0 && (
        <section className="bg-[#f2f7fa] px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">パーソナルレッスン</h2>
              <p className="mt-1 text-sm text-[#475569]">専門コーチがあなたの目標に合わせて指導</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {coaches.map((coach) => (
                <Link key={coach.id} href={`/profiles/${coach.id}`}>
                  <div className="group flex gap-4 rounded-2xl border border-[#dce3ea] bg-white p-5 transition hover:border-[#005F8C] hover:shadow-sm">
                    <div className="shrink-0">
                      {coach.avatar_url ? (
                        <Image
                          src={coach.avatar_url}
                          alt={coach.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C]/10 text-xl font-bold text-[#005F8C]">
                          {coach.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#1a2332] group-hover:text-[#005F8C]">
                        {coach.name} コーチ
                      </h3>
                      {coach.prefectures && coach.prefectures.length > 0 && (
                        <p className="mt-0.5 text-xs text-[#475569]">📍 {coach.prefectures[0]}</p>
                      )}
                      {coach.bio && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569]">{coach.bio}</p>
                      )}
                      {coach.specialties && coach.specialties.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {coach.specialties.slice(0, 3).map((s: string) => (
                            <span
                              key={s}
                              className="rounded-full bg-[#005F8C]/10 px-2 py-0.5 text-[10px] font-medium text-[#005F8C]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 新着イベント・合宿 ===== */}
      {events.length > 0 && (
        <section className={`px-4 py-16 sm:py-20 ${coaches.length === 0 ? "bg-[#f2f7fa]" : "bg-white"}`}>
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1a2332] sm:text-3xl">新着イベント・合宿</h2>
              <p className="mt-1 text-sm text-[#475569]">参加受付中のイベントや合宿に申し込もう</p>
            </div>
            <div className="space-y-3">
              {events.map((session) => {
                const team = session.team as { id: string; name: string } | null
                const scheduledAt = new Date(session.scheduled_at as string)
                const typeLabels: Record<string, string> = {
                  camp: "合宿",
                  competition: "大会",
                  event: "イベント",
                  practice: "練習",
                  meeting: "ミーティング",
                }
                const typeLabel = typeLabels[session.type as string] ?? "イベント"
                const typeColors: Record<string, string> = {
                  camp: "#7B5EA7",
                  competition: "#E8614D",
                  event: "#0f8a4f",
                  practice: "#005F8C",
                  meeting: "#475569",
                }
                const typeColor = typeColors[session.type as string] ?? "#005F8C"

                return (
                  <Link key={session.id as string} href="/login">
                    <div className="flex items-center gap-4 rounded-2xl border border-[#dce3ea] bg-white p-4 transition hover:border-[#005F8C] hover:shadow-sm">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2 text-center">
                        <span className="text-[10px] font-medium text-[#005F8C]">
                          {scheduledAt.toLocaleDateString("ja-JP", { month: "short", timeZone: "Asia/Tokyo" })}
                        </span>
                        <span className="text-xl font-bold leading-tight text-[#005F8C]">
                          {parseInt(scheduledAt.toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }))}
                        </span>
                        <span className="text-[10px] text-[#005F8C]">
                          {scheduledAt.toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeLabel}
                          </span>
                        </div>
                        <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                        <p className="text-xs text-[#475569]">
                          {scheduledAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
                          {session.location ? ` · ${session.location as string}` : ""}
                          {team ? ` · ${team.name}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#005F8C]">
                          ¥{((session.guest_price as number) || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[#64748b]">参加費</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/login">
                <Button variant="outline" className="rounded-full border-[#005F8C] text-[#005F8C] hover:bg-[#005F8C]/5 px-8" style={{ minHeight: "48px" }}>
                  ログインして参加申込
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 最終 CTA ===== */}
      <section className="bg-[#005F8C] px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5BC0EB]">
            Join Rangers
          </p>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            水泳の新しいつながりを、<br />
            始めよう。
          </h2>
          <p className="mb-10 text-sm leading-relaxed text-[#f7f9fb]">
            グループを探したい人も、グループを運営したい人も、<br className="hidden sm:block" />
            コーチとして活躍したい人も。全員のための Rangers。
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full rounded-full bg-white px-10 text-[#005F8C] font-bold hover:bg-[#f2f7fa] sm:w-auto"
                style={{ minHeight: "52px" }}
              >
                無料会員登録
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-full border-2 border-white bg-transparent px-10 text-white hover:bg-white/10 sm:w-auto"
                style={{ minHeight: "52px" }}
              >
                グループ・コーチ登録
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-[#f7f9fb]/70">
            登録無料 · クレジットカード不要 · いつでも退会可能
          </p>
        </div>
      </section>
    </>
  )
}

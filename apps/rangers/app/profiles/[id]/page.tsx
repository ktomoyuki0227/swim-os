export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getPublicProfile } from "@/actions/profile"
import { Navigation } from "@/components/navigation"
import { BackButton } from "./back-button"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/profiles/${id}`)
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single()

  const { data: profile, error } = await getPublicProfile(id)
  if (error || !profile) notFound()

  const specialties: string[] = (profile.specialties as string[]) ?? []
  const targetAges: string[] = (profile.target_ages as string[]) ?? []
  const prefectures: string[] = (profile.prefectures as string[]) ?? []
  const swimDisciplines: string[] = (profile.swim_disciplines as string[]) ?? []
  const swimmingGoals: string[] = (profile.swimming_goals as string[]) ?? []
  const participationStyles: string[] = (profile.participation_styles as string[]) ?? []

  return (
    <div className="min-h-screen bg-[#f2f7fa]">
      <Navigation userName={myProfile?.name ?? ""} avatarUrl={myProfile?.avatar_url ?? null} />

      <main className="mx-auto w-full max-w-lg px-4 py-6 pb-28">
        {/* 戻るボタン */}
        <BackButton />

        {/* プロフィールカード */}
        <div className="rounded-[14px] bg-white px-6 py-6 border border-[#dce3ea]">
          {/* アバター + 名前 */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#dce3ea] bg-[#e8f2f8]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url as string}
                  alt={(profile.name as string) ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#005F8C]">
                  {((profile.name as string) ?? "?")[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-[#1a2332]">{profile.name as string}</h1>
              {profile.career && (
                <p className="mt-0.5 text-sm text-[#475569]">{profile.career as string}</p>
              )}
              {prefectures.length > 0 && (
                <p className="mt-0.5 text-xs text-[#64748b]">{prefectures.slice(0, 2).join("・")}</p>
              )}
            </div>
          </div>

          {/* タグ */}
          {(specialties.length > 0 || targetAges.length > 0 || swimDisciplines.length > 0) && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {specialties.map((s) => (
                <span key={s} className="rounded-full bg-[#e8f2f8] px-3 py-1 text-xs font-medium text-[#005F8C]">
                  {s}
                </span>
              ))}
              {targetAges.map((a) => (
                <span key={a} className="rounded-full bg-[#eaf7f0] px-3 py-1 text-xs font-medium text-[#0f8a4f]">
                  {a}
                </span>
              ))}
              {swimDisciplines.map((d) => (
                <span key={d} className="rounded-full bg-[#e8f2f8] px-3 py-1 text-xs font-medium text-[#005F8C]">
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* 自己紹介 */}
          {profile.bio && (
            <div className="mt-5 border-t border-[#e8edf2] pt-4">
              <p className="mb-1.5 text-xs font-medium text-[#64748b]">自己紹介</p>
              <p className="text-sm leading-relaxed text-[#1a2332]">{profile.bio as string}</p>
            </div>
          )}

          {/* 経歴 */}
          {profile.career && (
            <div className="mt-4 border-t border-[#e8edf2] pt-4">
              <p className="mb-1.5 text-xs font-medium text-[#64748b]">経歴</p>
              <p className="text-sm leading-relaxed text-[#1a2332]">{profile.career as string}</p>
            </div>
          )}

          {/* 実績 */}
          {profile.achievements && (
            <div className="mt-4 border-t border-[#e8edf2] pt-4">
              <p className="mb-1.5 text-xs font-medium text-[#64748b]">実績</p>
              <p className="text-sm leading-relaxed text-[#1a2332]">{profile.achievements as string}</p>
            </div>
          )}

          {/* 活動・目的 */}
          {(swimmingGoals.length > 0 || participationStyles.length > 0) && (
            <div className="mt-4 border-t border-[#e8edf2] pt-4">
              <p className="mb-2 text-xs font-medium text-[#64748b]">活動スタイル</p>
              <div className="flex flex-wrap gap-1.5">
                {swimmingGoals.map((g) => (
                  <span key={g} className="rounded-full bg-[#fdf6e3] px-3 py-1 text-xs text-[#b8860b]">
                    {g}
                  </span>
                ))}
                {participationStyles.map((p) => (
                  <span key={p} className="rounded-full bg-[#fdf6e3] px-3 py-1 text-xs text-[#b8860b]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

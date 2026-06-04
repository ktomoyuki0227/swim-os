import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Star, MapPin, MessageCircle, Trophy } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/types/database"
import { ScheduleRequestDialog } from "@/components/instructor/schedule-request-dialog"

interface InstructorPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InstructorPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("name, bio").eq("id", id).single()
  if (!data) return {}
  return {
    title: `${data.name} コーチ`,
    description: data.bio ?? `${data.name}コーチのプロフィールページ`,
  }
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-5 w-5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-lg font-bold text-yellow-600">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count}件の口コミ)</span>
    </div>
  )
}

export default async function InstructorProfilePage({ params }: InstructorPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: instructor },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ])

  if (!instructor) notFound()

  const profile = instructor as Profile

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* プロフィールヘッダー */}
      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* アバター */}
          <div className="shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={120}
                height={120}
                className="rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-blue-100 text-5xl font-bold text-blue-600 shadow-md">
                {profile.name[0]}
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="flex-1">
            <h1 className="mb-1 text-2xl font-bold">{profile.name} コーチ</h1>

            {profile.review_count > 0 && (
              <div className="mb-3">
                <StarRating rating={profile.rating_avg} count={profile.review_count} />
              </div>
            )}

            {profile.prefecture && (
              <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.prefecture} 活動</span>
              </div>
            )}

            {profile.specialties && profile.specialties.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {profile.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
          </div>

          {/* アクションボタン */}
          {user && user.id !== profile.id && (
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <ScheduleRequestDialog instructorId={profile.id} instructorName={profile.name} />
              <Link href={`/messages/${profile.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  メッセージ
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 経歴・実績 */}
      {(profile.career || profile.achievements) && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Trophy className="h-5 w-5 text-yellow-500" />
            経歴・実績
          </h2>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            {profile.career && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  経歴
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.career}</p>
              </div>
            )}
            {profile.career && profile.achievements && <Separator />}
            {profile.achievements && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  実績
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.achievements}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 指導対象 */}
      {profile.target_ages && profile.target_ages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">指導対象</h2>
          <div className="flex flex-wrap gap-2">
            {profile.target_ages.map((age) => (
              <span
                key={age}
                className="rounded-lg border bg-muted px-3 py-1.5 text-sm"
              >
                {age}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Star, MapPin, ChevronRight } from "lucide-react"
import { SWIM_SPECIALTIES, PREFECTURES, TARGET_AGES } from "@/types/database"
import type { Profile } from "@/types/database"

export const metadata: Metadata = {
  title: "コーチ一覧",
  description: "水泳指導員の一覧。クロール・平泳ぎ・バタフライなど種目別、地域別に検索できます。",
}

interface InstructorsPageProps {
  searchParams: Promise<{
    specialty?: string
    prefecture?: string
    age?: string
    q?: string
  }>
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-yellow-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count}件)</span>
    </div>
  )
}

function InstructorCard({ instructor }: { instructor: Profile }) {
  return (
    <Link href={`/instructors/${instructor.id}`}>
      <div className="group flex gap-4 rounded-xl border bg-card p-4 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5">
        {/* アバター */}
        <div className="shrink-0">
          {instructor.avatar_url ? (
            <Image
              src={instructor.avatar_url}
              alt={instructor.name}
              width={72}
              height={72}
              className="h-18 w-18 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 ring-2 ring-white shadow-sm">
              {instructor.name[0]}
            </div>
          )}
        </div>

        {/* 情報 */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight group-hover:text-blue-600">
              {instructor.name} コーチ
            </h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>

          {instructor.review_count > 0 && (
            <div className="mb-2">
              <StarRating rating={instructor.rating_avg} count={instructor.review_count} />
            </div>
          )}

          {instructor.bio && (
            <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {instructor.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {instructor.prefecture && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {instructor.prefecture}
              </span>
            )}
            {instructor.specialties?.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function InstructorsPage({ searchParams }: InstructorsPageProps) {
  const { specialty, prefecture, age, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
    .order("review_count", { ascending: false })

  if (specialty) {
    query = query.contains("specialties", [specialty])
  }
  if (prefecture) {
    query = query.eq("prefecture", prefecture)
  }
  if (age) {
    query = query.contains("target_ages", [age])
  }
  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  const { data: instructors } = await query

  const list = (instructors ?? []) as Profile[]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">コーチを探す</h1>
        <p className="text-muted-foreground">
          水泳専門のプロコーチが、あなたの目標に合わせて個別指導します
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* フィルターサイドバー */}
        <aside>
          <form className="sticky top-4 space-y-6 rounded-xl border bg-card p-4">
            {/* キーワード検索 */}
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="q">
                コーチ名で検索
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="名前を入力..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 種目 */}
            <div>
              <p className="mb-2 text-sm font-medium">種目</p>
              <div className="space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="specialty"
                    value=""
                    defaultChecked={!specialty}
                    className="accent-blue-500"
                  />
                  <span>すべて</span>
                </label>
                {SWIM_SPECIALTIES.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="specialty"
                      value={s}
                      defaultChecked={specialty === s}
                      className="accent-blue-500"
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 対象年齢 */}
            <div>
              <p className="mb-2 text-sm font-medium">対象</p>
              <div className="space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="age"
                    value=""
                    defaultChecked={!age}
                    className="accent-blue-500"
                  />
                  <span>すべて</span>
                </label>
                {TARGET_AGES.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="age"
                      value={a}
                      defaultChecked={age === a}
                      className="accent-blue-500"
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 都道府県 */}
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="prefecture">
                活動地域
              </label>
              <select
                id="prefecture"
                name="prefecture"
                defaultValue={prefecture ?? ""}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">すべての地域</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              検索する
            </button>

            {(specialty || prefecture || age || q) && (
              <a
                href="/instructors"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                絞り込みをリセット
              </a>
            )}
          </form>
        </aside>

        {/* コーチ一覧 */}
        <div>
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <span className="text-3xl">🏊</span>
              </div>
              <p className="font-medium">条件に合うコーチが見つかりませんでした</p>
              <p className="text-sm text-muted-foreground">絞り込み条件を変えてみてください</p>
              <a href="/instructors" className="text-sm text-blue-600 hover:underline">
                すべてのコーチを表示
              </a>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {list.length}人のコーチ
                {specialty && ` ／ 種目: ${specialty}`}
                {prefecture && ` ／ 地域: ${prefecture}`}
                {age && ` ／ 対象: ${age}`}
              </p>
              <div className="space-y-3">
                {list.map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

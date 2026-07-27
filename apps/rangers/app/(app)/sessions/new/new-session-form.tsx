"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createSession, getSession } from "@/actions/sessions"
import { getTeamTemplates, getTemplate } from "@/actions/templates"
import { getTeamMembers, getMyTeams } from "@/actions/teams"
import { createClient } from "@/lib/supabase/client"
import { useMounted } from "@/hooks/use-mounted"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"
import { SYSTEM_TAGS } from "@/types/database"
import { StepIndicator } from "./step-indicator"
import { StepBasicInfo } from "./step-basic-info"
import { StepPricing } from "./step-pricing"
import { StepDetails } from "./step-details"
import { StepAudience } from "./step-audience"
import { StepConfirm } from "./step-confirm"
import { STEPS, DEFAULT_FORM, recalcEndAt, matchMemberIdsByTags } from "./form-helpers"
import type {
  CompetitionField,
  FormData,
  PrefillInput,
  TeamMemberOption,
  AdminTeamOption,
  TemplateOption,
} from "./types"

export function NewSessionForm({
  initialTemplates,
  initialTeamId,
}: {
  initialTemplates: TemplateOption[]
  initialTeamId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const teamId = searchParams.get("team") || ""
  const copySessionId = searchParams.get("copy") || ""
  const templateId = searchParams.get("template") || ""

  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([])
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [adminTeams, setAdminTeams] = useState<AdminTeamOption[]>([])
  const [activeTeamId, setActiveTeamId] = useState(initialTeamId || teamId)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [competitionFields, setCompetitionFields] = useState<CompetitionField[]>([
    { key: "event_name", label: "エントリー種目", type: "text", required: true },
    { key: "entry_time", label: "エントリータイム", type: "text", required: true },
    { key: "age_group", label: "年齢区分", type: "text", required: false },
  ])
  const [templates, setTemplates] = useState<TemplateOption[]>(initialTemplates)
  const [openTagCategory, setOpenTagCategory] = useState<string | null>(null)
  const portalMounted = useMounted()
  // サーバーで取得済みのグループIDを記憶しておき、同じグループでの再フェッチをスキップする
  const serverFetchedTeamId = useRef(initialTeamId)
  const fetchingMembersRef = useRef(false)
  const hasInitialTemplatesRef = useRef(initialTemplates.length > 0)
  // 「タグ変更のたびにselectedMemberIdsをリセットする」ための直前値比較（レンダー中のstate調整）。
  // refでの比較はReact Compilerのreact-hooks/refsルールに抵触するためuseStateで保持する。
  const [prevSelectedTags, setPrevSelectedTags] = useState(selectedTags)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (openTagCategory !== null) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [openTagCategory])

  // teamId が URL になければ管理者グループを自動取得（teamIdがある場合はuseStateの初期値で既に反映済み）
  useEffect(() => {
    if (teamId) return
    getMyTeams().then(({ data }) => {
      const adminOnly = ((data || []) as AdminTeamOption[]).filter((t) => t.my_role === "admin")
      setAdminTeams(adminOnly)
      if (adminOnly.length === 1) setActiveTeamId(adminOnly[0].id)
    })
  }, [teamId])

  // activeTeamId が変わったらテンプレートを取得（サーバー取得済みの場合はスキップ）
  useEffect(() => {
    if (!activeTeamId) return
    if (activeTeamId === serverFetchedTeamId.current && hasInitialTemplatesRef.current) return
    getTeamTemplates(activeTeamId).then(({ data }) => setTemplates((data || []) as TemplateOption[]))
  }, [activeTeamId])

  // step3 になったらメンバーを取得（currentUserId 確定後に実行）。ローディング表示はレンダー時に導出する
  const membersLoading = step === 3 && !!activeTeamId && !!currentUserId && !membersLoaded
  useEffect(() => {
    if (!membersLoading || fetchingMembersRef.current || !activeTeamId) return
    fetchingMembersRef.current = true
    getTeamMembers(activeTeamId).then(({ data }) => {
      const members = ((data || []) as TeamMemberOption[]).filter((m) => m.swimmer.id !== currentUserId)
      setTeamMembers(members)
      setSelectedMemberIds(members.map((m) => m.swimmer.id))
      setMembersLoaded(true)
      fetchingMembersRef.current = false
    })
  }, [membersLoading, activeTeamId, currentUserId])

  // タグ変更 → selectedMemberIds をプロフィールフィールドで AND フィルタ
  // (レンダー中にstateを調整する公式パターン。effectにすると1テンポ遅れて再レンダーが増える)
  if (membersLoaded && selectedTags !== prevSelectedTags) {
    setPrevSelectedTags(selectedTags)
    setSelectedMemberIds(matchMemberIdsByTags(teamMembers, selectedTags))
  }

  const applyPrefill = (data: PrefillInput) => {
    setForm((prev) => ({
      ...prev,
      title: data.title ?? prev.title,
      type: data.type ?? prev.type,
      location: data.location ?? prev.location,
      meeting_point: data.meeting_point ?? prev.meeting_point,
      gender_filter: data.gender_filter ?? prev.gender_filter,
      description: data.description ?? prev.description,
      member_price: data.member_price !== undefined ? String(data.member_price) : prev.member_price,
      guest_price: data.guest_price !== undefined ? String(data.guest_price) : prev.guest_price,
      allow_point_card: data.allow_point_card ?? prev.allow_point_card,
      min_participants: data.min_participants !== undefined ? String(data.min_participants) : prev.min_participants,
      max_participants: data.max_participants !== undefined ? String(data.max_participants) : prev.max_participants,
      cancellation_days: data.cancellation_days !== undefined ? String(data.cancellation_days) : prev.cancellation_days,
      is_external: data.is_external ?? prev.is_external,
    }))
    if (data.target_tags) setSelectedTags(data.target_tags)
    if (data.competition_fields) setCompetitionFields(data.competition_fields)
  }

  useEffect(() => {
    if (copySessionId) {
      getSession(copySessionId).then(({ data }) => {
        if (!data) return
        applyPrefill({
          title: data.title, type: data.type, location: data.location ?? undefined,
          description: data.description ?? undefined, member_price: data.member_price,
          guest_price: data.guest_price, allow_point_card: data.allow_point_card,
          min_participants: data.min_participants ?? undefined, max_participants: data.max_participants ?? undefined,
          cancellation_days: data.cancellation_days ?? undefined,
          is_external: data.is_external, target_tags: (data.target_tags as string[]) ?? [],
          competition_fields: data.competition_fields as CompetitionField[],
        })
      })
    } else if (templateId) {
      getTemplate(templateId).then(({ data }) => {
        if (!data) return
        applyPrefill({
          title: data.title as string, type: data.type as string, location: (data.location as string) ?? undefined,
          description: (data.description as string) ?? undefined, member_price: data.member_price as number,
          guest_price: data.guest_price as number, allow_point_card: data.allow_point_card as boolean,
          min_participants: (data.min_participants as number) ?? undefined, max_participants: (data.max_participants as number) ?? undefined,
          cancellation_days: (data.cancellation_days as number) ?? undefined,
          is_external: data.is_external as boolean, target_tags: (data.target_tags as string[]) ?? [],
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copySessionId, templateId])

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // 開始日時 or 所要時間の変更イベントで end_at を自動計算する（camp 以外かつ custom 以外）
  const setScheduledAt = (value: string) => setForm((prev) => recalcEndAt({ ...prev, scheduled_at: value }))
  const setDuration = (value: string) => setForm((prev) => recalcEndAt({ ...prev, duration: value }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return "タイトルを入力してください"
      if (!form.scheduled_at) return "日時を入力してください"
      if (!form.location.trim()) return "場所を入力してください"
    }
    if (step === 2) {
      if (form.registration_deadline && form.scheduled_at) {
        const deadline = new Date(form.registration_deadline)
        const scheduled = new Date(form.scheduled_at)
        if (deadline >= scheduled) return "申込締切は開始日時より前に設定してください"
      }
      if (form.min_participants && form.max_participants) {
        if (parseInt(form.min_participants, 10) > parseInt(form.max_participants, 10)) {
          return "最低参加人数は定員以下にしてください"
        }
      }
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { showToast(err, "error"); return }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    setStep((s) => s - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = () => {
    if (!activeTeamId) { showToast("グループが選択されていません", "error"); return }
    startTransition(async () => {
      const result = await createSession(activeTeamId, {
        title: form.title,
        description: form.description || undefined,
        type: form.type as "practice" | "camp" | "competition" | "event" | "meeting",
        scheduled_at: form.scheduled_at,
        end_at: form.end_at || undefined,
        location: form.location,
        meeting_point: form.meeting_point || undefined,
        gender_filter: form.gender_filter,
        member_price: parseInt(form.member_price) || 0,
        guest_price: parseInt(form.guest_price) || 0,
        registration_deadline: form.registration_deadline || undefined,
        min_participants: parseInt(form.min_participants) || undefined,
        max_participants: parseInt(form.max_participants) || undefined,
        cancellation_days: parseInt(form.cancellation_days) || undefined,
        allow_point_card: form.allow_point_card,
        is_external: form.is_external,
        target_tags: selectedTags,
        target_members: selectedMemberIds ?? undefined,
        competition_fields: form.type === "competition" ? competitionFields : undefined,
      })
      if (result.error) {
        showToast(result.error, "error")
      } else if (result.data) {
        showToast("セッションを作成しました", "success")
        router.push(`/sessions/${result.data.id}`)
      }
    })
  }

  const tagsByCategory = SYSTEM_TAGS.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, typeof SYSTEM_TAGS[number][]>)

  return (
    <div className={`mx-auto space-y-6 ${step === 3 ? "max-w-3xl" : "max-w-xl"} transition-all`}>
      {/* ヘッダー */}
      <div>
        <Link href={activeTeamId ? `/teams/${activeTeamId}?tab=sessions` : "/"} className="text-sm text-[#475569] hover:text-[#1a2332]">
          ← セッション管理
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1a2332]">セッションを作成</h1>
      </div>

      {/* テンプレート */}
      {templates.length > 0 && step === 0 && (
        <div className="rounded-xl border border-[#005F8C]/30 bg-[#f2f7fa] p-4">
          <p className="mb-2 text-sm font-medium text-[#005F8C]">テンプレートから作成</p>
          <select
            className="h-10 w-full rounded-lg border border-[#005F8C]/30 bg-white px-3 text-sm text-[#1a2332] focus:outline-none"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return
              getTemplate(e.target.value).then(({ data }) => {
                if (!data) return
                applyPrefill({
                  title: data.title as string, type: data.type as string, location: (data.location as string) ?? undefined,
                  description: (data.description as string) ?? undefined, member_price: data.member_price as number,
                  guest_price: data.guest_price as number, allow_point_card: data.allow_point_card as boolean,
                  min_participants: (data.min_participants as number) ?? undefined, max_participants: (data.max_participants as number) ?? undefined,
                  cancellation_days: (data.cancellation_days as number) ?? undefined,
                  is_external: data.is_external as boolean, target_tags: (data.target_tags as string[]) ?? [],
                })
              })
            }}
          >
            <option value="">テンプレートを選択...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ステップインジケーター */}
      <StepIndicator current={step} />

      {/* グループ未選択時のピッカー（URL に team なし・複数グループあり） */}
      {!teamId && adminTeams.length > 1 && step === 0 && (
        <div className="rounded-xl border border-[#005F8C]/30 bg-[#f2f7fa] p-4">
          <p className="mb-2 text-sm font-medium text-[#005F8C]">対象グループを選択</p>
          <select
            className="h-10 w-full rounded-lg border border-[#005F8C]/30 bg-white px-3 text-sm text-[#1a2332] focus:outline-none"
            value={activeTeamId}
            onChange={(e) => setActiveTeamId(e.target.value)}
          >
            <option value="">グループを選択...</option>
            {adminTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {step === 0 && (
        <StepBasicInfo form={form} set={set} setScheduledAt={setScheduledAt} setDuration={setDuration} />
      )}

      {step === 1 && <StepPricing form={form} set={set} />}

      {step === 2 && (
        <StepDetails
          form={form}
          set={set}
          competitionFields={competitionFields}
          setCompetitionFields={setCompetitionFields}
        />
      )}

      {step === 3 && (
        <StepAudience
          teamMembers={teamMembers}
          selectedMemberIds={selectedMemberIds}
          setSelectedMemberIds={setSelectedMemberIds}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          openTagCategory={openTagCategory}
          setOpenTagCategory={setOpenTagCategory}
          portalMounted={portalMounted}
          membersLoading={membersLoading}
          tagsByCategory={tagsByCategory}
        />
      )}

      {step === 4 && (
        <StepConfirm
          form={form}
          competitionFields={competitionFields}
          selectedTags={selectedTags}
          selectedMemberIds={selectedMemberIds}
          teamMembersCount={teamMembers.length}
        />
      )}

      {/* ナビゲーションボタン */}
      <div className="flex gap-3">
        {step === 0 ? (
          <Link href={activeTeamId ? `/teams/${activeTeamId}?tab=sessions` : "/"} className="flex-1">
            <Button type="button" variant="outline" className="w-full rounded-full border-[#dce3ea] text-[#475569]" style={{ minHeight: "48px" }}>
              キャンセル
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 rounded-full border-[#dce3ea] text-[#475569]" style={{ minHeight: "48px" }}>
            ← 戻る
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
            次へ →
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isPending || !activeTeamId} className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
            {isPending ? "作成中..." : "セッションを作成"}
          </Button>
        )}
      </div>
    </div>
  )
}

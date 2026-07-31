export type CompetitionField = {
  key: string
  label: string
  type: "text" | "select" | "number"
  required: boolean
  options?: string[]
}

/**
 * フォーム編集中のみ使うcompetitionFieldの表現。
 * `key` はラベル編集のたびに再生成される（DBに保存するスラッグ）ため
 * React の key には使えない。`id` は編集内容に依存しない安定した識別子で、
 * リスト項目のReact keyとして使う。サーバーへの送信前に取り除く。
 */
export type EditableCompetitionField = CompetitionField & { id: string }

export type FormData = {
  title: string
  type: string
  scheduled_at: string
  end_at: string
  duration: string
  location: string
  meeting_point: string
  gender_filter: "all" | "male" | "female"
  description: string
  member_price: string
  guest_price: string
  allow_point_card: boolean
  registration_deadline: string
  min_participants: string
  max_participants: string
  is_external: boolean
}

/** getTeamMembers() が返す行のうち、このフォームで参照するプロフィール項目のみ */
export interface MemberSwimmerInfo {
  id: string
  name: string
  avatar_url: string | null
  level?: string | null
  specialties?: string[] | null
  swimming_goals?: string[] | null
  swimmer_type?: string | null
  swim_disciplines?: string[] | null
}

export interface TeamMemberOption {
  swimmer: MemberSwimmerInfo
}

/** getMyTeams() が返す行のうち、このフォームで参照する項目のみ */
export interface AdminTeamOption {
  id: string
  name: string
  my_role?: string
}

/** getTeamTemplates() / initialTemplates が返す行のうち、このフォームで参照する項目のみ */
export interface TemplateOption {
  id: string
  name: string
}

export type PrefillInput = Partial<Omit<FormData, "member_price" | "guest_price" | "min_participants" | "max_participants">> & {
  member_price?: string | number
  guest_price?: string | number
  min_participants?: string | number
  max_participants?: string | number
  target_tags?: string[]
  competition_fields?: CompetitionField[]
}

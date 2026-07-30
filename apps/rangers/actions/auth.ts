"use server"

import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema } from "@/lib/validations"
import { isRateLimited, getClientIp } from "@/lib/rate-limit"
import { redirect } from "next/navigation"
import { safeRedirectPath } from "@/lib/utils"

export interface AuthState {
  error: string | null
}

const LOGIN_RATE_LIMIT = 10
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000
const REGISTER_RATE_LIMIT = 5
const REGISTER_RATE_WINDOW_MS = 60 * 60 * 1000
const RESET_RATE_LIMIT = 5
const RESET_RATE_WINDOW_MS = 60 * 60 * 1000
const RESEND_RATE_LIMIT = 3
const RESEND_RATE_WINDOW_MS = 10 * 60 * 1000
// メールアドレスを変えて連打されても外部APIコールが無制限にならないよう、IP単位でも上限を設ける
const RESEND_IP_RATE_LIMIT = 20
const RESEND_IP_RATE_WINDOW_MS = 10 * 60 * 1000

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・") }
  }

  const ip = await getClientIp()
  if (isRateLimited(`login:${ip}:${result.data.email}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)) {
    return { error: "試行回数が多すぎます。しばらく経ってからもう一度お試しください" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" }
  }

  // 招待コードがあればチーム参加ページへ
  const invite = (formData.get("invite") as string)?.trim()
  if (invite) {
    redirect(`/teams/join/${invite}`)
  }

  redirect("/dashboard")
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (formData.get("termsAgreed") !== "on") {
    return { error: "利用規約とプライバシーポリシーへの同意が必要です" }
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・") }
  }

  const ip = await getClientIp()
  if (isRateLimited(`register:${ip}`, REGISTER_RATE_LIMIT, REGISTER_RATE_WINDOW_MS)) {
    return { error: "試行回数が多すぎます。しばらく経ってからもう一度お試しください" }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // 招待コードがある場合もオンボーディングを先に完了させる
  // 完了後に next パラメータ経由でチーム参加ページへ遷移
  const invite = (formData.get("invite") as string)?.trim()
  const onboardingPath = invite
    ? `/onboarding?next=${encodeURIComponent(`/teams/join/${invite}`)}`
    : "/onboarding"

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { name: result.data.name },
      // メール確認が有効な環境向け: 確認リンクから戻ってきたときに
      // オンボーディング（招待経由の場合は招待先も維持）へ遷移させる
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(onboardingPath)}`,
    },
  })

  if (signUpError) {
    // メールアドレスが既に使われているかどうかを示唆しない汎用メッセージにする
    // (ログイン・パスワードリセットと同様、アカウント列挙を防ぐため)
    return { error: "登録に失敗しました。入力内容をご確認の上、もう一度お試しください" }
  }

  // メール確認が有効な場合、signUp 時点ではセッションが確立されない。
  // ここでセッションを張ってしまうと「確認前アカウント」がログイン状態のまま残り、
  // 別アカウントでのログインを阻害するため、未確認の間は /register/sent へ誘導する
  if (!data.session) {
    const sentParams = new URLSearchParams({ email: result.data.email, next: onboardingPath })
    redirect(`/register/sent?${sentParams.toString()}`)
  }

  // 名前をプロフィールに保存（role は常に 'member' のまま）
  // ここに来るのはセッションが即座に確立された場合のみ（メール確認が無効な環境など）。
  // メール確認必須の通常経路では handle_new_user トリガーが signUp 時点の
  // raw_user_meta_data から名前を保存済みのため、このブロックは実質通らない
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from("profiles")
      .update({ name: result.data.name })
      .eq("id", user.id)
  }

  redirect(onboardingPath)
}

export interface ResendState {
  error: string | null
  success: boolean
  // クライアント側のクールダウン表示を「毎回」再起動させるための識別子。
  // success は一度 true になると以降ずっと true のままなので、
  // useEffect の依存値としては使えない（true→true では発火しない）
  requestId: number
}

export async function resendConfirmationEmail(
  _prevState: ResendState,
  formData: FormData
): Promise<ResendState> {
  const requestId = Date.now()
  const email = (formData.get("email") as string)?.trim()
  if (!email) {
    return { error: "メールアドレスが不正です", success: false, requestId }
  }

  const ip = await getClientIp()
  // メールアドレスを変えて連打されるとメール単位の制限だけでは無制限にAPIを叩けてしまうため、
  // IP単位の上限も別枠でチェックする
  if (
    isRateLimited(`resend-ip:${ip}`, RESEND_IP_RATE_LIMIT, RESEND_IP_RATE_WINDOW_MS) ||
    isRateLimited(`resend:${ip}:${email}`, RESEND_RATE_LIMIT, RESEND_RATE_WINDOW_MS)
  ) {
    // メール爆撃・アカウント列挙対策のため、成功時と同じ応答にする
    return { error: null, success: true, requestId }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const next = safeRedirectPath(formData.get("next") as string, "/onboarding")

  // 既に確認済み・未登録のメールに対するエラーも成功時と同じ応答にする
  // （確認済みかどうかを外部から判別できるオラクルにしないため）
  await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  return { error: null, success: true, requestId }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export interface ResetPasswordState {
  error: string | null
  success: boolean
}

export async function requestPasswordReset(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = (formData.get("email") as string)?.trim()
  if (!email) {
    return { error: "メールアドレスを入力してください", success: false }
  }

  const ip = await getClientIp()
  if (isRateLimited(`reset:${ip}:${email}`, RESET_RATE_LIMIT, RESET_RATE_WINDOW_MS)) {
    // メール爆撃対策。アカウント列挙を避けるため成功時と同じ応答にする
    return { error: null, success: true }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // /reset-password を直接指定すると exchangeCodeForSession が一度も呼ばれず
    // リカバリーセッションが確立されないため、/auth/callback を経由させる
    redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  })

  if (error) {
    return { error: "送信に失敗しました。もう一度お試しください", success: false }
  }

  return { error: null, success: true }
}

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = formData.get("password") as string
  const confirm = formData.get("confirm") as string

  if (!password || password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください", success: false }
  }
  if (password !== confirm) {
    return { error: "パスワードが一致しません", success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: "パスワードの更新に失敗しました", success: false }
  }

  return { error: null, success: true }
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Supabase(GoTrue)の /auth/v1/callback を直接指定すると、このアプリの
      // /auth/callback（exchangeCodeForSession経由でCookieセッションを確立する処理）
      // を経由しないため、アプリ側のセッションが正しく確立されない
      redirectTo: `${appUrl}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect("/login?error=google")
  }

  redirect(data.url)
}

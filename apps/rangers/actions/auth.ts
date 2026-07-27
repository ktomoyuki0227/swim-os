"use server"

import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema } from "@/lib/validations"
import { isRateLimited, getClientIp } from "@/lib/rate-limit"
import { redirect } from "next/navigation"

export interface AuthState {
  error: string | null
}

const LOGIN_RATE_LIMIT = 10
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000
const REGISTER_RATE_LIMIT = 5
const REGISTER_RATE_WINDOW_MS = 60 * 60 * 1000
const RESET_RATE_LIMIT = 5
const RESET_RATE_WINDOW_MS = 60 * 60 * 1000

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

  const { error: signUpError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { name: result.data.name },
    },
  })

  if (signUpError) {
    return { error: "登録に失敗しました。別のメールアドレスをお試しください" }
  }

  // 名前をプロフィールに保存（role は常に 'member' のまま）
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from("profiles")
      .update({ name: result.data.name })
      .eq("id", user.id)
  }

  // 招待コードがある場合もオンボーディングを先に完了させる
  // 完了後に next パラメータ経由でチーム参加ページへ遷移
  const invite = (formData.get("invite") as string)?.trim()
  if (invite) {
    redirect(`/onboarding?next=${encodeURIComponent(`/teams/join/${invite}`)}`)
  }

  redirect("/onboarding")
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

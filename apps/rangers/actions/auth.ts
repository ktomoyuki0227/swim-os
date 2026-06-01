"use server"

import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema } from "@/lib/validations"
import { redirect } from "next/navigation"

export interface AuthState {
  error: string | null
}

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

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" }
  }

  // ロールに応じてリダイレクト先を変える
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role === "instructor") {
      redirect("/instructor/dashboard")
    }
  }

  redirect("/dashboard")
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・") }
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

  // プロフィールのロールを更新
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase
      .from("profiles")
      .update({ role: result.data.role, name: result.data.name })
      .eq("id", user.id)
  }

  redirect("/register/sent")
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

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
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

  if (!password || password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください", success: false }
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

export async function updateRole(role: "instructor" | "swimmer"): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "未ログインです" }

  // ロールが既に設定済みの場合は変更不可（エスカレーション防止）
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (existing?.role) return { error: "ロールは変更できません" }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id)

  if (error) return { error: "ロールの更新に失敗しました" }
  return {}
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    },
  })

  if (error || !data.url) {
    redirect("/login?error=google")
  }

  redirect(data.url)
}

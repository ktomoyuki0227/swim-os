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
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" }
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
    return { error: result.error.issues[0].message }
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

  redirect("/register/confirm")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    },
  })

  if (error) {
    throw new Error("Google ログインに失敗しました")
  }

  if (data.url) {
    redirect(data.url)
  }
}

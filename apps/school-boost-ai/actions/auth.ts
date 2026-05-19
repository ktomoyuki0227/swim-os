'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations'
import { z } from 'zod'
import { redirect } from 'next/navigation'

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(result.data)
  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profile?.role === 'parent') {
    redirect('/parent/mypage')
  }

  redirect('/admin/dashboard')
}

const registerSchema = z.object({
  name: z.string().min(1, 'お名前を入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  invite_code: z.string().min(1, '招待コードを入力してください'),
})

export async function registerParent(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    invite_code: formData.get('invite_code'),
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // 招待コードからスクールを検索
  const { data: school } = await supabase
    .from('schools')
    .select('id, name')
    .eq('invite_code', result.data.invite_code)
    .single()

  if (!school) {
    return { error: '招待コードが正しくありません' }
  }

  // Supabase Auth でユーザー作成
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        name: result.data.name,
        role: 'parent',
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: '登録に失敗しました。再度お試しください' }
  }

  // profileにschool_idを紐づけ（triggerで作成されたprofileを更新）
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ school_id: school.id })
    .eq('id', authData.user.id)

  if (profileError) {
    return { error: 'スクールへの紐づけに失敗しました' }
  }

  redirect('/parent/mypage')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('id', user.id)
    .single()

  return data
}

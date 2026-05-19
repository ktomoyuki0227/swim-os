'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Waves, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(login, null)

  useEffect(() => {
    if (state && 'redirect' in state && state.redirect) {
      router.push(state.redirect)
    }
  }, [state, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SchoolBoost AI</h1>
          <p className="text-sm text-gray-500">スイミングスクール管理システム</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">ログイン</CardTitle>
            <CardDescription>管理者・コーチ用ログイン画面</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state && 'error' in state && state.error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-sky-500 hover:bg-sky-600"
              >
                {pending ? 'ログイン中...' : 'ログイン'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          HYDOOR &copy; {new Date().getFullYear()} SchoolBoost AI
        </p>
      </div>
    </div>
  )
}

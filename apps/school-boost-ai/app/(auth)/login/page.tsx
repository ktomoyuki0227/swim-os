import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Waves } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
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
            <form action={login as unknown as (formData: FormData) => void} className="space-y-4">
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
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                ログイン
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

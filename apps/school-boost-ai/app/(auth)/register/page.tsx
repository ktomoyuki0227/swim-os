import { registerParent } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Waves } from 'lucide-react'

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SchoolBoost AI</h1>
          <p className="text-sm text-gray-500">保護者アカウント登録</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">アカウント登録</CardTitle>
            <CardDescription>スクールから届いた招待コードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={registerParent as unknown as (formData: FormData) => void}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="invite_code">招待コード</Label>
                <Input
                  id="invite_code"
                  name="invite_code"
                  placeholder="例: HYDOOR01"
                  defaultValue={searchParams.code ?? ''}
                  required
                  className="font-mono tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">お名前（保護者）</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="山田 太郎"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="parent@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード（6文字以上）</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                登録する
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            ログイン
          </a>
        </p>

        <p className="text-center text-xs text-gray-400">
          HYDOOR &copy; {new Date().getFullYear()} SchoolBoost AI
        </p>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">確認メールを送信しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            ご登録いただいたメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <p className="text-sm text-muted-foreground">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-2 w-full">
              ログインページへ
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

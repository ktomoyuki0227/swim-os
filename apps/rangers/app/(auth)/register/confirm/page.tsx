import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export default function RegisterConfirmPage() {
  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <MailCheck className="h-7 w-7 text-blue-500" />
          </div>
          <CardTitle className="text-2xl text-blue-600">確認メールを送信しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            ご登録いただいたメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <p className="text-xs text-muted-foreground">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              ログインページへ
            </Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-400">
        Rangers · マスターズ水泳レッスン予約
      </p>
    </div>
  )
}

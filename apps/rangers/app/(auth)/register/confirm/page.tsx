import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export default function RegisterConfirmPage() {
  return (
    <div className="w-full max-w-md">
      <Card className="w-full border-[#dce3ea] bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C]/[0.08]">
            <MailCheck className="h-7 w-7 text-[#005F8C]" />
          </div>
          <CardTitle className="text-2xl text-[#005F8C]">確認メールを送信しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-[#5c6a7a]">
            ご登録いただいたメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
          <p className="text-xs text-[#5c6a7a]">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              ログインページへ
            </Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-[#8d99a8]">
        Rangers · マスターズ水泳レッスン予約
      </p>
    </div>
  )
}

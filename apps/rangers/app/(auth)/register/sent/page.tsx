import Link from "next/link"
import { safeRedirectPath } from "@/lib/utils"
import { StepProgress } from "../../step-progress"
import { ResendConfirmationForm } from "./resend-confirmation-form"

interface RegisterSentPageProps {
  searchParams: Promise<{ email?: string; next?: string }>
}

export default async function RegisterSentPage({ searchParams }: RegisterSentPageProps) {
  const params = await searchParams
  const email = params.email ?? ""
  const next = safeRedirectPath(params.next, "/onboarding")

  return (
    <div className="w-full max-w-md">
      <StepProgress current={2} />

      <div className="rounded-2xl bg-white px-8 py-10 shadow-sm text-center">
        <div className="mb-4 text-5xl">📬</div>
        <h1 className="mb-3 text-xl font-bold text-[#005F8C]">確認メールを送信しました</h1>
        <p className="mb-2 text-sm text-[#475569]">
          {email ? (
            <>
              <span className="font-medium text-[#1a2332]">{email}</span> 宛に確認メールをお送りしました。
            </>
          ) : (
            "ご登録のメールアドレスに確認メールをお送りしました。"
          )}
        </p>
        <p className="mb-8 text-sm text-[#475569]">
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>

        <div className="rounded-xl bg-[#f2f7fa] px-5 py-4 text-left text-sm text-[#475569] space-y-2">
          <p className="font-medium text-[#1a2332]">メールが届かない場合</p>
          <p>迷惑メールフォルダに振り分けられていることがあります。</p>
          <p>
            メールアドレスの入力を間違えた場合は、
            <Link href="/register" className="font-medium text-[#005F8C] hover:underline">
              こちらから登録をやり直して
            </Link>
            ください。
          </p>
        </div>

        {email && <ResendConfirmationForm email={email} next={next} />}

        <div className="mt-8 border-t pt-6 text-sm text-[#475569]">
          すでに確認済みの方は
          <Link href="/login" className="ml-1 text-[#005F8C] font-medium hover:underline">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  )
}

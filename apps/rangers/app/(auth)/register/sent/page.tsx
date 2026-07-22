import Link from "next/link"

const steps = ["アカウント作成", "メール確認", "利用開始"]

export default function RegisterSentPage() {
  return (
    <div className="w-full max-w-md">
      {/* ステップ */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {steps.map((label, i) => {
          const num = i + 1
          const done = num < 2
          const active = num === 2
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    done
                      ? "bg-[#005F8C]/20 text-white"
                      : active
                      ? "bg-[#005F8C] text-white"
                      : "border-2 border-[#dce3ea] text-[#64748b]"
                  }`}
                >
                  {done ? "✓" : num}
                </div>
                <span className={`text-sm ${active ? "font-medium text-[#005F8C]" : "text-[#64748b]"}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mb-5 mx-1 h-px w-8 ${done ? "bg-[#005F8C]/20" : "bg-[#dce3ea]"}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white px-8 py-10 shadow-sm text-center">
        <div className="mb-4 text-5xl">📬</div>
        <h1 className="mb-3 text-xl font-bold text-[#005F8C]">確認メールを送信しました</h1>
        <p className="mb-2 text-sm text-[#475569]">
          ご登録のメールアドレスに確認メールをお送りしました。
        </p>
        <p className="mb-8 text-sm text-[#475569]">
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>

        <div className="rounded-xl bg-[#f2f7fa] px-5 py-4 text-left text-sm text-[#475569] space-y-2">
          <p className="font-medium text-[#1a2332]">メールが届かない場合</p>
          <p>迷惑メールフォルダに振り分けられていることがあります。</p>
          <p>
            <span className="font-medium text-[#005F8C]">noreply@rangers.jp</span>{" "}
            からのメールが届くよう設定をご確認ください。
          </p>
        </div>

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

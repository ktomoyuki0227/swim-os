import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "利用規約",
  description: "Rangers の利用規約です。",
}

export default function TermsPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">Terms of Service</p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">利用規約</h1>
          <p className="text-sm text-[#64748b]">最終改定日: 2026年7月28日</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-10 text-[15px] leading-relaxed text-[#1a2332]">
          <p>
            この利用規約（以下「本規約」といいます）は、Rangers運営事業者（以下「当社」といいます）が提供するチーム運営管理サービス「Rangers」（以下「本サービス」といいます）の利用条件を定めるものです。登録利用者の皆様（以下「ユーザー」といいます）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <section>
            <h2 className="mb-3 text-lg font-bold">第1条（適用）</h2>
            <p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第2条（利用登録）</h2>
            <p>
              本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。当社は、登録希望者が以下のいずれかに該当する場合、利用登録の申請を承認しないことがあり、その理由については開示しない場合があります。
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、当社が利用登録を相当でないと判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第3条（アカウントの管理）</h2>
            <p>
              ユーザーは、自己の責任において、本サービスのログイン情報を適切に管理するものとします。ユーザーは、いかなる場合にも、ログイン情報を第三者に譲渡または貸与することはできません。ログイン情報の管理不十分、使用上の過誤、第三者の使用等によって生じた損害の責任はユーザーが負うものとし、当社は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第4条（参加費・会費等の支払い）</h2>
            <p>
              本サービスを通じて発生するセッション参加費・年会費・月謝・回数券代金等（以下「利用料金」といいます）の支払いは、当社が指定する決済代行事業者（Stripe, Inc.）を通じたクレジットカード決済または各チーム管理者が定める方法（現金等）によるものとします。ユーザーは、利用料金の支払い時期・返金・キャンセルポリシーについて、各チームが定める規定に従うものとします。
            </p>
            <p className="mt-3">
              クレジットカード決済における与信・請求手続きは決済代行事業者の規約に従います。カード情報は当社のサーバーを経由せず、決済代行事業者が管理します。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第5条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社、他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
              <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正な目的を持って本サービスを利用する行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第6条（本サービスの提供の停止等）</h2>
            <p>
              当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、当社が本サービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第7条（利用制限および登録抹消）</h2>
            <p>
              当社は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第8条（保証の否認および免責事項）</h2>
            <p>
              当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティ等に関する欠陥、エラーやバグ、権利侵害等を含みます）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p className="mt-3">
              当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第9条（サービス内容の変更等）</h2>
            <p>
              当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第10条（利用規約の変更）</h2>
            <p>
              当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。変更後の利用規約は、当社が別途定める場合を除いて、本サービス上に表示した時点より効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第11条（通知または連絡）</h2>
            <p>
              ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第12条（権利義務の譲渡の禁止）</h2>
            <p>
              ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第13条（準拠法・裁判管轄）</h2>
            <p>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社所在地を管轄する裁判所を専属的合意管轄とします。</p>
          </section>

          <p className="text-sm text-[#64748b]">
            本規約は一般的なひな形を基に作成した暫定版です。事業者情報の確定後、法務確認のうえ正式な内容に更新します。
          </p>
        </div>
      </div>
    </div>
  )
}

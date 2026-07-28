import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "Rangers のプライバシーポリシーです。",
}

export default function PrivacyPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">Privacy Policy</p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">プライバシーポリシー</h1>
          <p className="text-sm text-[#64748b]">最終改定日: 2026年7月28日</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-10 text-[15px] leading-relaxed text-[#1a2332]">
          <p>
            Rangers運営事業者（以下「当社」といいます）は、当社が提供するチーム運営管理サービス「Rangers」（以下「本サービス」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <section>
            <h2 className="mb-3 text-lg font-bold">第1条（取得する情報）</h2>
            <p>当社は、本サービスの提供にあたり、以下の情報を取得します。</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>氏名、フリガナ、生年月日、性別、住所、電話番号、メールアドレス等の登録情報</li>
              <li>緊急連絡先、水泳歴・級位等のプロフィール情報</li>
              <li>チームへの所属状況、参加セッション履歴、決済状況等の利用履歴</li>
              <li>クレジットカード情報（決済代行事業者Stripe, Inc.が直接取得・保持し、当社は保持しません）</li>
              <li>アクセスログ、Cookie、デバイス情報等の技術的情報</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第2条（利用目的）</h2>
            <p>当社は、取得した情報を以下の目的で利用します。</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>本サービスの提供、維持、保護および改善のため</li>
              <li>セッション参加登録、参加費・会費の決済処理のため</li>
              <li>チーム管理者からユーザーへの連絡・通知のため</li>
              <li>本人確認、不正利用の防止のため</li>
              <li>お問い合わせへの対応のため</li>
              <li>利用規約に違反する行為への対応のため</li>
              <li>上記利用目的に付随する目的のため</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第3条（決済情報の取扱い）</h2>
            <p>
              クレジットカードによる決済情報は、決済代行事業者であるStripe, Inc.が管理し、当社のサーバーには保存されません。当社は決済処理に必要な最小限の情報（決済ID、決済状況等）のみを保持します。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第4条（第三者提供）</h2>
            <p>
              当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供しません。
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              <li>所属チームの管理者が、チーム運営上必要な範囲でメンバー情報（氏名、参加状況、支払状況等）を閲覧する場合</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第5条（外部サービスの利用）</h2>
            <p>
              本サービスは、以下の外部サービスと連携しています。各サービスへの情報提供は、各サービスのプライバシーポリシーに従います。
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Stripe, Inc.（決済処理）</li>
              <li>Supabase Inc.（データベース・認証基盤）</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第6条（Cookie等の利用）</h2>
            <p>
              本サービスは、ログイン状態の維持等を目的として、Cookieおよび類似の技術を利用します。ブラウザの設定によりCookieを無効化できますが、その場合、本サービスの一部機能が利用できなくなることがあります。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第7条（安全管理措置）</h2>
            <p>
              当社は、個人情報の漏えい、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第8条（個人情報の開示・訂正・削除等）</h2>
            <p>
              ユーザーは、当社の定める手続きにより、自己の個人情報の開示、訂正、追加、削除、利用停止を請求することができます。請求方法は本サービス内のお問い合わせ窓口からご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第9条（プライバシーポリシーの変更）</h2>
            <p>
              当社は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に表示した時点から効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">第10条（お問い合わせ窓口）</h2>
            <p>本ポリシーに関するお問い合わせは、下記までご連絡ください。</p>
            <p className="mt-3 rounded-lg border border-[#dce3ea] bg-[#f2f7fa] p-4 text-[#64748b]">
              ［依頼企業からの受領後に記載］
            </p>
          </section>

          <p className="text-sm text-[#64748b]">
            本ポリシーは一般的なひな形を基に作成した暫定版です。事業者情報の確定後、法務確認のうえ正式な内容に更新します。
          </p>
        </div>
      </div>
    </div>
  )
}

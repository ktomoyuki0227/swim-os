import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "よくある質問",
  description: "Rangers のご利用に関するよくある質問をまとめました。",
}

const faqs = [
  {
    category: "サービスについて",
    items: [
      {
        q: "Rangers とはどんなサービスですか？",
        a: "Rangers は水泳の個人指導・グループレッスンを受けられるマッチングプラットフォームです。元日本代表やプロ競泳選手などのコーチが、あなたの目標に合わせてトレーニングを提供します。",
      },
      {
        q: "どんな種目に対応していますか？",
        a: "クロール・平泳ぎ・バタフライ・背泳ぎ・個人メドレーなど全種目に対応しています。スタートやターンの改善、マスターズ水泳、子供の水泳指導なども可能です。",
      },
      {
        q: "どこでレッスンを受けられますか？",
        a: "お近くのプールや水泳施設など、ご自身で指定した場所でレッスンを受けられます。コーチの対応エリア内であれば、さまざまな施設をご利用いただけます。",
      },
    ],
  },
  {
    category: "料金・お支払いについて",
    items: [
      {
        q: "入会金・月会費はかかりますか？",
        a: "入会金・月会費は一切不要です。受けたレッスンの料金のみお支払いいただきます。",
      },
      {
        q: "支払い方法は何が使えますか？",
        a: "クレジットカード（VISA・Mastercard・JCB・American Express・Diners Club）でのオンライン決済のみ対応しています。",
      },
      {
        q: "キャンセルポリシーを教えてください。",
        a: "レッスン開始48時間前までのキャンセルは全額返金されます。48時間以内は返金できない場合があります。詳しくは各レッスンのキャンセルポリシーをご確認ください。",
      },
    ],
  },
  {
    category: "コーチについて",
    items: [
      {
        q: "コーチはどのように選ばれていますか？",
        a: "競泳経験・指導実績・本人確認を厳格に審査した上で登録を認めています。元日本代表・オリンピック経験者・大学体育会OBなど実力のあるコーチのみ在籍しています。",
      },
      {
        q: "希望のコーチと連絡はできますか？",
        a: "はい。コーチのプロフィールページからメッセージを送ったり、日程リクエストを送ることができます。ただし、チャットのみでは予約は確定されません。",
      },
      {
        q: "コーチとして登録することはできますか？",
        a: "はい。指導員として登録できます。登録後、コーチとして審査を受けてレッスンを公開できます。",
      },
    ],
  },
  {
    category: "予約について",
    items: [
      {
        q: "予約の流れを教えてください。",
        a: "①会員登録 → ②コーチ・レッスンを選択 → ③日時を選択して申し込み → ④クレジットカードで決済 → ⑤予約確定 → ⑥レッスン当日に参加、の流れです。",
      },
      {
        q: "希望の日時がない場合はどうすればいいですか？",
        a: "コーチのプロフィールページから「日程リクエスト」を送ることができます。希望日時・場所・目標などを書いて送信すると、コーチから返答があります。",
      },
      {
        q: "グループレッスンとは何ですか？",
        a: "複数名が参加できるレッスン形式です。個人レッスンより費用を抑えながら、コーチの指導を受けられます。レッスン一覧から「グループ」で絞り込めます。",
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div>
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            FAQ
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">よくある質問</h1>
          <p className="text-[#5c6a7a]">
            解決しない場合は{" "}
            <Link href="/messages" className="text-[#005F8C] hover:underline">
              サポートへお問い合わせ
            </Link>{" "}
            ください
          </p>
        </div>
      </section>

      {/* FAQ本体 */}
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-12">
          {faqs.map((section) => (
            <section key={section.category}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-[#005F8C]" />
                <h2 className="text-lg font-bold">{section.category}</h2>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group overflow-hidden rounded-xl border bg-white transition-all open:shadow-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-medium">
                      <span>{item.q}</span>
                      <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f7fa]text-sm font-bold text-[#5c6a7a] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="border-t bg-[#f2f7fa]/20 px-6 py-4">
                      <p className="text-sm leading-relaxed text-[#5c6a7a]">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* お問い合わせ */}
        <div className="mt-16 rounded-2xl bg-sky-50 p-8 text-center">
          <p className="mb-1 font-semibold">解決しませんでしたか？</p>
          <p className="mb-5 text-sm text-[#5c6a7a]">
            サポートグループがお答えします。
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 rounded-full bg-[#005F8C] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
          >
            サポートに問い合わせる
          </Link>
        </div>
      </div>
    </div>
  )
}

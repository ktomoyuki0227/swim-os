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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-3 text-3xl font-bold">よくある質問</h1>
      <p className="mb-10 text-muted-foreground">
        解決しない場合は{" "}
        <Link href="/messages" className="text-blue-600 hover:underline">
          サポートへお問い合わせ
        </Link>{" "}
        ください
      </p>

      <div className="space-y-10">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="mb-4 border-l-4 border-blue-500 pl-3 text-lg font-bold">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border bg-card open:shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium list-none">
                    <span>{item.q}</span>
                    <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

# 作業ステータス
最終更新: 2026-05-14

## 進行中のプロジェクト
- Rangers → PoC 環境構築フェーズ（目標：5月末）
- SchoolBoost AI → ドキュメント整備完了・開発は Rangers 後に着手

## 担当分担（確定）
| アプリ | 担当 |
|--------|------|
| スイムトラッカー | 長畑さん |
| レンジャーズ | ともくん |
| スクールブースト AI | ともくん |
| スーパー支配人 | 長畑さん |

## 直近でやったこと
- 5/13 ミーティング完了
- Rangers・SchoolBoost AI の全ドキュメント整備・ブラッシュアップ完了
- SchoolBoost AI：スクラッチ方針確定、マルチテナント（school_id）設計追加、AI差別化を明記
- 開発順序を決定：Rangers 先行 → SchoolBoost AI（LINE 審査待ち期間を並行活用）

## 次にやること
- Rangers 環境構築
  - [ ] GitHub CLI ログイン（gh auth login）← ここから再開
  - [ ] GitHub リポジトリ作成（swim-os モノレポ構成）
  - [ ] Next.js 15 プロジェクト初期化（pnpm）
  - [ ] Tailwind CSS + shadcn/ui セットアップ
  - [ ] Supabase プロジェクト作成（Free プラン）
  - [ ] Vercel プロジェクト作成 + GitHub 連携
  - [ ] 環境変数設定（.env.local）
  - [ ] Stripe アカウント作成（テストモード）
- SchoolBoost AI：LINE Developers チャネル申請（審査待ちのため早めに）

## 環境構築メモ
- リポジトリ構成：swim-os モノレポ（apps/rangers, apps/school-boost など）
- GitHub CLI：winget でインストール済み。ターミナル再起動で PATH が反映される
- 再開手順：ターミナルを開き直して `gh auth login` を実行 → ブラウザでログイン

## 積み残し・ブロッカー
- キャンセルポリシー（Rangers）：長畑さん・長畑さんのお父様・レイカさんと要相談
- プラットフォーム手数料率（Rangers）：長畑さんと要相談
- QRコード出席確認の運用方法（SchoolBoost）：要後日確認
- プッシュ通知 vs LINE通知の方針（SchoolBoost）：長畑さん・長畑さんのお父さん・れいこさん・らいかさんと要相談

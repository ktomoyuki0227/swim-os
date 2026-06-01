---
version: 1.0
name: Rangers-design-system
description: マスターズ水泳チーム管理プラットフォーム。Apple のクリーンな構成をベースに、水泳の清涼感とスポーティな活気を加えたデザイン。50〜60代のユーザーが「見やすい・使いやすい」と感じるシンプルさを最優先にする。

colors:
  # ブランド・アクセント
  primary: "#005F8C"
  primary-hover: "#004E73"
  primary-on-dark: "#5BC0EB"
  accent: "#E8614D"
  accent-hover: "#D14E3B"

  # テキスト
  ink: "#1a2332"
  body: "#1a2332"
  body-on-dark: "#f7f9fb"
  body-muted: "#5c6a7a"
  ink-muted: "#8d99a8"

  # サーフェス
  canvas: "#ffffff"
  canvas-cool: "#f2f7fa"
  surface-card: "#ffffff"
  surface-dark: "#162234"
  surface-dark-alt: "#0d1821"

  # ステータス（支払い・通知）
  status-success: "#0f8a4f"
  status-success-bg: "#eaf7f0"
  status-warning: "#b8860b"
  status-warning-bg: "#fdf6e3"
  status-error: "#c0392b"
  status-error-bg: "#fdecea"
  status-info: "#005F8C"
  status-info-bg: "#e8f2f8"
  status-neutral: "#5c6a7a"
  status-neutral-bg: "#edf0f4"

  # ボーダー
  border: "#dce3ea"
  border-focus: "#005F8C"
  divider: "#e8edf2"

  # インタラクション
  on-primary: "#ffffff"
  on-accent: "#ffffff"

typography:
  hero:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.5px
  heading-lg:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.3px
  heading-md:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  heading-sm:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-strong:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: 0
  caption:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption-strong:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  small:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  tab-label:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0.5px

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    border: 1.5px solid "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  session-card:
    backgroundColor: "{colors.surface-card}"
    border: 1px solid "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 20px
  session-card-hover:
    border: 1px solid "{colors.primary}"
    boxShadow: "0 2px 8px rgba(0, 119, 182, 0.1)"
  status-badge-paid:
    backgroundColor: "{colors.status-success-bg}"
    textColor: "{colors.status-success}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  status-badge-pending:
    backgroundColor: "{colors.status-warning-bg}"
    textColor: "{colors.status-warning}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  status-badge-failed:
    backgroundColor: "{colors.status-error-bg}"
    textColor: "{colors.status-error}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  status-badge-refunded:
    backgroundColor: "{colors.status-neutral-bg}"
    textColor: "{colors.status-neutral}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  bottom-tab-bar:
    backgroundColor: "{colors.canvas}"
    borderTop: 1px solid "{colors.border}"
    height: 64px
    iconSize: 24px
    labelTypography: "{typography.tab-label}"
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.ink-muted}"
  header:
    backgroundColor: "{colors.canvas}"
    borderBottom: 1px solid "{colors.border}"
    height: 56px
    padding: 0 16px
  notification-bell:
    size: 24px
    badgeColor: "{colors.status-error}"
    badgeSize: 8px
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    border: 1px solid "{colors.border}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    minHeight: 48px
  input-focus:
    border: 2px solid "{colors.border-focus}"
  calendar-dot:
    color: "{colors.primary}"
    size: 6px
  calendar-today:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  course-banner:
    rounded: "{rounded.md}"
    padding: 12px 16px
    typography: "{typography.body-strong}"
  course-banner-ok:
    backgroundColor: "{colors.status-success-bg}"
    textColor: "{colors.status-success}"
  course-banner-warning:
    backgroundColor: "{colors.status-warning-bg}"
    textColor: "{colors.status-warning}"
  course-banner-danger:
    backgroundColor: "{colors.status-error-bg}"
    textColor: "{colors.status-error}"
  qr-code-container:
    backgroundColor: "{colors.canvas}"
    border: 1px solid "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 24px
  announcement-card:
    backgroundColor: "{colors.canvas}"
    border: 1px solid "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 16px
  fee-summary:
    backgroundColor: "{colors.canvas-cool}"
    rounded: "{rounded.lg}"
    padding: 20px
---

## Overview

Rangers はマスターズ水泳チーム向けの運営管理プラットフォーム。Apple のクリーンで信頼感のあるデザインをベースに、水泳の清涼感（ブルー）とスポーティな活力（オレンジアクセント）を加えている。

メインユーザーは50〜60代のチーム運営者とメンバー。視認性・操作のしやすさを最優先とし、以下を徹底する:

- フォントサイズは本文16px以上（Apple の17pxに近い読みやすさ）
- タッチターゲットは最小48px（Apple の44pxより少し大きく）
- ステータス表示は色 + テキストの両方で伝える（色覚多様性対応）
- 余白を十分に取り、情報密度を抑える

## Colors

### ブランドカラー
- Primary（#005F8C）: プールの水面を思わせる深みのあるブルー。全てのインタラクティブ要素に使用
- Accent（#E8614D）: スポーティな活力を感じるコーラル。LPのCTAなど限定的に使用

### ステータスカラー
| ステータス | 色 | 背景色 | 用途 |
|-----------|-----|-------|------|
| 支払い済み | #0f8a4f | #eaf7f0 | 緑バッジ |
| 未払い | #b8860b | #fdf6e3 | 黄バッジ |
| 決済失敗 | #c0392b | #fdecea | 赤バッジ |
| 返金済み | #5c6a7a | #edf0f4 | グレーバッジ |

### サーフェス
- canvas（#ffffff）: メイン背景
- canvas-cool（#f2f7fa）: セクション区切り、サマリカード背景（微かな水色ティントで水泳らしさを演出）
- surface-dark（#1e293b）: LP のダークセクション

## Typography

### フォント
Noto Sans JP（Google Fonts、可変ウェイト対応）。CLAUDE.md のルールに準拠。

### 階層
| 用途 | サイズ | ウェイト | 行間 |
|-----|-------|---------|------|
| Hero 見出し | 40px | 700 | 1.2 |
| セクション見出し | 28px | 700 | 1.3 |
| カード見出し | 22px | 600 | 1.4 |
| サブ見出し | 18px | 600 | 1.4 |
| 本文 | 16px | 400 | 1.6 |
| 本文強調 | 16px | 600 | 1.6 |
| キャプション | 14px | 400 | 1.5 |
| 小テキスト | 12px | 400 | 1.4 |
| タブラベル | 12px | 500 | 1.0 |

## Layout

### スペーシング
8px ベース。構造的なレイアウトは 8 / 12 / 16 / 24 / 32 / 48px にスナップ。

### レスポンシブ
| ブレークポイント | 幅 | レイアウト |
|---------------|-----|----------|
| モバイル | 〜767px | 1カラム。下部タブバー。メイン対象 |
| タブレット | 768〜1023px | 2カラム |
| デスクトップ | 1024px〜 | 最大幅1280px、中央寄せ |

モバイルファーストで設計。全ページでモバイル（375px）から実装を開始する。

### 下部タブバー
- 高さ64px
- アイコン24px + ラベル12px
- アクティブ: primary（#005F8C）
- 非アクティブ: ink-muted（#8d99a8）
- アドミン: 4タブ / メンバー: 3タブ

### ヘッダー
- 高さ56px
- 右上: ベルアイコン（未読バッジ赤丸）+ アバターアイコン
- アドミン/メンバーモード切り替えトグル

## Components

### ボタン
- Primary: ブルー pill、高さ48px以上。メインアクション（参加する、作成する）
- Secondary: ブルー枠の pill。サブアクション（キャンセル、戻る）
- Accent: オレンジ pill。特に目立たせたい CTA（LINEで始める）
- Ghost: 背景なし。補助的なアクション

### セッションカード
- 白背景 + ボーダー + 角丸14px
- ホバー時にボーダーが primary に変化 + 微かなシャドウ
- 内容: タイトル / 日時 / 場所 / 料金 / 参加人数 / ステータスバッジ

### ステータスバッジ
- pill 型（角丸9999px）
- 背景色 + テキスト色で表現
- 支払い済み: 緑 / 未払い: 黄 / 決済失敗: 赤 / 返金済み: グレー

### コース判定バナー
- OK（開催可能）: 緑系背景
- 注意（最低人数ギリギリ）: 黄系背景
- 危険（中止検討）: 赤系背景

### カレンダー
- セッションがある日にブルーのドット表示
- 今日の日付は primary 丸背景 + 白テキスト
- 日付タップでその日のセッション一覧を表示

### フォーム入力
- 高さ48px以上
- 角丸10px
- フォーカス時にボーダーが primary に変化（2px）

### QR コード
- 白背景 + ボーダー + 角丸14px + パディング24px
- 下にコピーボタン

## Do's and Don'ts

### Do
- Primary（#005F8C）を全てのインタラクティブ要素に一貫して使用する
- ステータスは色 + テキストの両方で伝える（「支払い済み」と緑バッジ）
- タッチターゲットは48px以上を厳守
- 余白を十分に取り、50〜60代が快適に読める密度にする
- セクション区切りは canvas ↔ canvas-cool の背景色切り替えで表現する
- Accent（#E8614D）は LP の CTA など、本当に目立たせたい箇所だけに限定する

### Don't
- Accent を多用しない（1ページに1〜2箇所まで）
- 12px 未満のテキストを使わない
- ボーダーとシャドウを同時に使わない（どちらか片方）
- 装飾的なグラデーションを使わない（写真やイラストで雰囲気を出す）
- ダークモードは実装しない（ライトテーマ一本）
- DESIGN.md に定義されていない色・フォント・余白を独自に追加しない

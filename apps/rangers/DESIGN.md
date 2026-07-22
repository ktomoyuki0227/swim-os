---
version: "1.2"
name: Rangers-design-system
description: >
  マスターズ水泳チーム管理プラットフォーム。
  Apple のクリーンな余白哲学をベースに、Airbnb のコミュニティ温かみと Intercom の明快なコンポーネント設計を統合。
  50〜60代のユーザーが「見やすい・使いやすい」と感じるシンプルさを最優先とし、
  水泳の清涼感（ブルー）とスポーティな活力（コーラルアクセント）を演出する。
  ロールモデル: Apple（余白・信頼感）× Airbnb（コミュニティ・モバイル）× Intercom（コンポーネント仕様）

# ─────────────────────────────────────────────
# COLORS
# ─────────────────────────────────────────────
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
  body-muted: "#475569"
  ink-muted: "#64748b"

  # サーフェス
  canvas: "#ffffff"
  canvas-cool: "#f2f7fa"
  surface-card: "#ffffff"
  surface-dark: "#162234"
  surface-dark-alt: "#0d1821"

  # ステータス — 支払い・バッジ
  status-success: "#0f8a4f"
  status-success-bg: "#eaf7f0"
  status-warning: "#b8860b"          # 支払い未払い・コース判定の注意系（暗めの黄金色）
  status-warning-bg: "#fdf6e3"
  status-update: "#d97706"           # 更新・リマインダー系（明るいアンバー）
  status-update-bg: "#fef3c7"
  status-error: "#c0392b"
  status-error-bg: "#fdecea"
  status-info: "#005F8C"
  status-info-bg: "#e8f2f8"
  status-neutral: "#475569"
  status-neutral-bg: "#edf0f4"

  # ボーダー
  border: "#dce3ea"
  border-focus: "#005F8C"
  border-error: "#c0392b"
  divider: "#e8edf2"

  # インタラクション
  on-primary: "#ffffff"
  on-accent: "#ffffff"

  # オーバーレイ
  overlay: "rgba(0, 0, 0, 0.45)"
  overlay-light: "rgba(0, 0, 0, 0.08)"

# ─────────────────────────────────────────────
# TYPOGRAPHY
# ─────────────────────────────────────────────
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
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  tab-label:
    fontFamily: "'Noto Sans JP', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0.5px

# ─────────────────────────────────────────────
# ROUNDED
# ─────────────────────────────────────────────
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  pill: 9999px
  full: 9999px

# ─────────────────────────────────────────────
# SPACING
# ─────────────────────────────────────────────
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

# ─────────────────────────────────────────────
# SHADOWS  — Airbnb の単層シャドウ哲学をベースに3段階
# ─────────────────────────────────────────────
shadows:
  sm: "0 1px 4px rgba(0, 0, 0, 0.06)"
  # カードホバー・フォーカス時の浮き上がり
  md: "0 4px 16px rgba(0, 0, 0, 0.10)"
  # ドロップダウン・モーダル
  lg: "0 8px 32px rgba(0, 0, 0, 0.14)"
  # トースト・フローティングボタン

# ─────────────────────────────────────────────
# MOTION
# ─────────────────────────────────────────────
motion:
  duration-fast: 120ms
  duration-base: 200ms
  duration-slow: 300ms
  easing-default: "ease"
  easing-enter: "ease-out"
  easing-exit: "ease-in"
  # 使用例:
  #   ホバー・フォーカス → duration-fast + easing-default
  #   モーダル開閉      → duration-base + easing-enter/exit
  #   トースト入退場    → duration-slow + easing-enter/exit

# ─────────────────────────────────────────────
# Z-INDEX
# ─────────────────────────────────────────────
zIndex:
  base: 0
  card: 1
  sticky: 100       # スティッキーヘッダー
  dropdown: 200     # ドロップダウン・メニュー
  backdrop: 300     # モーダルの背景幕
  modal: 400        # モーダルコンテナ
  toast: 500        # トースト（最前面）

# ─────────────────────────────────────────────
# COMPONENTS
# ─────────────────────────────────────────────
components:

  # ── ボタン ───────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    opacity: 0.5
    pointerEvents: none

  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    border: "1.5px solid {colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-secondary-disabled:
    opacity: 0.5
    pointerEvents: none

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
    minHeight: 44px

  button-destructive:
    backgroundColor: "{colors.status-error}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
    minHeight: 48px
  button-destructive-hover:
    backgroundColor: "#a93226"

  # ── フォーム入力 ─────────────────────────────
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    minHeight: 48px
  input-focus:
    border: "2px solid {colors.border-focus}"
    outline: none
  input-error:
    border: "2px solid {colors.border-error}"
  input-error-message:
    textColor: "{colors.status-error}"
    typography: "{typography.small}"
    marginTop: 4px
  input-disabled:
    backgroundColor: "{colors.canvas-cool}"
    textColor: "{colors.ink-muted}"
    opacity: 0.6
    pointerEvents: none

  # ── カード ───────────────────────────────────
  session-card:
    backgroundColor: "{colors.surface-card}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: 20px
  session-card-hover:
    border: "1px solid {colors.primary}"
    boxShadow: "{shadows.sm}"

  announcement-card:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: 16px

  fee-summary:
    backgroundColor: "{colors.canvas-cool}"
    rounded: "{rounded.lg}"
    padding: 20px

  qr-code-container:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: 24px

  # ── ステータスバッジ ─────────────────────────
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
  status-badge-neutral:
    backgroundColor: "{colors.status-neutral-bg}"
    textColor: "{colors.status-neutral}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  status-badge-info:
    backgroundColor: "{colors.status-info-bg}"
    textColor: "{colors.status-info}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: 4px 12px

  # ── タブ（アンダーライン型）────────────────────
  # Airbnb の product-tab パターンを踏襲
  tab-active:
    textColor: "{colors.primary}"
    typography: "{typography.caption-strong}"
    borderBottom: "2px solid {colors.primary}"
    minHeight: 44px
    padding: 10px 16px
  tab-inactive:
    textColor: "{colors.body-muted}"
    typography: "{typography.caption}"
    borderBottom: "2px solid transparent"
    minHeight: 44px
    padding: 10px 16px
  tab-inactive-hover:
    textColor: "{colors.ink}"

  # ── アバター ─────────────────────────────────
  avatar-sm:
    size: 32px
    rounded: "{rounded.full}"
    backgroundColor: "rgba(0, 95, 140, 0.1)"
    textColor: "{colors.primary}"
    typography: "{typography.small}"
    fontWeight: 600
  avatar-md:
    size: 40px
    rounded: "{rounded.full}"
    backgroundColor: "rgba(0, 95, 140, 0.1)"
    textColor: "{colors.primary}"
    typography: "{typography.caption-strong}"
  avatar-lg:
    size: 48px
    rounded: "{rounded.full}"
    backgroundColor: "rgba(0, 95, 140, 0.1)"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
  avatar-xl:
    size: 80px
    rounded: "{rounded.full}"
    backgroundColor: "rgba(0, 95, 140, 0.1)"
    textColor: "{colors.primary}"
    typography: "{typography.heading-sm}"

  # ── モーダル ─────────────────────────────────
  # Intercom のカード浮き + Airbnb のオーバーレイ設計を統合
  modal-backdrop:
    backgroundColor: "{colors.overlay}"
    position: fixed
    inset: 0
    minHeight: 100dvh            # iOS Safari アドレスバー問題を回避
    zIndex: "{zIndex.backdrop}"
    display: flex
    alignItems: flex-end         # モバイル: ボトムシート
    alignItemsSm: center         # タブレット以上: 中央
  modal-container:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: 24px
    width: "100%"
    maxWidth: 480px
    zIndex: "{zIndex.modal}"
    boxShadow: "{shadows.lg}"
    borderTopLeftRadius: "{rounded.lg}"   # モバイルはtop-leftのみ
    borderTopRightRadius: "{rounded.lg}"
  modal-header:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
    marginBottom: 16px
  modal-footer:
    display: flex
    gap: 8px
    marginTop: 24px
    justifyContent: flex-end

  # ── トースト / スナックバー ───────────────────
  toast:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.body-on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    boxShadow: "{shadows.lg}"
    position: fixed
    bottom: 96px          # タブバー(64px) + 余白(32px)
    right: 16px
    zIndex: "{zIndex.toast}"
    maxWidth: 320px
    autoDismiss: 3500ms
  toast-success:
    borderLeft: "4px solid {colors.status-success}"
  toast-error:
    borderLeft: "4px solid {colors.status-error}"
  toast-info:
    borderLeft: "4px solid {colors.primary}"

  # ── ローディング / スケルトン ──────────────────
  skeleton:
    backgroundColor: "{colors.status-neutral-bg}"
    rounded: "{rounded.sm}"
    animation: "pulse 1.5s ease-in-out infinite"
  skeleton-text:
    height: 16px
    rounded: "{rounded.sm}"
  skeleton-card:
    height: 80px
    rounded: "{rounded.lg}"

  # ── エンプティステート ────────────────────────
  empty-state:
    display: flex
    flexDirection: column
    alignItems: center
    padding: 48px 24px
  empty-state-icon-wrapper:
    size: 48px
    rounded: "{rounded.full}"
    backgroundColor: "rgba(0, 95, 140, 0.08)"
    display: flex
    alignItems: center
    justifyContent: center
    marginBottom: 12px
  empty-state-icon:
    size: 24px
    color: "{colors.ink-muted}"
  empty-state-title:
    typography: "{typography.body-strong}"
    textColor: "{colors.ink}"
    marginBottom: 4px
  empty-state-description:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"

  # ── ドロップダウン / メニュー ──────────────────
  # 例外: dropdown と select-content は「浮き上がり表現」が必要なため border + shadow を併用許可
  dropdown:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    boxShadow: "{shadows.md}"
    zIndex: "{zIndex.dropdown}"
    minWidth: 160px
    padding: 4px 0
  dropdown-item:
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    minHeight: 44px
    padding: 10px 16px
  dropdown-item-hover:
    backgroundColor: "{colors.canvas-cool}"
  dropdown-item-danger:
    textColor: "{colors.status-error}"

  # ── プログレスバー ────────────────────────────
  progress-track:
    backgroundColor: "{colors.status-neutral-bg}"
    rounded: "{rounded.pill}"
    height: 8px
    overflow: hidden
  progress-bar-primary:
    backgroundColor: "{colors.primary}"
    height: 100%
  progress-bar-success:
    backgroundColor: "{colors.status-success}"
    height: 100%
  progress-bar-warning:
    backgroundColor: "{colors.status-warning}"
    height: 100%
  progress-bar-error:
    backgroundColor: "{colors.status-error}"
    height: 100%

  # ── 通知カード ────────────────────────────────
  notification-card-unread:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    borderLeft: "4px solid {colors.primary}"
    rounded: "{rounded.md}"
    padding: 16px
  notification-card-read:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: 16px
  notification-title-unread:
    typography: "{typography.caption-strong}"
    textColor: "{colors.ink}"
  notification-title-read:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
  notification-body:
    typography: "{typography.small}"
    textColor: "{colors.body-muted}"
  notification-timestamp:
    typography: "{typography.small}"
    textColor: "{colors.ink-muted}"
  notification-icon-size: 20px

  # ── コース判定バナー ──────────────────────────
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

  # ── ナビゲーション ────────────────────────────
  bottom-tab-bar:
    backgroundColor: "{colors.canvas}"
    borderTop: "1px solid {colors.border}"
    height: 64px
    iconSize: 24px
    labelTypography: "{typography.tab-label}"
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.ink-muted}"
  header:
    backgroundColor: "{colors.canvas}"
    borderBottom: "1px solid {colors.border}"
    height: 64px
    padding: 0 16px
  notification-bell:
    size: 24px
    badgeColor: "{colors.status-error}"
    badgeSize: 8px

  # ── カレンダー ────────────────────────────────
  calendar-dot:
    color: "{colors.primary}"
    size: 6px
  calendar-today:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"

  # ── フォーカスリング（キーボードナビ）────────────
  focus-ring:
    outline: "2px solid {colors.primary}"
    outlineOffset: 2px
    borderRadius: "{rounded.sm}"

  # ── Select（セレクター）─────────────────────────
  # Radix UI SelectPrimitive ベース
  # Intercom の明快な状態定義 × Apple の余白設計
  select-trigger:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    minHeight: 48px
    typography: "{typography.body}"
  select-trigger-focus:
    border: "2px solid {colors.border-focus}"
    outline: none
  select-trigger-error:
    border: "2px solid {colors.border-error}"
  select-trigger-disabled:
    backgroundColor: "{colors.canvas-cool}"
    textColor: "{colors.ink-muted}"
    opacity: 0.6
    pointerEvents: none
  select-trigger-sm:
    minHeight: 36px
    padding: "8px 12px"
    typography: "{typography.caption}"
  select-content:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    boxShadow: "{shadows.md}"
    padding: "4px 0"
    zIndex: "{zIndex.dropdown}"
    maxHeight: 320px
    overflowY: auto
  select-item:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    minHeight: 44px
    padding: "10px 16px"
    cursor: pointer
  select-item-hover:
    backgroundColor: "{colors.canvas-cool}"
  select-item-selected:
    textColor: "{colors.primary}"
    fontWeight: 600
    backgroundColor: "{colors.status-info-bg}"
  select-group-label:
    typography: "{typography.small}"
    textColor: "{colors.ink-muted}"
    padding: "8px 16px 4px"
    fontWeight: 600
  select-separator:
    backgroundColor: "{colors.divider}"
    height: 1px
    margin: "4px 0"

  # ── Checkbox ──────────────────────────────────
  # Airbnb の包括的アクセシビリティ × Intercom の状態定義
  checkbox:
    size: 16px                     # 実装値 h-4 w-4 (16px) に合わせて修正
    rounded: "{rounded.sm}"
    border: "1.5px solid {colors.border}"
    backgroundColor: "{colors.canvas}"
  checkbox-checked:
    border: "1.5px solid {colors.primary}"
    backgroundColor: "{colors.primary}"
    checkmarkColor: "#ffffff"
  checkbox-indeterminate:
    border: "1.5px solid {colors.primary}"
    backgroundColor: "{colors.primary}"
    dashColor: "#ffffff"
  checkbox-disabled:
    opacity: 0.5
    pointerEvents: none
  checkbox-label:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
    paddingLeft: 10px
  # checkbox + label のタップ領域（44px 以上確保）
  checkbox-wrapper:
    display: flex
    alignItems: center
    minHeight: 44px
    gap: 10px
    cursor: pointer
  # グループ枠付きパターン（fee flag selector など）
  checkbox-group:
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    overflow: hidden
  checkbox-group-item:
    padding: "12px 16px"
    minHeight: 48px
    backgroundColor: "{colors.canvas}"
    display: flex
    alignItems: center
    gap: 10px
  checkbox-group-item-hover:
    backgroundColor: "{colors.canvas-cool}"
  checkbox-group-item-divider:
    height: 1px
    backgroundColor: "{colors.divider}"
  # タグ トグルパターン（pill ボタンで選択状態を切り替え）
  checkbox-tag-unselected:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.caption}"
    minHeight: 36px
  checkbox-tag-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "1px solid transparent"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.caption-strong}"
    minHeight: 36px

  # ── Radio Button ──────────────────────────────
  # :has() CSS ベースのカード選択 UI（join-form.tsx パターン）
  # 実際の input[type=radio] は視覚的に隠し、カード全体をクリック可能にする
  radio-option:
    border: "1.5px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
    backgroundColor: "{colors.canvas}"
    minHeight: 52px
    cursor: pointer
    transition: "border-color 120ms ease, background-color 120ms ease"
  radio-option-checked:
    border: "1.5px solid {colors.primary}"
    backgroundColor: "{colors.status-info-bg}"
  radio-option-hover:
    borderColor: "{colors.primary}"
  radio-option-label:
    typography: "{typography.body-strong}"
    textColor: "{colors.ink}"
  radio-option-description:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
    marginTop: 2px
  # 従来型ラジオボタン（丸型・小さいフォーム内）
  radio-circle:
    size: 20px
    rounded: "{rounded.pill}"
    border: "1.5px solid {colors.border}"
    backgroundColor: "{colors.canvas}"
  radio-circle-checked:
    border: "5px solid {colors.primary}"
    backgroundColor: "{colors.canvas}"

  # ── Toggle / Switch ───────────────────────────
  # profile/page.tsx の Toggle コンポーネントを仕様化
  toggle:
    width: 44px
    height: 24px
    rounded: "{rounded.pill}"
    border: "2px solid transparent"
    backgroundColor: "{colors.border}"
    transition: "background-color 200ms ease"
    role: switch
    # WAI-ARIA: role="switch" aria-checked
  toggle-checked:
    backgroundColor: "{colors.primary}"
  toggle-thumb:
    size: 20px
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.canvas}"
    boxShadow: "{shadows.sm}"
    transition: "transform 200ms ease"
  toggle-thumb-unchecked:
    transform: "translateX(0px)"
  toggle-thumb-checked:
    transform: "translateX(20px)"
  toggle-label:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
  toggle-description:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
  # label + toggle の行レイアウト
  toggle-wrapper:
    display: flex
    alignItems: center
    justifyContent: space-between
    gap: 12px
    minHeight: 44px
    padding: "10px 0"

  # ── Textarea ──────────────────────────────────
  # Apple の落ち着いた入力スタイル × Intercom の状態定義
  textarea:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    minHeight: 120px
    lineHeight: 1.6
    resize: vertical
  textarea-focus:
    border: "2px solid {colors.border-focus}"
    outline: none
  textarea-error:
    border: "2px solid {colors.border-error}"
  textarea-disabled:
    backgroundColor: "{colors.canvas-cool}"
    textColor: "{colors.ink-muted}"
    opacity: 0.6
    pointerEvents: none
    resize: none
  # チャット用（メッセージ入力・自動リサイズ）
  textarea-chat:
    minHeight: 44px
    maxHeight: 120px
    resize: none
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    typography: "{typography.body}"

  # ── Form Group ────────────────────────────────
  # label + input/select/textarea + hint/error の標準ラッパーパターン
  # Intercom の「実装に迷いを生まない」コンポーネント定義を踏襲
  form-group:
    display: flex
    flexDirection: column
    gap: 6px
    marginBottom: 16px
  form-label:
    typography: "{typography.caption-strong}"
    textColor: "{colors.body-muted}"
    display: block
  form-label-required:
    # label 末尾に " *"（asterisk）を赤で追加
    afterContent: " *"
    afterColor: "{colors.status-error}"
  form-hint:
    typography: "{typography.small}"
    textColor: "{colors.ink-muted}"
    marginTop: 2px
  # フォームセクション（複数フォームグループをまとめるラッパー）
  form-section:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "20px"
    marginBottom: 16px
  form-section-title:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
    marginBottom: 16px
    paddingBottom: 12px
    borderBottom: "1px solid {colors.divider}"

  # ── Divider / Separator ───────────────────────
  divider:
    height: 1px
    backgroundColor: "{colors.divider}"   # #e8edf2
    margin: "0"
  divider-light:
    height: 1px
    backgroundColor: "{colors.canvas-cool}"  # #f2f7fa — セクション間の軽い区切り
  divider-spacing:
    margin: "16px 0"
  # テキスト付き区切り線（ログイン画面「または」等）
  divider-with-label:
    display: flex
    alignItems: center
    gap: 12px
    margin: "16px 0"
  divider-with-label-line:
    flexGrow: 1
    height: 1px
    backgroundColor: "{colors.divider}"
  divider-with-label-text:
    typography: "{typography.small}"
    textColor: "{colors.ink-muted}"
    whiteSpace: nowrap

  # ── Section Header ────────────────────────────
  # ページ内セクションのタイトル + アクションリンク行
  # Apple の「タイトル左・アクション右」パターン
  section-header:
    display: flex
    alignItems: center
    justifyContent: space-between
    marginBottom: 12px
    minHeight: 32px
  section-header-title:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
  section-header-action:
    typography: "{typography.caption}"
    textColor: "{colors.primary}"
    minHeight: 44px               # タッチターゲット確保のため padding で確保
    display: flex
    alignItems: center
  # コンパクト版（カード内のサブセクション）
  section-subheader:
    display: flex
    alignItems: center
    justifyContent: space-between
    marginBottom: 8px
  section-subheader-title:
    typography: "{typography.caption-strong}"
    textColor: "{colors.body-muted}"

  # ── Link ──────────────────────────────────────
  # インラインリンク（文中）
  link-inline:
    textColor: "{colors.primary}"
    textDecoration: underline
    textUnderlineOffset: "2px"
    typography: inherit
  link-inline-hover:
    textColor: "{colors.primary-hover}"
  # スタンドアロンリンク（リスト・カード内のアクション）
  link-standalone:
    textColor: "{colors.primary}"
    typography: "{typography.caption-strong}"
    textDecoration: none
    minHeight: 44px
    display: inline-flex
    alignItems: center
  link-standalone-hover:
    textDecoration: underline
    textUnderlineOffset: "2px"
  # 危険アクションリンク（退会・削除など）
  link-danger:
    textColor: "{colors.status-error}"
    typography: "{typography.caption}"
    textDecoration: none
  link-danger-hover:
    textDecoration: underline

  # ── Icon System ───────────────────────────────
  # Lucide React（stroke 系アイコン）。stroke-width は Rangers 慣例値
  icon-xs:
    size: 14px
    strokeWidth: 2
  icon-sm:
    size: 16px
    strokeWidth: 2
  icon-md:
    size: 20px
    strokeWidth: 1.8   # 通知・カード内の中サイズアイコン（Rangers 慣例）
  icon-lg:
    size: 24px
    strokeWidth: 1.8   # タブバー・ヘッダー・アクションボタン（Rangers 全体で 1.8 に統一）
  icon-xl:
    size: 32px
    strokeWidth: 1.8   # エンプティステート・ヒーロー
  # カラートークン（Lucide color プロップに渡す）
  icon-on-primary:
    color: "{colors.on-primary}"
  icon-muted:
    color: "{colors.ink-muted}"
  icon-primary:
    color: "{colors.primary}"
  icon-success:
    color: "{colors.status-success}"
  icon-warning:
    color: "{colors.status-warning}"
  icon-error:
    color: "{colors.status-error}"

  # ── Tag / Chip ────────────────────────────────
  # プロフィール編集・フィルター用タグ（TagGroup/TagRow パターン）
  tag-unselected:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.caption}"
    minHeight: 36px
    cursor: pointer
  tag-unselected-hover:
    borderColor: "{colors.primary}"
    textColor: "{colors.primary}"
  tag-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "1px solid transparent"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.caption-strong}"
    minHeight: 36px
  # 読み取り専用タグ（表示のみ・TagRow の collapsed 状態）
  tag-display:
    backgroundColor: "rgba(0, 95, 140, 0.10)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
    typography: "{typography.small}"
  # 「+N件」展開ボタン
  tag-expand-button:
    textColor: "{colors.primary}"
    typography: "{typography.small}"
    textDecoration: underline
    textUnderlineOffset: "2px"
    minHeight: 36px

  # ── Segment Tab（ピル型タブ）──────────────────
  # スケジュール・ダッシュボードなどの「すべて/登録済み/過去」切り替え
  # Airbnb の pill 哲学をタブ選択 UI に応用
  segment-tab-track:
    backgroundColor: "{colors.canvas-cool}"
    rounded: "{rounded.lg}"
    padding: 4px
    display: flex
    gap: 2px
  segment-tab-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    typography: "{typography.caption-strong}"
    padding: "8px 14px"
    boxShadow: "{shadows.sm}"
    minHeight: 36px
  segment-tab-inactive:
    backgroundColor: transparent
    textColor: "{colors.body-muted}"
    rounded: "{rounded.md}"
    typography: "{typography.caption}"
    padding: "8px 14px"
    minHeight: 36px
  segment-tab-inactive-hover:
    textColor: "{colors.ink}"
  # カウントバッジ（タブ内の件数表示）
  segment-tab-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "1px 7px"
    typography: "{typography.small}"
    marginLeft: 4px
  segment-tab-badge-inactive:
    backgroundColor: "{colors.status-neutral-bg}"
    textColor: "{colors.body-muted}"

  # ── Stamp Card（回数券進捗）───────────────────
  # stamp-section.tsx の進捗ドット UI を仕様化
  stamp-dot-unused:
    size: 28px
    rounded: "{rounded.pill}"
    border: "2px solid {colors.border}"
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.small}"
    display: flex
    alignItems: center
    justifyContent: center
  stamp-dot-used:
    size: 28px
    rounded: "{rounded.pill}"
    border: "2px solid {colors.primary}"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.small}"
    content: "✓"
  stamp-progress-track:
    height: 8px
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.status-neutral-bg}"
    overflow: hidden
  stamp-progress-fill:
    height: "100%"
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    transition: "width 500ms ease-out"
  stamp-card-header:
    display: flex
    alignItems: center
    gap: 12px
    marginBottom: 12px
  stamp-card-stats:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
    marginTop: 4px

  # ── Search Bar ────────────────────────────────
  # Airbnb の pill 形状 × Apple の明確なアイコン活用
  search-bar:
    display: flex
    gap: 8px
    alignItems: center
  search-bar-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-muted}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.pill}"
    padding: "10px 44px 10px 44px"  # 両端にアイコン・ボタン分の余白
    minHeight: 48px
    typography: "{typography.body}"
    flexGrow: 1
  search-bar-input-focus:
    border: "2px solid {colors.border-focus}"
    outline: none
  search-bar-icon:
    size: 20px
    color: "{colors.ink-muted}"
    pointerEvents: none
  search-bar-submit:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    minHeight: 48px
    typography: "{typography.caption-strong}"
    flexShrink: 0

  # ── Privacy Badge ─────────────────────────────
  # プロフィールページの情報公開範囲表示
  privacy-badge-private:
    display: flex
    alignItems: center
    gap: 4px
    textColor: "{colors.ink-muted}"
    typography: "{typography.small}"
    iconSize: 12px
  privacy-badge-public:
    display: flex
    alignItems: center
    gap: 4px
    textColor: "{colors.primary}"
    typography: "{typography.small}"
    iconSize: 12px

  # ── Collapsible ───────────────────────────────
  # invite-code-input.tsx の折りたたみ式フォームパターン
  collapsible-trigger:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
    minHeight: 48px
    width: "100%"
    display: flex
    alignItems: center
    gap: 8px
    cursor: pointer
  collapsible-trigger-hover:
    borderColor: "{colors.primary}"
    textColor: "{colors.primary}"
  collapsible-content:
    backgroundColor: "{colors.canvas-cool}"
    rounded: "{rounded.md}"
    padding: 16px
    marginTop: 8px
    animation: "fadeIn 200ms ease-out"

  # ── Member Card（メンバー一覧・各種ページ共通）──
  # メンバーリスト・チーム詳細・サブスク管理など全ページ共通のメンバー行
  member-card:
    display: flex
    alignItems: center
    gap: 12px
    padding: "12px 16px"
    minHeight: 64px
    backgroundColor: "{colors.canvas}"
  member-card-hover:
    backgroundColor: "{colors.canvas-cool}"
  member-card-name:
    typography: "{typography.body-strong}"
    textColor: "{colors.ink}"
  member-card-meta:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
    marginTop: 2px

  # ── Info Row（ラベル + 値の行）─────────────────
  # チーム詳細・プロフィール・設定ページの情報表示行
  info-row:
    display: flex
    alignItems: flex-start
    gap: 12px
    padding: "12px 0"
    borderBottom: "1px solid {colors.divider}"
  info-row-label:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
    minWidth: 80px
    flexShrink: 0
  info-row-value:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
    flexGrow: 1

  # ── Day Label（日付ブロック）──────────────────
  # セッション一覧・スケジュールの日付見出しブロック
  day-label:
    backgroundColor: "rgba(0, 95, 140, 0.08)"  # primary の薄い色
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    display: inline-flex
    alignItems: center
    gap: 6px
  day-label-date:
    typography: "{typography.caption-strong}"
    textColor: "{colors.primary}"
  day-label-day:
    typography: "{typography.caption}"
    textColor: "{colors.body-muted}"
---

## Overview

Rangers はマスターズ水泳チーム向けの運営管理プラットフォーム。

**デザイン哲学（3社統合）:**
- **Apple** — 十分な余白・信頼感のある青・シンプルさを最優先。「UI が消えて、コンテンツが見える」状態を目指す
- **Airbnb** — ホスト（コーチ）とゲスト（メンバー）の2ロール構造。pill 形状・大きな角丸・温かみのある白地で人を中心にしたUI
- **Intercom** — コンポーネント仕様の明快さ。モーダル・トースト・フォームエラーなどの状態を細かく定義し、実装に迷いを生まない

メインユーザーは50〜60代のチーム運営者とメンバー。視認性・操作のしやすさを最優先とする:
- フォントサイズは本文16px以上
- タッチターゲットは最小48px
- ステータス表示は色＋テキストの両方で伝える（色覚多様性対応）
- 余白を十分に取り、情報密度を抑える

## Colors

### ブランドカラー
- Primary（#005F8C）: プールの水面を思わせる深みのあるブルー。全インタラクティブ要素に使用
- Accent（#E8614D）: スポーティな活力を感じるコーラル。LP の主要 CTA のみに使用。アプリ内画面では使用しない（削除ボタン等の危険アクションは status-error #c0392b を使う）

### ステータスカラー — 意味の使い分け

| ステータス | 色 | 背景色 | 用途 |
|---|---|---|---|
| 支払い済み・成功 | #0f8a4f | #eaf7f0 | 緑バッジ・完了アイコン |
| 未払い・注意 | #b8860b | #fdf6e3 | 支払い状態の警告バッジ・コース判定の注意表示 |
| 更新・リマインダー | #d97706 | #fef3c7 | session_updated / session_reminder / stamp_low / fee_reminder の通知アイコン |
| エラー・失敗 | #c0392b | #fdecea | 決済失敗・キャンセル・エラー |
| 情報 | #005F8C | #e8f2f8 | 中立的な案内 |
| ニュートラル | #5c6a7a | #edf0f4 | 返金済み・非アクティブ |

`status-warning`（#b8860b）と `status-update`（#d97706）は意味が異なる。`status-warning` は支払い系の「未払い」およびコース判定の「注意」表示に使用し、`status-update` は「更新・お知らせ」系通知アイコンに使用する。

### サーフェス
- canvas（#ffffff）: メイン背景
- canvas-cool（#f2f7fa）: セクション区切り・サマリカード背景（水色ティントで水泳らしさを演出）
- surface-dark（#162234）: LP のダークセクション

## Typography

Noto Sans JP（Google Fonts・可変ウェイト対応）で統一。

| 用途 | サイズ | ウェイト | 行間 |
|---|---|---|---|
| Hero 見出し | 40px | 700 | 1.2 |
| セクション見出し | 28px | 700 | 1.3 |
| カード見出し | 22px | 600 | 1.4 |
| サブ見出し | 18px | 600 | 1.4 |
| 本文 | 16px | 400 | 1.6 |
| 本文強調 | 16px | 600 | 1.6 |
| キャプション | 14px | 400 | 1.5 |
| キャプション強調 | 14px | 600 | 1.5 |
| 小テキスト | 12px | 400 | 1.4 |
| タブラベル | 12px | 500 | 1.0 |

## Layout

### スペーシング
8px ベース。構造的なレイアウトは 8 / 12 / 16 / 24 / 32 / 48px にスナップ。

### レスポンシブ

| ブレークポイント | 幅 | レイアウト |
|---|---|---|
| モバイル | 〜767px | 1カラム。下部タブバー。メイン対象 |
| タブレット | 768〜1023px | 2カラム |
| デスクトップ | 1024px〜 | 最大幅1280px・中央寄せ |

モバイルファーストで設計。全ページでモバイル（375px）から実装を開始する。

### 下部タブバー
- 高さ64px
- アイコン24px + ラベル12px
- アクティブ: primary（#005F8C）
- 非アクティブ: ink-muted（#8d99a8）
- アドミン: 4タブ / メンバー: 3タブ

### ヘッダー
- 高さ64px
- 右上: ベルアイコン（未読バッジ赤丸）+ アバターアイコン

## Elevation & Shadows

Intercom の哲学（「深さはサーフェスの色変化で伝える」）を基本に、Airbnb の単層シャドウを必要な場所に加える。

| レベル | 値 | 用途 |
|---|---|---|
| flat | シャドウなし | 通常のカード・テキスト |
| sm | `0 1px 4px rgba(0,0,0,0.06)` | カードホバー・フォーカス |
| md | `0 4px 16px rgba(0,0,0,0.10)` | ドロップダウン・ポップオーバー |
| lg | `0 8px 32px rgba(0,0,0,0.14)` | モーダル・トースト |

原則: **ボーダーとシャドウは同時に使わない**。ボーダーを使うコンポーネント（カード・入力欄）はシャドウなし。シャドウを使うコンポーネント（モーダル・トースト）はボーダーなし。

例外: dropdown と select-content は「浮き上がり表現と位置の明確化」が同時に必要なため、border + shadow-md の併用を許可する。

## Motion

| トークン | 値 | 用途 |
|---|---|---|
| duration-fast | 120ms | ホバー・フォーカス・ボタン状態変化 |
| duration-base | 200ms | モーダル開閉・トースト入退場 |
| duration-slow | 300ms | ページ遷移・大きな要素の出現 |
| easing-default | ease | ホバー・フォーカス |
| easing-enter | ease-out | 要素が現れるとき |
| easing-exit | ease-in | 要素が消えるとき |

アニメーションは `transform` / `opacity` のみ。`width` / `height` / `top` / `left` は変化させない。

## Components

### ボタン

- **Primary**: ブルー pill・高さ48px以上。メインアクション（参加する、作成する）
- **Secondary**: ブルー枠の pill。サブアクション（キャンセル、戻る）
- **Accent**: コーラル pill。LP の主要 CTA のみに使用（アプリ内では使わない）
- **Ghost**: 背景なし。補助的なアクション（リンクに近い操作）
- **Destructive**: 赤 pill。削除・取消など取り返しのつかないアクション
- **Disabled**: `opacity: 0.5` + `pointer-events: none`。色変更は行わない

### フォーム入力

- **Default**: 高さ48px以上・角丸10px・ボーダー #dce3ea
- **Focus**: ボーダー2px #005F8C（primary）。outline なし
- **Error**: ボーダー2px #c0392b + フィールド下に12px赤テキストでエラーメッセージ
- **Disabled**: canvas-cool 背景・opacity 0.6・pointer-events none

### アバター

円形。画像がない場合は名前の頭文字をイニシャルとして表示。

| サイズ | 用途 |
|---|---|
| sm（32px） | コンパクトリスト・チャット |
| md（40px） | メンバーリスト・カード内 |
| lg（48px） | ヘッダー・詳細ページ |
| xl（80px） | プロフィールページ |

### タブ（アンダーライン型）

Airbnb の product-tab パターンを採用。pill 型ではなくアンダーラインで管理画面らしい明快さを演出。

- アクティブ: border-bottom 2px solid #005F8C、テキスト #005F8C、caption-strong（14px/600）
- 非アクティブ: border-bottom transparent、テキスト #5c6a7a、caption（14px/400）
- ホバー: テキスト #1a2332
- タッチターゲット: 最小44px

### モーダル

Intercom のカード浮き + Airbnb のオーバーレイ設計を統合。

- **背景幕**: rgba(0,0,0,0.45)・fixed inset-0・z-index 300
- **コンテナ**: 白背景・角丸14px・shadow-lg・z-index 400
- **モバイル**: 画面下部からスライドイン（bottom sheet）
- **タブレット以上**: 画面中央に表示（max-width 480px）
- **閉じる**: ESCキー・背景幕タップ・閉じるボタン

### トースト / スナックバー

- 位置: 右下固定（bottom 96px / right 16px）。タブバーの上に浮かせる
- 背景: #1a2332（surface-dark）・白テキスト
- 左ボーダー4px: 成功=#0f8a4f / エラー=#c0392b / 情報=#005F8C
- 角丸: 10px（rounded-md）
- shadow-lg
- 自動消滅: 3500ms
- z-index: 500（最前面）

### ローディング / スケルトン

- 背景: #edf0f4（status-neutral-bg）
- アニメーション: opacity 0.6→1 を 1.5s ease-in-out で繰り返す（pulse）
- 角丸はロード対象コンポーネントと同じ値を使う
- テキスト行: 高さ16px / カード: 高さ80px

### エンプティステート

全ページで一貫したパターンを使用:
1. 48px 円（bg: rgba(0,95,140,0.08)）の中に 24px アイコン（#8d99a8）
2. タイトル: body-strong（16px/600）
3. 説明文: caption（14px/400）#5c6a7a
4. オプションCTA: button-primary または button-secondary

### ドロップダウン / メニュー

- 白背景・border #dce3ea・角丸10px・shadow-md
- アイテム高さ: 最小44px（タッチターゲット確保）
- ホバー: canvas-cool (#f2f7fa) 背景
- 危険アクション: status-error (#c0392b) テキスト
- z-index: 200

### プログレスバー

- トラック: 高さ8px・pill shape・#edf0f4（status-neutral-bg）
- バー: トラック内に overflow hidden。複数セグメントは width% で並べる
- 色: primary（参加済み）/ status-success（支払い済み）/ status-error（未払い）

### 通知カード

- 未読: 左ボーダー4px solid #005F8C（primary）
- 既読: ボーダーのみ（左ボーダーなし）
- タイトル: 未読=caption-strong・既読=caption + #5c6a7a
- 本文: small（12px）#5c6a7a
- タイムスタンプ: small（12px）#8d99a8
- アイコン: 20px、色は通知タイプのセマンティックカラーに従う

### コース判定バナー

- OK（開催可能）: 緑系背景 #eaf7f0
- 注意（最低人数ギリギリ）: 黄系背景 #fdf6e3
- 危険（中止検討）: 赤系背景 #fdecea

### カレンダー

- セッションがある日にブルーのドット表示（6px・#005F8C）
- 今日の日付は primary 丸背景 + 白テキスト
- 日付タップでその日のセッション一覧を表示

### QR コード

- 白背景 + ボーダー + 角丸14px + パディング24px
- 下にコピーボタン（button-secondary）

### フォーカスリング（キーボードナビゲーション）

- `outline: 2px solid #005F8C`・`outline-offset: 2px`
- タブ操作時のみ表示（`:focus-visible`）
- 全インタラクティブ要素に適用

## Mobile UX

Rangers はブラウザアプリとしてモバイル（iOS / Android）での利用を主用途とする。
以下の仕様はモバイルファーストで設計し、デスクトップはその拡張として扱う。

### Safe Area（セーフエリア）

iPhone のノッチ・Dynamic Island・ホームインジケーターを考慮する。

| 対象 | 仕様 |
|---|---|
| 底部タブバー | `padding-bottom: env(safe-area-inset-bottom)` を追加。高さ64px + セーフエリア分 |
| ヘッダー | `padding-top: env(safe-area-inset-top)` を追加。高さ56px + セーフエリア分 |
| トースト | bottom を `calc(96px + env(safe-area-inset-bottom))` に設定 |
| ページコンテンツ | `pb-24`（96px）+ セーフエリアで底部タブバーに隠れないよう確保 |
| ボトムシートモーダル | コンテナの `padding-bottom: env(safe-area-inset-bottom)` を追加 |

Tailwind では `pb-safe`（プラグイン）または `env()` 関数を直接使用する。

### Viewport Height

`100vh` は iOS Safari でアドレスバーを含むため画面がはみ出す問題がある。

- 全画面要素（モーダル背景幕など）は `height: 100dvh`（dynamic viewport height）を使用
- フォールバック: `min-height: -webkit-fill-available`
- `100vh` の直接使用は禁止

```css
/* 正しい書き方 */
height: 100dvh;

/* Tailwind: h-screen は 100vh のため使わない */
/* 代わりに: style={{ height: '100dvh' }} */
```

### タッチフィードバック（アクティブ状態）

モバイルではホバーが機能しない。タップ時の視覚フィードバックを `:active` で定義する。

| コンポーネント | アクティブ状態 |
|---|---|
| ボタン（Primary / Secondary / Accent） | `scale(0.97)` + `opacity: 0.9`。duration-fast (120ms) |
| リスト項目・カード（タップ可能） | `background: canvas-cool (#f2f7fa)` に切り替え |
| タブ | フィードバックなし（瞬時切り替え） |
| アイコンボタン | `opacity: 0.6` |

Tailwind: `active:scale-[0.97] active:opacity-90 transition-transform`

### touch-action

タップの 300ms 遅延を排除し、スクロールとタップの競合を防ぐ。

- 全ボタン・リンク・インタラクティブ要素: `touch-action: manipulation`
- 横スクロールコンテナ: `touch-action: pan-x`
- 縦スクロールのみのコンテナ: `touch-action: pan-y`

Tailwind: `touch-manipulation`（全インタラクティブ要素に適用）

### フォーム入力の inputmode

ソフトウェアキーボードの種類をコントロールし、入力を快適にする。

| フィールド種別 | `inputmode` | `type` |
|---|---|---|
| 数値（整数） | `numeric` | `number` |
| 電話番号 | `tel` | `tel` |
| メールアドレス | `email` | `email` |
| 検索テキスト | `search` | `search` |
| 一般テキスト | `text`（省略可） | `text` |

また、ログイン・登録フォームには `autocomplete` を必ず設定する:
- メールアドレス: `autocomplete="email"`
- 現在のパスワード: `autocomplete="current-password"`
- 新しいパスワード: `autocomplete="new-password"`
- 名前: `autocomplete="name"`

### ボトムシートのアニメーション

モバイルのモーダルはボトムシートとして下からスライドイン。

```
初期状態: translateY(100%) opacity(0)
表示:     translateY(0%)   opacity(1)  duration-base(200ms) ease-out
非表示:   translateY(100%) opacity(0)  duration-fast(120ms) ease-in
```

ドラッグハンドル（任意）: 幅32px × 高さ4px・角丸2px・#dce3ea（border色）・上部中央に配置

### スクロール制御

| 対象 | 仕様 |
|---|---|
| モーダル背景幕 | `overscroll-behavior: contain`（背景のスクロールチェーン防止） |
| ボトムシート内 | `overflow-y: auto` + `overscroll-behavior: contain` |
| ページ全体 | `overflow-x: hidden`（横スクロール防止） |
| スクロールバー | 非表示（`scrollbar-width: none` / `::-webkit-scrollbar { display: none }`） |

### フォントレンダリング

モバイルでのテキスト品質を統一する。

```css
/* globals.css に設定済みであること */
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;  /* iOS の自動フォントサイズ変更を防止 */
  text-size-adjust: 100%;
}
```

### ページコンテンツのスクロール余白

底部タブバー（64px + セーフエリア）に隠れないよう、全ページの最下部に余白を確保する。

- モバイル（タブバーあり）: `padding-bottom: calc(64px + env(safe-area-inset-bottom) + 16px)`
  - Tailwind 目安: `pb-24`（96px）＋セーフエリア
- デスクトップ（タブバーなし）: `padding-bottom: 24px`（`md:pb-6`）

### ローディング状態の対応方針

Next.js App Router の `loading.tsx` を使用してページ単位のスケルトンを表示する。

実装必須ページ（ユーザーが頻繁にアクセスし、データ取得に時間がかかる）:
- `dashboard/loading.tsx` ✓ 実装済み
- `profile/loading.tsx` ✓ 実装済み
- `sessions/[id]/loading.tsx` — 要実装
- `teams/[id]/loading.tsx` — 要実装
- `notifications/loading.tsx` — 要実装
- `payments/loading.tsx` — 要実装

スケルトンの構造はページのレイアウトを模倣し、コンテンツの「場所」が視覚的にわかるようにする。

### タッチターゲットサイズ

| 要素 | 最小サイズ |
|---|---|
| ボタン（テキスト付き） | 高さ48px（幅は可変） |
| アイコンボタン（単独） | 44px × 44px |
| タブ（ナビゲーション） | 高さ44px以上 |
| リスト項目（タップ可能） | 高さ44px以上 |
| チェックボックス・ラジオ | 24px アイコン + 周囲タップ領域で合計44px以上 |

「小さすぎてタップできない」は 50〜60代ユーザーに特に致命的。44px を下回る要素は実装禁止。

---

## Do's and Don'ts

### Do
- Primary（#005F8C）を全インタラクティブ要素に一貫して使用する
- ステータスは色＋テキストの両方で伝える（「支払い済み」と緑バッジ）
- タッチターゲットは44px以上（ボタンは48px以上）を厳守
- 余白を十分に取り、50〜60代が快適に読める密度にする
- セクション区切りは canvas ↔ canvas-cool の背景色切り替えで表現する
- Accent（#E8614D）は LP の CTA など、本当に目立たせたい箇所だけに限定する
- モーダルとトーストは必ず指定の z-index で実装する
- shadow-md 以上を使うコンポーネントにはボーダーを付けない
- 全インタラクティブ要素に `touch-action: manipulation` を適用する
- Safe Area を考慮し `env(safe-area-inset-*)` を底部・頂部に設定する
- 全画面要素の高さは `100dvh` を使用する（`100vh` 禁止）
- タップフィードバックは `:active` で定義し、モバイルの操作感を明示する
- フォーム入力には適切な `inputmode` と `autocomplete` を設定する

### Don't
- Accent（#E8614D）をアプリ内画面で使わない（LP の主要 CTA 専用。削除等の危険アクションは status-error #c0392b を使う）
- 12px 未満のテキストを使わない
- ボーダーとシャドウを同時に使わない（dropdown と select-content のみ例外）
- 装飾的なグラデーションを使わない
- ダークモードは実装しない（ライトテーマ一本）
- DESIGN.md に定義されていない色・フォント・余白を独自に追加しない
- `width` / `height` / `top` / `left` をアニメーションさせない（transform / opacity のみ）
- disabled 状態を色変更で表現しない（opacity: 0.5 + pointer-events: none で統一）
- status-warning（#b8860b）を通知の更新アイコンに使わない（status-update #d97706 を使う）
- `100vh` を全画面要素に使わない（iOS でアドレスバー分はみ出す。`100dvh` を使う）
- セーフエリアを無視して fixed 要素をノッチ・ホームインジケーターに重ねない
- タップ時の唯一のフィードバックをホバー色変化にしない（モバイルではホバーは機能しない）
- アイコンの strokeWidth を 1.8 以外の値にしない（xs/sm は 2 のみ許容）

---

## フォームコンポーネント

### Select（セレクター）

Radix UI SelectPrimitive ベース。Intercom の明快な状態定義 × Apple の余白設計。

| 状態 | 見た目 |
|---|---|
| Default | 白背景・ボーダー #dce3ea・高さ48px |
| Focus | ボーダー2px #005F8C。outline なし |
| Error | ボーダー2px #c0392b |
| Disabled | canvas-cool 背景・opacity 0.6 |
| sm サイズ | 高さ36px（fee-filters など密度が高い UI 向け） |

**ドロップダウンパネル（Select Content）:**
- 白背景・ボーダー #dce3ea・角丸10px・shadow-md（md を使うのでボーダーなしは不可、ただし軽くする）
  - 例外: Select Content のみ border + shadow-md 併用を許可（ドロップダウンは浮き上がり表現が必要なため）
- アイテム高さ: 最小44px
- 選択済みアイテム: primary テキスト + canvas-cool 背景（ #e8f2f8 ）
- グループラベル: small（12px）・ink-muted・padding 8px 16px

### Checkbox

3つのパターンが Rangers に存在する。目的に応じて使い分ける。

**パターン1 — 単体チェックボックス**

標準的な checkbox + label の組み合わせ。

- チェックボックス本体: 20px × 20px・角丸6px・ボーダー 1.5px
- 未チェック: ボーダー #dce3ea・白背景
- チェック済み: ボーダー + 背景 #005F8C・白チェックマーク
- タッチ領域: label を含むラッパーで最小44px 高さを確保（50〜60代ユーザー対応）

**パターン2 — グループ枠付き（fee flag selector）**

bordered container に複数の checkbox を積み重ねるパターン。

- コンテナ: 角丸10px・ボーダー #dce3ea
- 各行: 高さ最小48px・padding 12px 16px
- 行間: 1px divider（#e8edf2）
- ホバー: canvas-cool (#f2f7fa) 背景

**パターン3 — タグトグル（pill ボタン方式）**

視覚的には checkbox を持たず、pill ボタンの選択状態で on/off を表現。

- 未選択: 白背景・#dce3ea ボーダー・#5c6a7a テキスト
- 選択済み: #005F8C 背景・白テキスト・border transparent
- 高さ: 最小36px（小さいタグは 36px まで許容）

### Radio Button

Rangers では「カード全体がクリック可能」な `:has()` CSS パターンを採用。見た目は丸型インジケーターではなく、カードの枠線変化で選択を表現する。

- 非選択: ボーダー 1.5px #dce3ea・白背景
- 選択済み: ボーダー 1.5px #005F8C・背景 #e8f2f8（status-info-bg）
- ホバー: ボーダー primary（予告的フィードバック）
- 遷移: 120ms ease（duration-fast）

input[type=radio] は視覚的に隠し（opacity: 0 / position: absolute）、ラベル全体をクリック可能にする。

### Toggle / Switch

プロフィール設定などの on/off 切り替え。

- サイズ: 幅44px × 高さ24px（WAI-ARIA: role="switch" aria-checked）
- オフ: 背景 #dce3ea（border色）
- オン: 背景 #005F8C（primary）
- つまみ: 20px 白丸・shadow-sm・translateX で右へ移動
- 遷移: 200ms ease（duration-base）

label + toggle の行レイアウトでは `justify-content: space-between` でラベル左・トグル右に配置。行全体の高さ最小44px。

### Textarea

- Default: 白背景・ボーダー #dce3ea・角丸10px・padding 12px 16px・最小高さ 120px
- Focus: ボーダー2px #005F8C。outline なし
- Error: ボーダー2px #c0392b
- Disabled: canvas-cool 背景・opacity 0.6・resize: none
- **チャット用（textarea-chat）**: 最小44px・最大120px・resize: none・角丸14px（rounded-lg）

### Form Group パターン

全フォームで使う `label + input/select + hint/error` のラッパーパターン。Intercom の「実装に迷いを生まない」コンポーネント設計を踏襲。

```
<div class="form-group">        ← gap: 6px, marginBottom: 16px
  <label class="form-label">   ← caption-strong (14px/600) #5c6a7a
    フィールド名 <span>*</span>  ← 必須の場合のみ赤アスタリスク
  </label>
  <input class="input" />      ← または select / textarea
  <p class="form-hint">        ← small (12px) #8d99a8（任意）
    補足説明テキスト
  </p>
  <p class="input-error-message">  ← small (12px) #c0392b（エラー時のみ）
    エラーメッセージ
  </p>
</div>
```

フォームセクション（複数グループをまとめる場合）: 白背景・ボーダー #dce3ea・角丸14px・padding 20px。セクションタイトルは heading-sm (18px/600) + 下部に divider。

---

## レイアウト・構造コンポーネント

### Divider / Separator

| バリアント | 色 | 用途 |
|---|---|---|
| divider | #e8edf2 | 標準的な区切り（リスト行間・カード内） |
| divider-light | #f2f7fa | セクション間の軽い区切り（同系背景） |
| divider-with-label | #e8edf2 + ink-muted テキスト | 「または」「ログイン済みの方」等 |

テキスト付き区切り線は `flex + grow` で左右のラインを伸ばし、中央にテキストを配置。

### Section Header

ページ内セクションの「タイトル左・アクション右」行パターン。Apple のコンテンツ階層設計を踏襲。

```
<div class="section-header">
  <h2 class="section-header-title">直近のセッション</h2>
  <a class="section-header-action">すべて見る</a>   ← 最小44px タッチ領域
</div>
```

- タイトル: heading-sm (18px/600)・ink (#1a2332)
- アクション: caption (14px/400)・primary (#005F8C)
- タッチターゲット: アクションリンクは padding で44px 高さを確保

### Info Row（ラベル + 値の行）

チーム詳細・プロフィール・設定ページで使う情報表示行。

- ラベル: caption (14px/400)・#5c6a7a・最小幅80px
- 値: body (16px/400)・ink (#1a2332)
- 行の下部: 1px divider (#e8edf2)
- 行の高さ: 最小44px（padding 12px 0 で確保）

### Day Label（日付ブロック）

セッション一覧・スケジュール画面の日付見出し。ブルーのティント背景でスポーティな印象。

- 背景: rgba(0, 95, 140, 0.08)（primary の8%透明）
- 角丸: rounded-sm（6px）
- 日付: caption-strong・primary (#005F8C)
- 曜日: caption・body-muted (#5c6a7a)

### Member Card

メンバーリスト・チーム詳細・サブスク管理など全ページで共通のメンバー行。

```
[avatar-md (40px)] [name (body-strong) / meta (caption #5c6a7a)] [action/badge →]
```

- 高さ: 最小64px（padding 12px 16px）
- ホバー: canvas-cool (#f2f7fa) 背景
- アクション部: right side に badge または ghost ボタン

---

## インタラクティブコンポーネント

### Link スタイル

| バリアント | 用途 | スタイル |
|---|---|---|
| link-inline | 文章中のリンク | #005F8C・下線・underline-offset 2px |
| link-standalone | リスト・カード内のアクション | #005F8C・太字・下線なし（hover 時のみ下線） |
| link-danger | 退会・削除など危険アクション | #c0392b・下線なし |

全リンクはタッチターゲット最小44px を確保すること（padding または min-height で）。

### Tag / Chip

TagGroup（編集時）と TagRow（表示時）の2パターン。

**TagGroup（編集・選択可能）:**
- 未選択: 白背景・#dce3ea ボーダー・pill 形状・caption (14px)・高さ36px
- 選択済み: #005F8C 背景・白テキスト・caption-strong
- ホバー（未選択）: border color → primary・テキスト → primary

**TagRow（表示のみ）:**
- タグ: rgba(0,95,140,0.10) 背景・primary テキスト・pill・small (12px)
- 最初は `maxVisible` 件表示 → 超過時に「+N件」リンク表示
- 展開時: 全タグ + 「少なく表示」ボタン

### Segment Tab（ピル型タブ）

「すべて / 登録済み / 過去」など2〜4選択肢の切り替え。Airbnb の pill 哲学を応用。

- トラック: canvas-cool (#f2f7fa) 背景・角丸14px・padding 4px
- アクティブ: 白背景・shadow-sm・ink テキスト・caption-strong
- 非アクティブ: 透明背景・#5c6a7a テキスト・caption

アンダーライン型タブ（tab-active/inactive）との使い分け:
- **アンダーライン型**: 管理画面・詳細ページのタブナビゲーション（ページの主要構造を切り替える）
- **セグメントタブ**: コンテンツフィルター・ビュー切り替え（同一ページ内の表示を切り替える）

カウントバッジ（アイテム件数）はアクティブ: primary 背景・非アクティブ: neutral-bg 背景。

### Search Bar

- 入力欄: pill 形状（rounded-pill）・高さ48px・左側に検索アイコン（絶対配置）
- 送信ボタン: primary 背景・pill 形状・caption-strong・高さ48px
- 検索アイコン: 20px・ink-muted・pointer-events none

### Collapsible（折りたたみ）

招待コード入力など「普段は閉じており、必要なときだけ開く」パターン。

- トリガー: 白背景・ボーダー #dce3ea・高さ48px・幅100%・体裁は button-ghost に近い
- ホバー: border → primary・テキスト → primary
- コンテンツ: canvas-cool 背景・角丸10px・padding 16px・margin-top 8px
- 出現: fadeIn 200ms ease-out

---

## 視覚表現コンポーネント

### Stamp Card（回数券進捗）

stamp-section.tsx で使用するスタンプ型進捗 UI。

**ドット（使用済み / 未使用）:**
- サイズ: 28px × 28px・pill 形状
- 未使用: ボーダー #dce3ea・白背景・番号テキスト（ink-muted）
- 使用済み: ボーダー + 背景 #005F8C・白チェックマーク（✓）

**プログレスバー:**
- トラック: 8px 高さ・pill・neutral-bg 背景
- フィル: primary 背景・`transition: width 500ms ease-out`（アニメーションあり）
- overflow: hidden でトラック外にはみ出さない

**カードヘッダー:**
- avatar-md (40px) + 名前 + 購入枚数 / 残数

### Privacy Badge

プロフィールの情報公開設定を示すインジケーター。

| バリアント | アイコン | テキスト | 色 |
|---|---|---|---|
| private | ロックアイコン（12px） | 管理者のみ | ink-muted (#8d99a8) |
| public | グローブアイコン（12px） | 一般公開 | primary (#005F8C) |

### Icon System

Lucide React（stroke 系）を全アイコンに使用。

| サイズ | stroke-width | 用途 |
|---|---|---|
| 14px (xs) | 2 | ラベル横・細かい UI |
| 16px (sm) | 2 | インラインアイコン・バッジ |
| 20px (md) | 1.8 | 通知カード・カード内アイコン（Rangers 慣例） |
| 24px (lg) | 1.8 | タブバー・ヘッダー・アクションボタン |
| 32px (xl) | 1.8 | エンプティステート・ヒーロー |

stroke-width: 1.8 は Rangers 全体で統一した慣例値（Lucide デフォルト 2 より細く、より洗練された印象）。xs/sm のみ 2 を使用し、md 以上は全て 1.8 で統一する。

**カラー適用:**
- ナビゲーションアイコン: active → primary / inactive → ink-muted
- アクションアイコン: 文脈に応じたセマンティックカラー（エラー系 → status-error 等）
- 背景カラー付きボタン内: on-primary（白）

---

## アクセシビリティ指針

Rangers のユーザーは50〜60代が中心。以下は全コンポーネントに共通する必須要件。

### コントラスト

| 組み合わせ | 比率 | 判定 |
|---|---|---|
| #1a2332 on #ffffff | 15.2:1 | WCAG AAA |
| #005F8C on #ffffff | 5.4:1 | WCAG AA |
| #ffffff on #005F8C | 5.4:1 | WCAG AA |
| #5c6a7a on #ffffff | 5.1:1 | WCAG AA |
| #8d99a8 on #ffffff | 3.2:1 | WCAG AA Large のみ（14px Bold 以上） |

ink-muted (#8d99a8) は14px Bold（caption-strong）以上でのみ使用。12px 通常ウェイトには使用不可。

### タッチターゲット早見表

| 要素 | 最小サイズ | 実装方法 |
|---|---|---|
| ボタン（テキスト付き） | 48px 高さ | `minHeight: 48px` |
| アイコンボタン単独 | 44px × 44px | `h-11 w-11` |
| タブ・セグメントタブ | 36px 高さ（トラック内余白で44px確保） | `py-2` + トラック `p-1` |
| checkbox ラッパー | 44px 高さ | `min-h-[44px]` |
| toggle ラッパー | 44px 高さ | `min-h-[44px]` |
| リスト行・カード | 44px 高さ | `min-h-[44px]` |
| リンク（スタンドアロン） | 44px 高さ | `inline-flex items-center min-h-[44px]` |

### 色覚多様性対応

全ステータス表示は「色 + テキスト + アイコン」の組み合わせで伝える。色だけを唯一の情報手段にしない。

- 支払い済み: 緑 (#0f8a4f) + 「支払済」テキスト + ✓ アイコン
- 未払い: 黄 (#b8860b) + 「未払い」テキスト + ⚠ アイコン
- エラー: 赤 (#c0392b) + エラーメッセージ テキスト + ✕ アイコン

### フォーム アクセシビリティ

- `<label>` は必ず対応する input の `id` に `for` / `htmlFor` で紐づける
- エラーメッセージは `aria-describedby` で input に紐づける
- required フィールドは `aria-required="true"` を設定する
- toggle/switch は `role="switch"` + `aria-checked` を設定する
- select/combobox は Radix UI の ARIA サポートをそのまま活用する

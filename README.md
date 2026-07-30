# swim.os

スイミング関連プロダクトのモノレポ。`apps/` 配下に各アプリケーションが独立したプロジェクトとして存在する。

## アプリ一覧

| アプリ | パス | 状態 |
|--------|------|------|
| Rangers | [`apps/rangers`](./apps/rangers) | 本番運用中。スイミングチーム/スクール運営者向け管理プラットフォーム |
| SchoolBoost AI | [`apps/school-boost-ai`](./apps/school-boost-ai) | PoC（未リリース） |

各アプリは `apps/<app名>` 配下で個別に `pnpm install` / `pnpm dev` する（ルートでの一括インストールは不要）。

## 今回のレビュー対象は Rangers です

**[`apps/rangers`](./apps/rangers) を見てください。**

Rangers のリリース前最終チェックをお願いする場合、まず以下から読み始めてください。

→ **[`apps/rangers/docs/for-reviewer/INDEX.md`](./apps/rangers/docs/for-reviewer/INDEX.md)** — 何をどの順番で読むべきかの案内

セットアップ手順・技術スタック・データアクセス規約は [`apps/rangers/README.md`](./apps/rangers/README.md) を参照。

`apps/school-boost-ai` は今回のレビュー範囲外。

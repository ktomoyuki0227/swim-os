import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next.js/Reactは実行時にインラインスクリプトを注入するため(RSCのflightデータ、
// devモードのHMR等)、nonceを使わない場合はscript-srcに'unsafe-inline'が必要になる
// （Next公式ドキュメント "Without Nonces" の構成に準拠）。
// nonceベースの厳格なCSPに切り替える場合は全ページの動的レンダリングが前提になるため、
// 現状はこの構成を採用している。
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
    // Server Actionsのデフォルト上限は1MBだが、アプリ側の画像アップロード上限は
    // アバター2MB・チーム画像(cover/icon) 5MBまで許可しているため、multipart境界等の
    // オーバーヘッドを見込んでアプリ側の最大値(5MB)より大きい値に設定する
    // （未設定・過小設定だと上限以下の画像でも「Body exceeded X limit」という
    // 素の例外が投げられ、500エラー画面に直行してしまう。actions/profile.ts の
    // uploadAvatar・actions/teams/crud.ts の uploadTeamImage の上限と合わせて変更すること）
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;

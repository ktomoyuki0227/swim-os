import { updateSession } from "./lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Stripe webhook はCookieセッション不要かつ署名検証のため生ボディが必要。
    // proxy(旧middleware)を経由するとリクエストボディがバッファリングされ、
    // 大きなペイロードでサイレントに切り詰められるリスクがあるため除外する。
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 環境変数が未設定の場合はスキップ
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // 未ログインユーザーを認証ページ以外からリダイレクト
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password")

  const isApiRoute = request.nextUrl.pathname.startsWith("/api")

  // ログインなしで閲覧できる公開ページ
  const isPublicPage =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/about") ||
    request.nextUrl.pathname.startsWith("/price") ||
    request.nextUrl.pathname.startsWith("/faq") ||
    request.nextUrl.pathname.startsWith("/instructors") ||
    request.nextUrl.pathname.startsWith("/coach-recruit") ||
    request.nextUrl.pathname.startsWith("/register/sent") ||
    request.nextUrl.pathname.startsWith("/onboarding/complete") ||
    request.nextUrl.pathname.startsWith("/teams/join") ||
    // チーム公開ページ（UUID形式の /teams/[id] のみ。/teams/new, /teams/join などは除外）
    /^\/teams\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.nextUrl.pathname)

  // リフレッシュトークンが無効など認証エラーが発生した場合は
  // 古い sb- Cookie をすべて削除してから /login へリダイレクト
  // ただし認証ページ・公開ページにいる場合はループを避けるためスキップ
  if (authError && !isAuthPage && !isPublicPage) {
    const loginUrl = new URL("/login", request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    request.cookies.getAll()
      .filter((c) => c.name.startsWith("sb-"))
      .forEach((c) => redirectResponse.cookies.delete(c.name))
    return redirectResponse
  }

  if (!user && !isAuthPage && !isApiRoute && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // ログイン済みユーザーが認証ページにアクセスした場合はダッシュボードへリダイレクト
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

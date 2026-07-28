import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database-generated"
import { publicEnv } from "@/lib/env"

export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    }
  )
}

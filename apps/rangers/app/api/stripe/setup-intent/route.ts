import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const setupIntent = await stripe.setupIntents.create({
    metadata: { user_id: user.id },
    usage: "off_session",
    payment_method_types: ["card"],
  })

  if (!setupIntent.client_secret) {
    return NextResponse.json({ error: "SetupIntent の作成に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}

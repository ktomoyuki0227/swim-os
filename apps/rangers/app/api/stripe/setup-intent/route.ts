import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers"

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    user.email ?? "",
    profile?.name ?? user.email ?? ""
  )

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    metadata: { user_id: user.id },
    usage: "off_session",
    payment_method_types: ["card"],
  })

  if (!setupIntent.client_secret) {
    return NextResponse.json({ error: "SetupIntent の作成に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}

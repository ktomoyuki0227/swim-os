import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers"
import { requireApiUser } from "@/lib/auth/require-api-user"

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const { user, supabase, response } = await requireApiUser()
  if (response) return response

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

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

// Webhook はサービスロールキーで直接操作する
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object
      // 予約ステータスを confirmed に更新
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("stripe_payment_intent_id", paymentIntent.id)
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object
      // 予約ステータスを cancelled に更新
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("stripe_payment_intent_id", paymentIntent.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}

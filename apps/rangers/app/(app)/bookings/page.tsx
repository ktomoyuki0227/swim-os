import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_BOOKINGS } from "@/lib/mock-data"
import { CancelBookingButton } from "@/components/booking/cancel-booking-button"
import { bookingStatusLabels, bookingStatusVariants } from "@/lib/lesson-utils"
import { CalendarDays, MapPin, Banknote, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "予約履歴",
}

interface BookingsPageProps {
  searchParams: Promise<{ success?: string }>
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { success } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: dbBookings } = await supabase
    .from("bookings")
    .select("*, lesson:lessons(*)")
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  const isMock = !dbBookings || dbBookings.length === 0
  const bookings = isMock ? MOCK_BOOKINGS : dbBookings

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">予約履歴</h1>

      {success && (
        <div className="mb-4 rounded-lg border-l-4 border-green-400 bg-green-50 px-4 py-3 text-sm text-green-800">
          予約が完了しました。レッスン当日をお楽しみに！
        </div>
      )}

      {isMock && (
        <p className="mb-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          サンプルデータを表示しています。予約すると実際のデータが表示されます。
        </p>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">まだ予約がありません。</p>
          <Link href="/lessons" className="text-sm text-blue-600 underline underline-offset-4">
            レッスンを探す
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {booking.lesson && !isMock ? (
                      <Link
                        href={`/lessons/${booking.lesson.id}`}
                        className="group flex items-center gap-1 hover:text-blue-600"
                      >
                        <CardTitle className="text-base leading-snug group-hover:text-blue-600">
                          {booking.lesson.title}
                        </CardTitle>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <CardTitle className="text-base leading-snug">
                        {booking.lesson?.title ?? "不明なレッスン"}
                      </CardTitle>
                    )}
                  </div>
                  <Badge variant={bookingStatusVariants[booking.status]} className="shrink-0">
                    {bookingStatusLabels[booking.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {booking.lesson && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span>
                        {new Date(booking.lesson.scheduled_at).toLocaleDateString(
                          "ja-JP",
                          {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <span>{booking.lesson.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <span>{booking.lesson.price.toLocaleString()}円</span>
                      </div>
                    </div>
                  </div>
                )}
                {!isMock && booking.status !== "cancelled" && (
                  <div className="pt-1">
                    <CancelBookingButton bookingId={booking.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, string> = {
  pending: "確認待ち",
  confirmed: "確定",
  cancelled: "キャンセル済み",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
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

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, lesson:lessons(*)")
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          予約が完了しました。レッスン当日をお楽しみに!
        </div>
      )}
      <h1 className="mb-6 text-2xl font-bold">予約履歴</h1>
      {!bookings || bookings.length === 0 ? (
        <p className="text-muted-foreground">
          まだ予約がありません。
        </p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {booking.lesson?.title ?? "不明なレッスン"}
                  </CardTitle>
                  <Badge variant={statusVariants[booking.status]}>
                    {statusLabels[booking.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {booking.lesson && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                    <p>
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
                    </p>
                    <p>{booking.lesson.location}</p>
                    <p>{booking.lesson.price.toLocaleString()}円</p>
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

export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getMyNotifications } from "@/actions/notifications"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MarkAllReadButton } from "./mark-all-read-button"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await getMyNotifications()
  const unreadCount = (notifications || []).filter((n: Record<string, unknown>) => !n.is_read).length

  const typeIcons: Record<string, React.ReactNode> = {
    team_created: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    member_joined: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    join_request_received: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    ),
    join_request_approved: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    join_request_rejected: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    session_added: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="19" /><line x1="9.5" y1="16.5" x2="14.5" y2="16.5" />
      </svg>
    ),
    session_registered: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    session_cancelled: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    session_cancelled_by_member: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="11" x2="23" y2="17" /><line x1="23" y1="11" x2="17" y2="17" />
      </svg>
    ),
    session_min_reached: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    ),
    session_updated: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    session_reminder: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    waitlist_available: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="15 14 17 16 21 12" />
      </svg>
    ),
    payment_charged: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    payment_failed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="15" y1="14" x2="19" y2="18" /><line x1="19" y1="14" x2="15" y2="18" />
      </svg>
    ),
    stamp_low: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    fee_reminder: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    inquiry_received: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  }

  const defaultIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2332]">通知</h1>
        {unreadCount > 0 && (
          <MarkAllReadButton />
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="mt-3 text-sm text-[#5c6a7a]">通知はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {(notifications as Record<string, unknown>[]).map((notification) => {
            const notifLink = notification.link as string | null
            const cardContent = (
              <Card
                className={`rounded-[10px] border-[#dce3ea] py-0 ${notifLink ? "transition-colors hover:border-[#005F8C]" : ""} ${!notification.is_read ? "border-l-4 border-l-[#005F8C]" : ""}`}
              >
                <CardContent className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-0.5 shrink-0">
                    {typeIcons[notification.type as string] ?? defaultIcon}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.is_read ? "font-normal text-[#5c6a7a]" : "font-semibold text-[#1a2332]"}`}>
                      {notification.title as string}
                    </p>
                    {notification.body ? (
                      <p className="mt-1 text-xs text-[#5c6a7a]">{notification.body as string}</p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-[#8d99a8]">
                        {new Date(notification.created_at as string).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {notifLink && (
                        <span className="text-xs text-[#005F8C]">→ 確認する</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )

            return notifLink ? (
              <Link key={notification.id as string} href={notifLink}>
                {cardContent}
              </Link>
            ) : (
              <div key={notification.id as string}>{cardContent}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}

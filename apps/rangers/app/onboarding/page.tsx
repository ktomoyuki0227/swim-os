"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateRole } from "@/actions/auth"
import { ToastProvider, useToast } from "@/components/toast"

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("invite")
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleRoleSelect = async (role: "instructor" | "swimmer") => {
    setIsLoading(true)

    const result = await updateRole(role)
    if (result.error) {
      showToast(result.error, "error")
      setIsLoading(false)
      return
    }

    if (inviteCode) {
      router.push(`/teams/join/${inviteCode}`)
    } else if (role === "instructor") {
      router.push("/instructor/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f7fa] px-4">
      <div className="w-full max-w-lg">
        <Card className="border-[#dce3ea] bg-white shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-[#1a2332]">
              あなたについて教えてください
            </CardTitle>
            <p className="mt-1 text-sm text-[#5c6a7a]">
              後から変更することもできます
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <button
              onClick={() => handleRoleSelect("instructor")}
              disabled={isLoading}
              className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-[#dce3ea] bg-white p-6 transition-all hover:border-[#005F8C] disabled:opacity-60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C]/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[#1a2332]">コーチ・主催者</p>
                <p className="mt-1 text-sm text-[#5c6a7a]">
                  チームを作成・運営し、練習やイベントを配信する
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("swimmer")}
              disabled={isLoading}
              className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-[#dce3ea] bg-white p-6 transition-all hover:border-[#005F8C] disabled:opacity-60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#005F8C]/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-[#1a2332]">スイマー</p>
                <p className="mt-1 text-sm text-[#5c6a7a]">
                  チームに参加して練習やイベントに申し込む
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <ToastProvider>
      <Suspense>
        <OnboardingForm />
      </Suspense>
    </ToastProvider>
  )
}

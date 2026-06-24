"use client"

import { useRouter } from "next/navigation"

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      router.push("/teams")
    }
  }

  return (
    <button
      onClick={handleBack}
      className="mb-4 inline-block text-sm text-[#5c6a7a] hover:text-[#1a2332]"
    >
      ← 戻る
    </button>
  )
}

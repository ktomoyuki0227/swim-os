"use client"

import { useState } from "react"

interface TeamDescriptionProps {
  text: string
}

export function TeamDescription({ text }: TeamDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 80

  return (
    <div>
      <p className={`text-sm leading-relaxed text-[#475569] ${!expanded && isLong ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm font-medium text-[#005F8C] hover:underline"
        >
          {expanded ? "少なく表示" : "もっと読む"}
        </button>
      )}
    </div>
  )
}

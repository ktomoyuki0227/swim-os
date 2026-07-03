"use client"

import Link from "next/link"
import { markBackNavigation } from "./page-transition"

interface BackLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  "aria-label"?: string
}

export function BackLink({ href, children, className, "aria-label": ariaLabel }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => markBackNavigation()}
    >
      {children}
    </Link>
  )
}

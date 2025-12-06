"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import type { ReactNode } from "react"

import { useAuth } from "@/contexts/auth-context"
import { Layout } from "@/components/layout"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  )
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return null
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

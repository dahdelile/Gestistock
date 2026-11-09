"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log("[DASHBOARD] Current state - user:", !!user, "isLoading:", isLoading, "pathname:", pathname)

  useEffect(() => {
    console.log("[DASHBOARD] useEffect - user:", !!user, "isLoading:", isLoading, "pathname:", pathname)
    if (!isLoading && !user && !pathname.includes("/login")) {
      console.log("[DASHBOARD] No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-in">{children}</main>
      </div>
    </div>
  )
}

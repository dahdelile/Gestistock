"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { ApiDataProvider } from "@/hooks/use-api-data"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <ApiDataProvider>{children}</ApiDataProvider>
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  )
}

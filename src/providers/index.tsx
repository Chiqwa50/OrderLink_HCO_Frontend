"use client"

import { DirectionProvider } from "@radix-ui/react-direction"

import type { LocaleType } from "@/types"
import type { ReactNode } from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ModeProvider } from "./mode-provider"
import { ThemeProvider } from "./theme-provider"

export function Providers({
  locale,
  children,
}: Readonly<{
  locale: LocaleType
  children: ReactNode
}>) {
  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <DirectionProvider dir={dir}>
      <SettingsProvider locale={locale}>
        <ModeProvider>
          <ThemeProvider>
            <AuthProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </ModeProvider>
      </SettingsProvider>
    </DirectionProvider>
  )
}

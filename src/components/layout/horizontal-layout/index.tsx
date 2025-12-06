import type { ReactNode } from "react"

import { Footer } from "../footer"
import { Sidebar } from "../sidebar"
import { HorizontalLayoutHeader } from "./horizontal-layout-header"

export function HorizontalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <HorizontalLayoutHeader />
        <main className="flex-1 bg-muted/40 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </>
  )
}

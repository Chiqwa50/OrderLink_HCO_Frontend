"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // عند تغيير المسار، أظهر مؤشر التحميل
    setIsNavigating(true)

    // أخفي المؤشر بعد فترة قصيرة
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isNavigating) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}

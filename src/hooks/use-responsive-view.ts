"use client"

import { useEffect, useState } from "react"

export type ViewMode = "table" | "cards"

export function useResponsiveView(
    desktopDefault: ViewMode = "table",
    mobileDefault: ViewMode = "cards",
    breakpoint: number = 768
) {
    const [viewMode, setViewMode] = useState<ViewMode>(desktopDefault)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < breakpoint) {
                setViewMode(mobileDefault)
            } else {
                setViewMode(desktopDefault)
            }
        }

        // Set initial value
        handleResize()

        // Add event listener (optional, if we want it to react to resize dynamically)
        // For "default" behavior, setting it once on mount is usually enough, 
        // but reacting to resize is better UX if the user rotates device or resizes window.
        window.addEventListener("resize", handleResize)

        return () => window.removeEventListener("resize", handleResize)
    }, [desktopDefault, mobileDefault, breakpoint])

    return [viewMode, setViewMode] as const
}

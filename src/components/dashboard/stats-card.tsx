"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: number | string
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    iconClassName?: string
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
    iconClassName,
}: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trend && (
                    <div className="flex items-center gap-1 mt-2">
                        <span
                            className={cn(
                                "text-xs font-medium",
                                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}
                        >
                            {trend.isPositive ? "+" : ""}
                            {trend.value}%
                        </span>
                        <span className="text-xs text-muted-foreground">من الأمس</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Package, Trophy, Medal, Award } from "lucide-react"

interface TopWarehouseUser {
    userId: string
    userName: string
    warehousesLabel: string // "مستودع دوائي، طبي" أو "جميع المستودعات"
    completedOrders: number
    avgPreparationTime: number // بالدقائق
}

interface TopWarehouseUsersListProps {
    data: TopWarehouseUser[]
}

export function TopWarehouseUsersList({ data }: TopWarehouseUsersListProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>أفضل موظفي المستودعات</CardTitle>
                    <CardDescription>الأسرع في تجهيز الطلبات</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        لا توجد بيانات كافية
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Trophy className="h-5 w-5 text-yellow-500" />
            case 1:
                return <Medal className="h-5 w-5 text-gray-400" />
            case 2:
                return <Award className="h-5 w-5 text-amber-600" />
            default:
                return null
        }
    }

    const getRankBadgeVariant = (index: number): "default" | "secondary" | "outline" => {
        switch (index) {
            case 0:
                return "default"
            case 1:
                return "secondary"
            default:
                return "outline"
        }
    }

    const formatTime = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} دقيقة`
        }
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>أفضل موظفي المستودعات</CardTitle>
                <CardDescription>الأسرع في تجهيز الطلبات</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 h-[350px] overflow-y-auto">
                    {data.map((user, index) => (
                        <div
                            key={user.userId}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Rank */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                                    {getRankIcon(index) || (
                                        <span className="text-sm font-bold text-muted-foreground">
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm truncate">{user.userName}</p>
                                        <Badge variant={getRankBadgeVariant(index)} className="shrink-0">
                                            #{index + 1}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.warehousesLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col items-end gap-1 shrink-0 mr-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="whitespace-nowrap">{formatTime(user.avgPreparationTime)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Package className="h-3.5 w-3.5" />
                                    <span>{user.completedOrders} طلب</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

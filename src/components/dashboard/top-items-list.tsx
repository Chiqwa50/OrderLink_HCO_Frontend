"use client"

import { Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TopItem {
    itemName: string
    totalQuantity: number
    orderCount: number
}

interface TopItemsListProps {
    data: TopItem[]
}

export function TopItemsList({ data }: TopItemsListProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>أكثر المواد طلباً</CardTitle>
                    <CardDescription>أعلى 5 مواد تم طلبها</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        لا توجد بيانات متاحة
                    </div>
                </CardContent>
            </Card>
        )
    }

    const maxQuantity = Math.max(...data.map((item) => item.totalQuantity))

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>أكثر المواد طلباً</CardTitle>
                <CardDescription>أعلى 5 مواد تم طلبها</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 h-auto md:h-[350px] md:overflow-y-auto">
                    {data.map((item, index) => {
                        const percentage = (item.totalQuantity / maxQuantity) * 100

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <Package className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none">
                                                {item.itemName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {item.orderCount} طلب
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold">{item.totalQuantity}</div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

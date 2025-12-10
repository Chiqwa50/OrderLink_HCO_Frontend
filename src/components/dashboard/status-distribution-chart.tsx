"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import type { OrderStatus } from "@/types"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface StatusDistribution {
    status: OrderStatus
    count: number
    percentage: number
}

interface StatusDistributionChartProps {
    data: StatusDistribution[]
}

const statusLabels: Record<OrderStatus, string> = {
    PENDING: "قيد المراجعة",
    APPROVED: "تم الموافقة",
    PREPARING: "قيد التجهيز",
    READY: "جاهز للتوصيل",
    DELIVERED: "تم التسليم",
    REJECTED: "مرفوض",
}

const statusColors: Record<OrderStatus, string> = {
    PENDING: "#f59e0b",
    APPROVED: "#3b82f6",
    PREPARING: "#8b5cf6",
    READY: "#10b981",
    DELIVERED: "#06b6d4",
    REJECTED: "#ef4444",
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>توزيع حالات الطلبات</CardTitle>
                    <CardDescription>نسب الطلبات حسب الحالة</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isDark = theme === "dark"

    const series = data.map((item) => item.count)
    const labels = data.map((item) => statusLabels[item.status])
    const colors = data.map((item) => statusColors[item.status])

    const options: any = {
        chart: {
            type: "donut",
            fontFamily: "inherit",
            foreColor: isDark ? "#a1a1aa" : "#52525b",
        },
        labels: labels,
        colors: colors,
        legend: {
            position: "bottom",
            fontSize: "14px",
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(1)}%`,
            style: {
                fontSize: "12px",
                fontWeight: "bold",
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: "16px",
                            fontWeight: 600,
                        },
                        value: {
                            show: true,
                            fontSize: "24px",
                            fontWeight: "bold",
                            formatter: (val: string) => val,
                        },
                        total: {
                            show: true,
                            label: "إجمالي الطلبات",
                            fontSize: "14px",
                            fontWeight: 600,
                            formatter: () => {
                                const total = data.reduce((sum, item) => sum + item.count, 0)
                                return total.toString()
                            },
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: {
                formatter: (value: number) => `${value} طلب`,
            },
        },
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>توزيع حالات الطلبات</CardTitle>
                <CardDescription>نسب الطلبات حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
                <Chart options={options} series={series} type="donut" height={350} />
            </CardContent>
        </Card>
    )
}

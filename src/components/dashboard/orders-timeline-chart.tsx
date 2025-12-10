"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TimelineData {
    date: string
    count: number
}

interface OrdersTimelineChartProps {
    data: TimelineData[]
}

export function OrdersTimelineChart({ data }: OrdersTimelineChartProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>الطلبات حسب الأيام</CardTitle>
                    <CardDescription>عدد الطلبات المنشأة يومياً</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isDark = theme === "dark"

    // تحويل التواريخ إلى تنسيق عربي
    const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    const categories = data.map((item) => {
        const date = new Date(item.date)
        const dayName = arabicDays[date.getDay()]
        const day = date.getDate()
        const month = date.getMonth() + 1
        return `${dayName} ${day}/${month}`
    })

    const series = [
        {
            name: "عدد الطلبات",
            data: data.map((item) => item.count),
        },
    ]

    const options: any = {
        chart: {
            type: "area",
            height: 300,
            toolbar: {
                show: false,
            },
            fontFamily: "inherit",
            foreColor: isDark ? "#a1a1aa" : "#52525b",
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: "12px",
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: "12px",
                },
            },
        },
        colors: ["#3b82f6"],
        grid: {
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            strokeDashArray: 4,
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
                <CardTitle>الطلبات حسب الأيام</CardTitle>
                <CardDescription>عدد الطلبات المنشأة يومياً</CardDescription>
            </CardHeader>
            <CardContent>
                <Chart options={options} series={series} type="area" height={300} />
            </CardContent>
        </Card>
    )
}

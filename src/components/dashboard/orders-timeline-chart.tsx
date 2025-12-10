"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsDarkMode } from "@/hooks/use-mode"
import { useIsMobile } from "@/hooks/use-mobile"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TimelineData {
    date: string
    count: number
}

interface OrdersTimelineChartProps {
    data: TimelineData[]
    isLoading?: boolean
    onPeriodChange?: (days: number) => void
}

export function OrdersTimelineChart({ data: initialData, isLoading = false, onPeriodChange }: OrdersTimelineChartProps) {
    const isDark = useIsDarkMode()
    const isMobile = useIsMobile()
    const [mounted, setMounted] = useState(false)
    const [period, setPeriod] = useState<"week" | "month" | "year">("week")
    const [data, setData] = useState<TimelineData[]>(initialData)

    // استخدام useMemo لحساب إعدادات المخطط فقط عندما تتغير البيانات أو الفترة
    // واستخدام ref للاحتفاظ بآخر إعدادات صالحة أثناء التحميل لمنع التجمد
    const lastConfigRef = useRef<{ options: any; series: any } | null>(null)


    const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

    const chartConfig = useMemo(() => {
        // إذا كان جاري التحميل ولدينا إعدادات سابقة، نستخدمها (نمنع إعادة الحساب ببيانات غير متطابقة)
        if (isLoading && lastConfigRef.current) {
            return lastConfigRef.current
        }

        // معالجة البيانات للعرض السنوي (تجميع شهري)
        let chartData = data
        let categories: string[] = []

        if (period === "year") {
            // تجميع البيانات حسب الشهر
            const monthlyData = new Map<number, number>()
            // تهيئة الأشهر بـ 0
            for (let i = 0; i < 12; i++) {
                monthlyData.set(i, 0)
            }

            data.forEach((item) => {
                const date = new Date(item.date)
                const month = date.getMonth()
                monthlyData.set(month, (monthlyData.get(month) || 0) + item.count)
            })

            const last12Months: { monthIndex: number; label: string; count: number }[] = []
            const today = new Date()

            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
                const monthIndex = d.getMonth()

                const count = data
                    .filter((item) => {
                        const itemDate = new Date(item.date)
                        return (
                            itemDate.getMonth() === monthIndex &&
                            itemDate.getFullYear() === d.getFullYear()
                        )
                    })
                    .reduce((sum, item) => sum + item.count, 0)

                last12Months.push({
                    monthIndex,
                    label: arabicMonths[monthIndex],
                    count,
                })
            }

            chartData = last12Months.map((item) => ({ date: item.label, count: item.count }))
            categories = last12Months.map((item) => item.label)
        } else {
            categories = data.map((item) => {
                const date = new Date(item.date)
                const dayName = arabicDays[date.getDay()]
                const day = date.getDate()
                const month = date.getMonth() + 1

                if (period === "week") {
                    return `${dayName} ${day}/${month}`
                } else {
                    return `${day}/${month}`
                }
            })
        }

        const series = [
            {
                name: "عدد الطلبات",
                data: chartData.map((item) => item.count),
            },
        ]

        const options: any = {
            chart: {
                type: "area",
                height: isMobile ? 250 : 350,
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
                fontFamily: "inherit",
                foreColor: isDark ? "#e4e4e7" : "#52525b",
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: "smooth",
                width: isMobile ? 3 : 2,
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
                    rotate: period === "year" ? -45 : 0,
                    style: {
                        fontSize: isMobile ? "10px" : "12px",
                    },
                },
            },
            yaxis: {
                labels: {
                    show: !isMobile,
                    style: {
                        fontSize: "12px",
                    },
                },
            },
            colors: ["#3b82f6"],
            grid: {
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: false
                    }
                }
            },
            tooltip: {
                theme: isDark ? "dark" : "light",
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                },
                y: {
                    formatter: (value: number) => `${value} طلب`,
                },
            },
        }

        const config = { options, series }
        lastConfigRef.current = config
        return config
    }, [data, period, isDark, isLoading])

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const handlePeriodChange = (value: string) => {
        const newPeriod = value as "week" | "month" | "year"
        setPeriod(newPeriod)
        if (onPeriodChange) {
            const days = newPeriod === "week" ? 7 : newPeriod === "month" ? 30 : 365
            onPeriodChange(days)
        }
    }

    if (!mounted) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>الطلبات حسب الأيام</CardTitle>
                    <CardDescription>عدد الطلبات المنشأة يومياً</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full relative">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>الطلبات حسب الأيام</CardTitle>
                        <CardDescription>عدد الطلبات المنشأة {period === 'year' ? 'شهرياً' : 'يومياً'}</CardDescription>
                    </div>
                    <Tabs value={period} onValueChange={handlePeriodChange} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="week">أسبوع</TabsTrigger>
                            <TabsTrigger value="month">شهر</TabsTrigger>
                            <TabsTrigger value="year">سنة</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            <span className="text-sm text-muted-foreground font-medium">جاري التحميل...</span>
                        </div>
                    </div>
                )}
                {chartConfig && (
                    <Chart key={isDark ? 'dark' : 'light'} options={chartConfig.options} series={chartConfig.series} type="area" height={isMobile ? 250 : 350} />
                )}
            </CardContent>
        </Card>
    )
}

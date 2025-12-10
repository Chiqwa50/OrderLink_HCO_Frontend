"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface DepartmentActivity {
    departmentId: string
    departmentName: string
    departmentCode: string
    orderCount: number
}

interface DepartmentActivityChartProps {
    data: DepartmentActivity[]
}

export function DepartmentActivityChart({ data }: DepartmentActivityChartProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>نشاط الأقسام</CardTitle>
                    <CardDescription>مقارنة عدد الطلبات لكل قسم</CardDescription>
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

    const series = [
        {
            name: "عدد الطلبات",
            data: data.map((item) => item.orderCount),
        },
    ]

    const options: any = {
        chart: {
            type: "bar",
            height: 350,
            toolbar: {
                show: false,
            },
            fontFamily: "inherit",
            foreColor: isDark ? "#a1a1aa" : "#52525b",
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                dataLabels: {
                    position: "top",
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetX: -6,
            style: {
                fontSize: "12px",
                colors: ["#fff"],
            },
        },
        xaxis: {
            categories: data.map((item) => item.departmentName),
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
        colors: ["#8b5cf6"],
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
                <CardTitle>نشاط الأقسام</CardTitle>
                <CardDescription>مقارنة عدد الطلبات لكل قسم</CardDescription>
            </CardHeader>
            <CardContent>
                <Chart options={options} series={series} type="bar" height={350} />
            </CardContent>
        </Card>
    )
}

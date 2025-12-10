"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsDarkMode } from "@/hooks/use-mode"

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
    const isDark = useIsDarkMode()
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
            foreColor: isDark ? "#e4e4e7" : "#52525b",
        },
        plotOptions: {
            bar: {
                horizontal: false, // تغيير إلى عمودي ليتناسب مع الـ Legend في الأسفل
                columnWidth: "55%",
                borderRadius: 4,
                distributed: true, // تلوين كل عمود بلون مختلف
                dataLabels: {
                    position: "top",
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "center",
            fontFamily: "inherit",
            itemMargin: {
                horizontal: 10,
                vertical: 5
            }
        },
        xaxis: {
            categories: data.map((item) => item.departmentName),
            labels: {
                show: false, // إخفاء الأسماء من المحور لأنها موجودة في الـ Legend
                style: {
                    fontSize: "12px",
                },
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: "12px",
                },
            },
        },
        // ألوان متناسقة للأقسام
        colors: [
            "#3b82f6", // blue
            "#10b981", // emerald
            "#f59e0b", // amber
            "#ef4444", // red
            "#8b5cf6", // violet
            "#ec4899", // pink
            "#06b6d4", // cyan
            "#f97316", // orange
        ],
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

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>أكثر الأقسام نشاطاً</CardTitle>
                <CardDescription>أعلى 5 أقسام من حيث عدد الطلبات</CardDescription>
            </CardHeader>
            <CardContent>
                <Chart key={isDark ? 'dark' : 'light'} options={options} series={series} type="bar" height={350} />
            </CardContent>
        </Card>
    )
}

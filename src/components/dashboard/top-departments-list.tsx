"use client"

import { Building2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DepartmentActivity {
    departmentId: string
    departmentName: string
    departmentCode: string
    orderCount: number
}

interface TopDepartmentsListProps {
    data: DepartmentActivity[]
}

export function TopDepartmentsList({ data }: TopDepartmentsListProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>أكثر الأقسام نشاطاً</CardTitle>
                    <CardDescription>أعلى 5 أقسام إنشاءً للطلبات</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        لا توجد بيانات متاحة
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>أكثر الأقسام نشاطاً</CardTitle>
                <CardDescription>أعلى 5 أقسام إنشاءً للطلبات</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.slice(0, 5).map((dept, index) => (
                        <div
                            key={dept.departmentId}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    {index === 0 ? (
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    ) : (
                                        <Building2 className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-none">
                                        {dept.departmentName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {dept.departmentCode}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-sm">
                                {dept.orderCount} طلب
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

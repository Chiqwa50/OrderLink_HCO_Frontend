"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Loader2, Package, ShoppingCart, Truck } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // توجيه المستخدم حسب دوره إذا لم يكن مسؤولاً
    if (!isLoading && user) {
      const role = user.role.toUpperCase()

      switch (role) {
        case "DEPARTMENT":
          router.push("/orders/my-orders")
          break
        case "WAREHOUSE":
          router.push("/orders/manage")
          break
        case "DRIVER":
          router.push("/deliveries/pending")
          break
        // ADMIN يبقى في الـ dashboard
        case "ADMIN":
          break
        default:
          break
      }
    }
  }, [user, isLoading, router])

  // عرض loading أثناء التحقق
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Dashboard للمسؤول فقط
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">لوحة التحكم</h2>
          <p className="text-muted-foreground">
            مرحباً {user?.name} - {user?.role === "ADMIN" ? "مدير النظام" : ""}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الطلبات
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              جميع الطلبيات في النظام
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">تحتاج للمراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد التجهيز</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">قيد التجهيز حالياً</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم التسليم</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">طلبيات مكتملة</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة</CardTitle>
            <CardDescription>إحصائيات النظام الكاملة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ابدأ باستخدام النظام من القائمة الجانبية
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>الوصول السريع للوظائف</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                استخدم القائمة الجانبية للتنقل
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

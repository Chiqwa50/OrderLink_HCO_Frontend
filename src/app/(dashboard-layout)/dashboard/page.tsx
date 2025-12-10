"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrdersTimelineChart } from "@/components/dashboard/orders-timeline-chart"
import { DepartmentActivityChart } from "@/components/dashboard/department-activity-chart"
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart"
import { TopItemsList } from "@/components/dashboard/top-items-list"
import { TopDepartmentsList } from "@/components/dashboard/top-departments-list"
import { useToast } from "@/hooks/use-toast"

interface DashboardData {
  stats: {
    totalOrders: number
    todayOrders: number
    pendingOrders: number
    preparingOrders: number
    readyOrders: number
    deliveredOrders: number
    activeDrivers: number
    activeDepartments: number
    activeWarehouses: number
  }
  timeline: Array<{ date: string; count: number }>
  departments: Array<{
    departmentId: string
    departmentName: string
    departmentCode: string
    orderCount: number
  }>
  topItems: Array<{
    itemName: string
    totalQuantity: number
    orderCount: number
  }>
  statusDistribution: Array<{
    status: import("@/types").OrderStatus
    count: number
    percentage: number
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // توجيه المستخدم حسب دوره إذا لم يكن مسؤولاً
    if (!authLoading && user) {
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
        case "ADMIN":
          // المسؤول يبقى في الـ dashboard
          fetchDashboardData()
          break
        default:
          break
      }
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      const [statsRes, timelineRes, departmentsRes, itemsRes, distributionRes] =
        await Promise.all([
          api.getDashboardStats(),
          api.getOrdersTimeline(7),
          api.getDepartmentActivity(10),
          api.getTopItems(5),
          api.getOrderStatusDistribution(),
        ])

      setData({
        stats: statsRes.stats,
        timeline: timelineRes.timeline,
        departments: departmentsRes.departments,
        topItems: itemsRes.items,
        statusDistribution: distributionRes.distribution,
      })
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء جلب بيانات لوحة التحكم",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // عرض loading أثناء التحقق من المصادقة
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // عرض loading أثناء جلب البيانات
  if (isLoading || !data) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              لوحة التحكم
            </h2>
            <p className="text-muted-foreground">
              مرحباً {user?.name} - مدير النظام
            </p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[400px] rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            لوحة التحكم
          </h2>
          <p className="text-muted-foreground">
            مرحباً {user?.name} - مدير النظام
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="إجمالي الطلبات"
          value={data.stats.totalOrders}
          description="جميع الطلبات في النظام"
          icon={ShoppingCart}
          iconClassName="text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="طلبات اليوم"
          value={data.stats.todayOrders}
          description="الطلبات المنشأة اليوم"
          icon={Clock}
          iconClassName="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="قيد المراجعة"
          value={data.stats.pendingOrders}
          description="تحتاج للموافقة"
          icon={Package}
          iconClassName="text-orange-600 dark:text-orange-400"
        />
        <StatsCard
          title="قيد التجهيز"
          value={data.stats.preparingOrders}
          description="قيد التجهيز حالياً"
          icon={PackageCheck}
          iconClassName="text-purple-600 dark:text-purple-400"
        />
        <StatsCard
          title="جاهزة للتوصيل"
          value={data.stats.readyOrders}
          description="جاهزة للاستلام"
          icon={Truck}
          iconClassName="text-green-600 dark:text-green-400"
        />
        <StatsCard
          title="تم التسليم"
          value={data.stats.deliveredOrders}
          description="طلبات مكتملة"
          icon={PackageCheck}
          iconClassName="text-cyan-600 dark:text-cyan-400"
        />
        <StatsCard
          title="السائقون النشطون"
          value={data.stats.activeDrivers}
          description="سائقون في النظام"
          icon={Users}
          iconClassName="text-indigo-600 dark:text-indigo-400"
        />
        <StatsCard
          title="الأقسام والمستودعات"
          value={`${data.stats.activeDepartments} / ${data.stats.activeWarehouses}`}
          description="قسم / مستودع نشط"
          icon={Building2}
          iconClassName="text-pink-600 dark:text-pink-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {/* Orders Timeline - Full width on mobile, 2 cols on lg, 2 cols on xl */}
        <div className="lg:col-span-2">
          <OrdersTimelineChart data={data.timeline} />
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-2 xl:col-span-1">
          <StatusDistributionChart data={data.statusDistribution} />
        </div>

        {/* Department Activity - Full width on mobile, 2 cols on lg, 2 cols on xl */}
        <div className="lg:col-span-2">
          <DepartmentActivityChart data={data.departments} />
        </div>

        {/* Top Items */}
        <div className="lg:col-span-1">
          <TopItemsList data={data.topItems} />
        </div>

        {/* Top Departments */}
        <div className="lg:col-span-1">
          <TopDepartmentsList data={data.departments} />
        </div>
      </div>
    </div>
  )
}

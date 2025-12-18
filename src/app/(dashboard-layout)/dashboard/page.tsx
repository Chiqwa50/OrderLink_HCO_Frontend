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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrdersTimelineChart } from "@/components/dashboard/orders-timeline-chart"
import { DepartmentActivityChart } from "@/components/dashboard/department-activity-chart"
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart"
import { TopItemsList } from "@/components/dashboard/top-items-list"
import { TopWarehouseUsersList } from "@/components/dashboard/top-warehouse-users-list"
import { useToast } from "@/hooks/use-toast"
import { OrderDetailsSlidePanel } from "@/components/orders/order-details-slide-panel"

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
  topWarehouseUsers: Array<{
    userId: string
    userName: string
    warehousesLabel: string
    completedOrders: number
    avgPreparationTime: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    createdAt: string
    departmentName: string
    warehouseName: string
  }>
  recentUnavailableItems: Array<{
    id: string
    itemName: string
    warehouse: { name: string }
    timestamp: string
    order: {
      id: string
      orderNumber: string
    }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timelineDays, setTimelineDays] = useState(7)
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)

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

      const [
        statsRes,
        timelineRes,
        departmentsRes,
        itemsRes,
        distributionRes,
        warehouseUsersRes,
        recentOrdersRes,
        recentUnavailableItemsRes,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getOrdersTimeline(timelineDays),
        api.getDepartmentActivity(5),
        api.getTopItems(5),
        api.getOrderStatusDistribution(),
        api.getTopWarehouseUsers(5),
        api.getRecentOrders(5),
        api.getRecentUnavailableItems(5),
      ])

      setData({
        stats: statsRes.stats,
        timeline: timelineRes.timeline,
        departments: departmentsRes.departments,
        topItems: itemsRes.items,
        statusDistribution: distributionRes.distribution,
        topWarehouseUsers: warehouseUsersRes.users,
        recentOrders: recentOrdersRes.orders,
        recentUnavailableItems: recentUnavailableItemsRes.logs,
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

  const handleTimelinePeriodChange = async (days: number) => {
    setTimelineDays(days)
    setIsTimelineLoading(true)
    try {
      const timelineRes = await api.getOrdersTimeline(days)
      if (data) {
        setData({
          ...data,
          timeline: timelineRes.timeline,
        })
      }
    } catch (error: any) {
      console.error("Error fetching timeline data:", error)
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء جلب بيانات الطلبات",
        variant: "destructive",
      })
    } finally {
      setIsTimelineLoading(false)
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
      {/* Statistics Cards */}
      {(() => {
        const statsCards = [
          {
            title: "إجمالي الطلبات",
            value: data.stats.totalOrders,
            description: "جميع الطلبات في النظام",
            icon: ShoppingCart,
            iconClassName: "text-blue-600 dark:text-blue-400",
          },
          {
            title: "طلبات اليوم",
            value: data.stats.todayOrders,
            description: "الطلبات المنشأة اليوم",
            icon: Clock,
            iconClassName: "text-amber-600 dark:text-amber-400",
          },
          {
            title: "قيد المراجعة",
            value: data.stats.pendingOrders,
            description: "تحتاج للموافقة",
            icon: Package,
            iconClassName: "text-orange-600 dark:text-orange-400",
          },
          {
            title: "قيد التجهيز",
            value: data.stats.preparingOrders,
            description: "قيد التجهيز حالياً",
            icon: PackageCheck,
            iconClassName: "text-purple-600 dark:text-purple-400",
          },
          {
            title: "جاهزة للتوصيل",
            value: data.stats.readyOrders,
            description: "جاهزة للاستلام",
            icon: Truck,
            iconClassName: "text-green-600 dark:text-green-400",
          },
          {
            title: "تم التسليم",
            value: data.stats.deliveredOrders,
            description: "طلبات مكتملة",
            icon: PackageCheck,
            iconClassName: "text-cyan-600 dark:text-cyan-400",
          },
          {
            title: "السائقون النشطون",
            value: data.stats.activeDrivers,
            description: "سائقون في النظام",
            icon: Users,
            iconClassName: "text-indigo-600 dark:text-indigo-400",
          },
          {
            title: "الأقسام والمستودعات",
            value: `${data.stats.activeDepartments} / ${data.stats.activeWarehouses}`,
            description: "قسم / مستودع نشط",
            icon: Building2,
            iconClassName: "text-pink-600 dark:text-pink-400",
          },
        ]

        return (
          <div className="space-y-4">
            {/* Mobile/Tablet View - Carousel */}
            <div className="block lg:hidden px-1">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  direction: "rtl",
                }}
                className="w-full"
              >
                <CarouselContent>
                  {statsCards.map((card, index) => (
                    <CarouselItem key={index} className="md:basis-1/2">
                      <StatsCard {...card} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </div>
              </Carousel>
            </div>

            {/* Desktop View - Grid */}
            <div className="hidden lg:grid gap-4 grid-cols-4">
              {statsCards.map((card, index) => (
                <StatsCard key={index} {...card} />
              ))}
            </div>
          </div>
        )
      })()}

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Orders Timeline - Full width */}
        <div className="lg:col-span-2">
          <OrdersTimelineChart
            data={data.timeline}
            isLoading={isTimelineLoading}
            onPeriodChange={handleTimelinePeriodChange}
          />
        </div>

        {/* Department Activity */}
        <div className="lg:col-span-1">
          <DepartmentActivityChart data={data.departments} />
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-1">
          <StatusDistributionChart data={data.statusDistribution} />
        </div>

        {/* Top Items - Full width */}
        <div className="lg:col-span-1">
          <TopItemsList data={data.topItems} />
        </div>

        {/* Top Warehouse Users */}
        <div className="lg:col-span-1">
          <TopWarehouseUsersList data={data.topWarehouseUsers} />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>آخر الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد طلبات حديثة
                </p>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          رقم الطلب
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          الحالة
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {data.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                          onClick={() => {
                            setSelectedOrderId(order.id)
                            setShowDetailsPanel(true)
                          }}
                        >
                          <td className="p-4 align-middle font-medium text-primary hover:underline">
                            {order.orderNumber}
                          </td>
                          <td className="p-4 align-middle">{order.status}</td>
                          <td className="p-4 align-middle" dir="ltr">
                            {format(new Date(order.createdAt), "yyyy/MM/dd")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Unavailable Items */}
        <Card>
          <CardHeader>
            <CardTitle>آخر المواد غير المتوفرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentUnavailableItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد سجلات حديثة
                </p>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          المادة
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          المستودع
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {data.recentUnavailableItems.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                          onClick={() => {
                            if (log.order?.id) {
                              setSelectedOrderId(log.order.id)
                              setShowDetailsPanel(true)
                            }
                          }}
                        >
                          <td className="p-4 align-middle font-medium text-primary hover:underline">
                            {log.itemName}
                          </td>
                          <td className="p-4 align-middle">
                            {log.warehouse?.name || "-"}
                          </td>
                          <td className="p-4 align-middle" dir="ltr">
                            {format(new Date(log.timestamp), "yyyy/MM/dd")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderDetailsSlidePanel
        orderId={selectedOrderId}
        open={showDetailsPanel}
        onOpenChange={setShowDetailsPanel}
      />
    </div>
  )
}

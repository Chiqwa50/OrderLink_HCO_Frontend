"use client"

import { useEffect, useState } from "react"
import { orderService } from "@/services/order-service"
import { pdfService } from "@/services/pdf-service"
import { Loader2, Package, RefreshCw } from "lucide-react"

import type { Order } from "@/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeliveriesTable } from "@/components/orders/deliveries-table"

import { useResponsiveView } from "@/hooks/use-responsive-view"
import { LayoutGrid, LayoutList } from "lucide-react"
import { OrderCard } from "@/components/orders/order-card"

export default function CompletedDeliveriesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useResponsiveView()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await orderService.getDeliveredOrders()

      // Filter only orders delivered by a DRIVER
      // We check the history for the 'DELIVERED' status entry and check the user role
      const driverOrders = data.filter(order => {
        // If no history, we can't determine, so maybe exclude? Or include if we assume?
        // Requirement: "show only driver delivery data"
        if (!order.history) return false;

        const deliveredLog = order.history.find(h => h.status === 'DELIVERED');
        // Check if the user who delivered it has role 'DRIVER'
        return deliveredLog?.user?.role === 'DRIVER';
      });

      setOrders(driverOrders)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الطلبيات"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async (order: Order) => {
    try {
      await pdfService.downloadOrderPDF(order)
    } catch (err) {
      console.error("Error downloading PDF:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل الطلبيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">سجل التوصيلات</h2>
            <p className="text-muted-foreground">
              سجل توصيلات السائقين
            </p>
          </div>

          {/* View Mode Toggle - Mobile */}
          <div className="flex md:hidden items-center border rounded-md bg-background">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-md rounded-r-none h-8 px-2"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-md rounded-l-none h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* View Mode Toggle - Desktop */}
          <div className="hidden md:flex items-center border rounded-md">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-md rounded-r-none h-9"
            >
              <LayoutList className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">جدول</span>
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-md rounded-l-none h-9"
            >
              <LayoutGrid className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">بطاقات</span>
            </Button>
          </div>

          <Button onClick={loadOrders} className="w-full md:w-auto">
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* إحصائيات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            إجمالي التوصيلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">توصيلة ناجحة</p>
        </CardContent>
      </Card>

      {/* جدول التوصيلات */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التوصيلات</CardTitle>
          <CardDescription>عرض جميع التوصيلات التي قام بها السائقون</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد توصيلات مكتملة</p>
            </div>
          ) : viewMode === "table" ? (
            <DeliveriesTable orders={orders} onViewOrder={(order) => console.log("View order", order)} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => console.log("View order", order)}
                  onDownloadPDF={() => handleDownloadPDF(order)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

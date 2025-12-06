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
import { OrdersTable } from "@/components/orders/orders-table"

export default function CompletedDeliveriesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await orderService.getDeliveredOrders()
      setOrders(data)
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">سجل التوصيلات</h2>
          <p className="text-muted-foreground">
            جميع الطلبيات التي تم تسليمها بنجاح
          </p>
        </div>
        <Button onClick={loadOrders} variant="outline">
          <RefreshCw className="ml-2 h-4 w-4" />
          تحديث
        </Button>
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
            إجمالي التوصيلات المكتملة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">طلبية مسلمة</p>
        </CardContent>
      </Card>

      {/* جدول التوصيلات */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التوصيلات</CardTitle>
          <CardDescription>عرض جميع الطلبيات المسلمة</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد توصيلات مكتملة</p>
            </div>
          ) : (
            <OrdersTable orders={orders} onDownloadPDF={handleDownloadPDF} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { orderService } from "@/services/order-service"
import { CheckCircle2, Loader2, RefreshCw, Truck } from "lucide-react"

import type { Order } from "@/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OrderCard } from "@/components/orders/order-card"

export default function PendingDeliveriesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDelivering, setIsDelivering] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await orderService.getReadyOrders()
      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الطلبيات"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeliverOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowConfirmDialog(true)
  }

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return

    setIsDelivering(true)
    try {
      await orderService.updateOrderStatus(selectedOrder.id, {
        status: "DELIVERED",
        notes: "تم التسليم بواسطة السائق",
      })

      // تحديث القائمة
      await loadOrders()
      setShowConfirmDialog(false)
      setSelectedOrder(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تأكيد التسليم"
      )
    } finally {
      setIsDelivering(false)
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
          <h2 className="text-3xl font-bold tracking-tight">
            الطلبيات الجاهزة للتوصيل
          </h2>
          <p className="text-muted-foreground">
            الطلبيات المجهزة والجاهزة للتسليم إلى الأقسام
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
            <Truck className="h-4 w-4" />
            طلبيات جاهزة للتوصيل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">في انتظار التسليم</p>
        </CardContent>
      </Card>

      {/* قائمة الطلبيات */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد طلبيات جاهزة</h3>
            <p className="text-muted-foreground text-center">
              جميع الطلبيات تم تسليمها أو لا تزال قيد التجهيز
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onDeliver={handleDeliverOrder}
            />
          ))}
        </div>
      )}

      {/* Dialog تأكيد التسليم */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد التسليم</DialogTitle>
            <DialogDescription>
              هل تريد تأكيد تسليم الطلبية رقم {selectedOrder?.orderNumber}؟
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">القسم المستلم:</span>{" "}
                {selectedOrder?.departmentName}
              </p>
              <p className="text-sm">
                <span className="font-medium">عدد المواد:</span>{" "}
                {selectedOrder?.items.length}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isDelivering}
            >
              إلغاء
            </Button>
            <Button onClick={handleConfirmDelivery} disabled={isDelivering}>
              {isDelivering && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              تأكيد التسليم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

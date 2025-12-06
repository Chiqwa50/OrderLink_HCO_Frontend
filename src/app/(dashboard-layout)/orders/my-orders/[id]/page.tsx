"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { orderService } from "@/services/order-service"
import {
  ArrowRight,
  Calendar,
  FileText,
  Loader2,
  Package,
  User,
} from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"

const unitLabels: Record<string, string> = {
  piece: "قطعة",
  box: "علبة",
  carton: "كرتون",
  kg: "كجم",
  liter: "لتر",
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string)
    }
  }, [params.id])

  const loadOrder = async (orderId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await orderService.getOrderById(orderId)
      setOrder(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل تفاصيل الطلب"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل التفاصيل...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error || "لم يتم العثور على الطلب"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
      </div>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">
                طلبية رقم {order.orderNumber}
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{order.departmentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            المواد المطلوبة ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.itemName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {item.quantity}
                  </span>
                  <span>{unitLabels[item.unit] || item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ملاحظات إضافية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

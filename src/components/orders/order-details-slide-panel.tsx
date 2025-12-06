"use client"

import { useEffect, useState } from "react"
import { orderService } from "@/services/order-service"
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Loader2,
  Package,
  User,
  Warehouse,
  X,
  XCircle,
} from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { OrderStatusBadge } from "./order-status-badge"

interface OrderDetailsSlidePanelProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PreparationLog {
  id: string
  action: string
  itemName: string | null
  requestedQty: number | null
  availableQty: number | null
  notes: string | null
  timestamp: string
  user: {
    name: string
    role: string
  }
  warehouse: {
    name: string
  }
}

const actionLabels: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  ITEM_AVAILABLE: {
    label: "مادة متوفرة",
    icon: CheckCircle,
    color: "text-green-600",
  },
  ITEM_UNAVAILABLE: {
    label: "مادة غير متوفرة",
    icon: XCircle,
    color: "text-red-600",
  },
  QUANTITY_ADJUSTED: {
    label: "تعديل الكمية",
    icon: Edit,
    color: "text-amber-600",
  },
  STATUS_CHANGED: {
    label: "تغيير الحالة",
    icon: AlertCircle,
    color: "text-blue-600",
  },
  ORDER_APPROVED: {
    label: "تم قبول الطلب",
    icon: CheckCircle,
    color: "text-green-600",
  },
  ORDER_REJECTED: {
    label: "تم رفض الطلب",
    icon: XCircle,
    color: "text-red-600",
  },
  ORDER_READY: {
    label: "الطلب جاهز",
    icon: CheckCircle,
    color: "text-green-600",
  },
  ORDER_COMPLETED: {
    label: "تم إكمال تجهيز الطلب",
    icon: CheckCircle,
    color: "text-green-600",
  },
}

export function OrderDetailsSlidePanel({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsSlidePanelProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [preparationLogs, setPreparationLogs] = useState<PreparationLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails()
    }
  }, [open, orderId])

  const loadOrderDetails = async () => {
    if (!orderId) return

    setLoading(true)
    try {
      const [orderData, logsResponse] = await Promise.all([
        orderService.getOrderById(orderId),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/orders/${orderId}/preparation-logs`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ).then((res) => res.json()),
      ])

      setOrder(orderData)
      setPreparationLogs(logsResponse.logs || [])
    } catch (error) {
      console.error("Error loading order details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!orderId) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/orders/${orderId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (!response.ok) throw new Error("فشل تحميل PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `order-${order?.orderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>تفاصيل الطلب</SheetTitle>
          <SheetDescription>عرض تفاصيل الطلب وسجل التجهيز</SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    طلب رقم {order.orderNumber}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    تفاصيل الطلب وسجل التجهيز
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">تحميل PDF</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-6">
                {/* معلومات الطلب الأساسية */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">معلومات الطلب</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>القسم</span>
                      </div>
                      <p className="font-medium">{order.departmentName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Warehouse className="h-4 w-4" />
                        <span>المستودع</span>
                      </div>
                      <p className="font-medium">{order.warehouseName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>أنشئ بواسطة</span>
                      </div>
                      <p className="font-medium">{order.createdByName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>تاريخ الإنشاء</span>
                      </div>
                      <p className="font-medium text-sm">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        الحالة
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        عدد المواد
                      </div>
                      <p className="font-medium">{order.items.length} مادة</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        ملاحظات
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* قائمة المواد */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    قائمة المواد
                  </h3>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.name || item.itemName}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الخط الزمني للتجهيز */}
                {preparationLogs.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        سجل التجهيز ({preparationLogs.length})
                      </h3>

                      <div className="relative space-y-3 pr-4">
                        {/* Vertical line */}
                        <div className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-border" />

                        {preparationLogs.map((log, index) => {
                          const actionInfo = actionLabels[log.action] || {
                            label: log.action,
                            icon: AlertCircle,
                            color: "text-gray-600",
                          }
                          const Icon = actionInfo.icon

                          return (
                            <div key={log.id} className="relative flex gap-3">
                              {/* Timeline dot */}
                              <div
                                className={cn(
                                  "relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background mt-1",
                                  actionInfo.color.replace("text-", "border-")
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    actionInfo.color.replace("text-", "bg-")
                                  )}
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 pb-3">
                                <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Icon
                                        className={cn(
                                          "h-4 w-4",
                                          actionInfo.color
                                        )}
                                      />
                                      <span className="font-semibold text-sm">
                                        {actionInfo.label}
                                      </span>
                                    </div>
                                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDateTime(log.timestamp)}
                                    </time>
                                  </div>

                                  {/* Item Details */}
                                  {log.itemName && (
                                    <div className="mb-2">
                                      <span className="text-xs text-muted-foreground">
                                        المادة:{" "}
                                      </span>
                                      <span className="text-sm font-medium">
                                        {log.itemName}
                                      </span>
                                    </div>
                                  )}

                                  {/* Quantities */}
                                  {(log.requestedQty !== null ||
                                    log.availableQty !== null) && (
                                    <div className="flex gap-3 text-xs mb-2">
                                      {log.requestedQty !== null && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground">
                                            المطلوب:
                                          </span>
                                          <span className="font-semibold">
                                            {log.requestedQty}
                                          </span>
                                        </div>
                                      )}
                                      {log.availableQty !== null && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground">
                                            المتوفر:
                                          </span>
                                          <span className="font-semibold">
                                            {log.availableQty}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Notes - Don't show if it duplicates the action label */}
                                  {log.notes &&
                                    log.notes !== actionInfo.label && (
                                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-2">
                                        {log.notes}
                                      </div>
                                    )}

                                  {/* Footer: User & Warehouse */}
                                  <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium">
                                      {log.user?.name || "غير محدد"}
                                    </span>
                                    <span>•</span>
                                    <Warehouse className="h-3 w-3" />
                                    <span>
                                      {log.warehouse?.name || "غير محدد"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            لا توجد بيانات
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

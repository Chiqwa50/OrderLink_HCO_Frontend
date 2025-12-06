"use client"

import { Building2, Calendar, Package, User, Warehouse } from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "./order-status-badge"

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            تفاصيل الطلب {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* معلومات الطلب الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <p className="font-medium">{order.warehouseName}</p>
                  {order.warehouseCode && (
                    <p className="text-sm text-muted-foreground">
                      {order.warehouseCode}
                    </p>
                  )}
                </div>
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
                  <Calendar className="h-4 w-4" />
                  <span>تاريخ الإنشاء</span>
                </div>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>آخر تحديث</span>
                </div>
                <p className="font-medium">{formatDateTime(order.updatedAt)}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">الحالة</div>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* الملاحظات */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">الملاحظات</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {order.notes}
                  </p>
                </div>
              </>
            )}

            {/* قائمة المواد */}
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                قائمة المواد ({order.items.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-3 text-sm font-medium">
                        اسم المادة
                      </th>
                      <th className="text-right p-3 text-sm font-medium">
                        الكمية
                      </th>
                      <th className="text-right p-3 text-sm font-medium">
                        الوحدة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="border-t hover:bg-muted/50"
                      >
                        <td className="p-3 text-sm">
                          {item.name || item.itemName}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline">{item.unit}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* تواريخ إضافية */}
            {(order.deliveredAt || order.rejectionReason) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">معلومات إضافية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.deliveredAt && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          تاريخ التسليم
                        </div>
                        <p className="font-medium">
                          {formatDateTime(order.deliveredAt)}
                        </p>
                      </div>
                    )}
                    {order.rejectionReason && (
                      <div className="space-y-2 md:col-span-2">
                        <div className="text-sm text-muted-foreground">
                          سبب الرفض
                        </div>
                        <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                          {order.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

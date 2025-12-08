"use client"

import { useState } from "react"
import { Download, Edit, Eye, Package, Search, Trash2 } from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderStatusBadge } from "./order-status-badge"

interface OrdersTableProps {
  orders: Order[]
  onViewOrder?: (order: Order) => void
  onDownloadPDF?: (order: Order) => void
  onDeleteOrder?: (order: Order) => void
  onEditOrder?: (order: Order) => void
  showDepartment?: boolean
}

export function OrdersTable({
  orders,
  onViewOrder,
  onDownloadPDF,
  onDeleteOrder,
  onEditOrder,
  showDepartment = true,
}: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.departmentName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order)
  }

  const handleDownloadClick = async (order: Order) => {
    if (!onDownloadPDF) return
    try {
      setDownloadingOrderId(order.id)
      await onDownloadPDF(order)
    } finally {
      setDownloadingOrderId(null)
    }
  }

  const confirmDelete = () => {
    if (orderToDelete && onDeleteOrder) {
      onDeleteOrder(orderToDelete)
      setOrderToDelete(null)
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الطلبية أو القسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الطلبية</TableHead>
              {showDepartment && (
                <TableHead className="text-right">القسم</TableHead>
              )}
              <TableHead className="text-right">المستودع</TableHead>
              <TableHead className="text-right">عدد المواد</TableHead>
              <TableHead className="text-right">تاريخ الطلب</TableHead>
              <TableHead className="text-right">تاريخ التسليم</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showDepartment ? 8 : 7}
                  className="text-center h-24 text-muted-foreground"
                >
                  لا توجد طلبيات
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  {showDepartment && (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.departmentName}
                        </span>
                        {order.createdByName && (
                          <span className="text-xs text-muted-foreground">
                            {order.createdByName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.warehouseName}</span>
                      {order.warehouseCode && (
                        <span className="text-xs text-muted-foreground">
                          {order.warehouseCode}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{order.items.length}</span>
                      {/* Partial Preparation Badge */}
                      {order.status === "PREPARING" &&
                        order.preparationProgress?.hasPartialPreparation && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs border-amber-500 text-amber-700 dark:text-amber-400 w-fit"
                          >
                            <Package className="h-3 w-3" />
                            محفوظ {order.preparationProgress.logged} من{" "}
                            {order.preparationProgress.total}
                          </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>
                    {order.status === "DELIVERED" && order.deliveredAt
                      ? formatDateTime(order.deliveredAt)
                      : order.status === "REJECTED"
                        ? "-"
                        : "قيد المعالجة"}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-2 justify-end">
                      {onViewOrder && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewOrder(order)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onDownloadPDF && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadClick(order)}
                          title="تحميل PDF"
                          disabled={downloadingOrderId === order.id}
                        >
                          {downloadingOrderId === order.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {onEditOrder &&
                        !["DELIVERED", "REJECTED"].includes(order.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditOrder(order)}
                            title="تعديل الطلب"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      {onDeleteOrder && order.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(order)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="حذف الطلب"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        عرض {filteredOrders.length} من {orders.length} طلبية
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف الطلب؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الطلبية رقم {orderToDelete?.orderNumber} نهائياً. لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

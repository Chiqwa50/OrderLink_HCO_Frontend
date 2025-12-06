"use client"

import {
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Package,
  Trash2,
  Truck,
  User,
  XCircle,
} from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrderStatusBadge } from "./order-status-badge"

interface OrderCardProps {
  order: Order
  userRole?: string
  isProcessing?: boolean
  onView?: (order: Order) => void
  onDownloadPDF?: (order: Order) => Promise<void>
  onApprove?: (order: Order) => void
  onReject?: (order: Order) => void
  onMarkPreparing?: (order: Order) => void
  onPrepare?: (order: Order) => void
  onMarkReady?: (order: Order) => void
  onEdit?: (order: Order) => void
  onDelete?: (order: Order) => void
  onDeliver?: (order: Order) => void
  onReceive?: (order: Order) => void
  className?: string
}

const unitLabels: Record<string, string> = {
  piece: "قطعة",
  box: "علبة",
  carton: "كرتون",
  kg: "كجم",
  liter: "لتر",
}

export function OrderCard({
  order,
  userRole,
  isProcessing = false,
  onView,
  onDownloadPDF,
  onApprove,
  onReject,
  onMarkPreparing,
  onPrepare,
  onMarkReady,
  onEdit,
  onDelete,
  onDeliver,
  onReceive,
  className,
}: OrderCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-md transition-shadow",
        className
      )}
    >
      <CardHeader className="pb-3 space-y-3">
        {/* Title - Full width */}
        <CardTitle className="text-base sm:text-lg md:text-xl">
          طلبية رقم {order.orderNumber}
        </CardTitle>

        {/* Status Badge and Info */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} className="self-start" />
          </div>
          <CardDescription className="flex flex-col gap-1.5 text-xs sm:text-sm">
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate font-medium">
                  {order.departmentName}
                </span>
              </span>
              {order.createdByName && (
                <span className="text-xs text-muted-foreground mr-6">
                  {order.createdByName}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">
                {formatDateTime(order.createdAt)}
              </span>
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>المواد المطلوبة ({order.items.length})</span>
            </div>
            {/* Partial Preparation Badge */}
            {order.status === "PREPARING" &&
              order.preparationProgress?.hasPartialPreparation && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-amber-500 text-amber-700 dark:text-amber-400"
                >
                  <Package className="h-3 w-3" />
                  محفوظ {order.preparationProgress.logged}/
                  {order.preparationProgress.total}
                </Badge>
              )}
          </div>
          <div className="space-y-2">
            {order.items.slice(0, 3).map((item, index) => (
              <div
                key={item.id || index}
                className="flex justify-between items-center text-sm bg-muted/50 rounded-md p-2"
              >
                <span className="font-medium truncate flex-1">
                  {item.itemName}
                </span>
                <span className="text-muted-foreground whitespace-nowrap ml-2">
                  {item.quantity} {unitLabels[item.unit] || item.unit}
                </span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                + {order.items.length - 3} مواد أخرى
              </p>
            )}
          </div>

          {order.notes && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-muted-foreground mb-1">
                    ملاحظات:
                  </p>
                  <p className="text-foreground">{order.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="ml-2 h-4 w-4" />
              )}
              {isProcessing ? "جاري المعالجة..." : "الإجراءات"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            {/* الإجراءات الأساسية - تظهر دائماً */}
            <DropdownMenuItem
              onClick={() => onView?.(order)}
              disabled={isProcessing}
            >
              <Eye className="ml-2 h-4 w-4" />
              عرض التفاصيل
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDownloadPDF?.(order)}
              disabled={isProcessing}
            >
              <Download className="ml-2 h-4 w-4" />
              تحميل PDF
            </DropdownMenuItem>

            {/* إجراءات المدير */}
            {userRole === "ADMIN" && order.status === "PENDING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onApprove?.(order)}
                  className="text-green-600 focus:text-green-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "قبول الطلب"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onReject?.(order)}
                  className="text-orange-600 focus:text-orange-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "رفض الطلب"}
                </DropdownMenuItem>
              </>
            )}

            {/* إجراءات مسؤول المستودع - للطلبات المعتمدة */}
            {userRole === "WAREHOUSE" && order.status === "APPROVED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onMarkPreparing?.(order)}
                  className="text-amber-600 focus:text-amber-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "قيد التجهيز"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMarkReady?.(order)}
                  className="text-green-600 focus:text-green-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "جاهز مباشرة"}
                </DropdownMenuItem>
              </>
            )}

            {/* إجراءات مسؤول المستودع - للطلبات قيد التجهيز */}
            {userRole === "WAREHOUSE" && order.status === "PREPARING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onPrepare?.(order)}
                  className="text-blue-600 focus:text-blue-600"
                  disabled={isProcessing}
                >
                  <Package className="ml-2 h-4 w-4" />
                  تجهيز الطلب
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMarkReady?.(order)}
                  className="text-green-600 focus:text-green-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "جاهز مباشرة"}
                </DropdownMenuItem>
              </>
            )}

            {/* تسليم - للسائقين */}
            {onDeliver && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeliver(order)}
                  className="text-blue-600 focus:text-blue-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "تسليم الطلب"}
                </DropdownMenuItem>
              </>
            )}

            {/* استلام - لمسؤولي الأقسام الذين لديهم الصلاحية */}
            {onReceive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onReceive(order)}
                  className="text-green-600 focus:text-green-600"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  )}
                  {isProcessing ? "جاري المعالجة..." : "استلام الطلب"}
                </DropdownMenuItem>
              </>
            )}

            {/* تعديل - للمدير فقط */}
            {userRole === "ADMIN" &&
              !["DELIVERED", "REJECTED"].includes(order.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onEdit?.(order)}
                    disabled={isProcessing}
                  >
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل
                  </DropdownMenuItem>
                </>
              )}

            {/* حذف - للجميع في حالة PENDING */}
            {order.status === "PENDING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(order)}
                  className="text-destructive focus:text-destructive"
                  disabled={isProcessing}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

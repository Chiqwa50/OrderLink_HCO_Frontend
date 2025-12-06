import type { OrderStatus } from "@/types"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: string; className: string }
> = {
  PENDING: {
    label: "قيد المراجعة",
    variant: "secondary",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  APPROVED: {
    label: "تم الموافقة",
    variant: "default",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  PREPARING: {
    label: "قيد التجهيز",
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  READY: {
    label: "جاهز للتوصيل",
    variant: "default",
    className:
      "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  },
  DELIVERED: {
    label: "تم التسليم",
    variant: "default",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  REJECTED: {
    label: "مرفوض",
    variant: "destructive",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status]

  // Handle invalid or undefined status
  if (!config) {
    console.warn(`Invalid order status: ${status}`)
    return (
      <Badge
        variant="secondary"
        className={cn(
          "font-medium whitespace-nowrap px-2 py-0.5 text-[10px] sm:text-xs md:text-sm sm:px-2.5",
          className
        )}
      >
        {status || "غير محدد"}
      </Badge>
    )
  }

  return (
    <Badge
      variant={
        config.variant as "default" | "secondary" | "destructive" | "outline"
      }
      className={cn(
        "font-medium whitespace-nowrap px-2 py-0.5 text-[10px] sm:text-xs md:text-sm sm:px-2.5",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

export function getStatusLabel(status: OrderStatus): string {
  return statusConfig[status]?.label || status || "غير محدد"
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING: "text-yellow-600",
    APPROVED: "text-green-600",
    PREPARING: "text-blue-600",
    READY: "text-cyan-600",
    DELIVERED: "text-emerald-600",
    REJECTED: "text-red-600",
  }
  return colors[status] || "text-gray-600"
}

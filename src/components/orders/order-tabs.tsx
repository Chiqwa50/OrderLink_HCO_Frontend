"use client"

import type { Order } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrderTabsProps {
  orders: Order[]
  activeTab: string
  onTabChange: (tab: string) => void
  children: (filteredOrders: Order[]) => React.ReactNode
}

/**
 * مكون تبويبات الطلبيات - OOP Pattern
 * ينظم عرض الطلبيات في تبويبات حسب الحالة
 */
export function OrderTabs({
  orders,
  activeTab,
  onTabChange,
  children,
}: OrderTabsProps) {
  // حساب عدد الطلبيات لكل تبويب
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    active: orders.filter((o) =>
      ["APPROVED", "PREPARING", "READY"].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    rejected: orders.filter((o) => o.status === "REJECTED").length,
  }

  // فلترة الطلبيات حسب التبويب النشط
  const getFilteredOrders = (): Order[] => {
    switch (activeTab) {
      case "pending":
        return orders.filter((o) => o.status === "PENDING")
      case "active":
        return orders.filter((o) =>
          ["APPROVED", "PREPARING", "READY"].includes(o.status)
        )
      case "delivered":
        return orders.filter((o) => o.status === "DELIVERED")
      case "rejected":
        return orders.filter((o) => o.status === "REJECTED")
      default:
        return orders
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto">
        <TabsTrigger value="all" className="gap-2">
          <span>الكل</span>
          <Badge variant="secondary" className="rounded-full">
            {counts.all}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          <span>جديدة</span>
          {counts.pending > 0 && (
            <Badge variant="default" className="rounded-full bg-amber-500">
              {counts.pending}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active" className="gap-2">
          <span>قيد التنفيذ</span>
          {counts.active > 0 && (
            <Badge variant="default" className="rounded-full bg-blue-500">
              {counts.active}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="delivered" className="gap-2">
          <span>مكتملة</span>
          {counts.delivered > 0 && (
            <Badge variant="default" className="rounded-full bg-green-500">
              {counts.delivered}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="rejected" className="gap-2">
          <span>مرفوضة</span>
          {counts.rejected > 0 && (
            <Badge variant="default" className="rounded-full bg-red-500">
              {counts.rejected}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {children(getFilteredOrders())}
      </TabsContent>
    </Tabs>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { orderService } from "@/services/order-service"
import {
  ArrowUpDown,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  Loader2,
  Table as TableIcon,
  X,
} from "lucide-react"

import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderFiltersExpandable } from "@/components/orders/order-filters-expandable"
import { OrderDetailsSlidePanel } from "@/components/orders/order-details-slide-panel"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderCard } from "@/components/orders/order-card"

import { useResponsiveView } from "@/hooks/use-responsive-view"

export default function OrderHistoryPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)
  const [viewMode, setViewMode] = useResponsiveView()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtering state
  const [filters, setFilters] = useState<{
    status?: string
    departmentId?: string
    warehouseId?: string
    createdBy?: string
    dateFrom?: string
    dateTo?: string
  }>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersData = await orderService.getCompletedOrders()

      // Debug: log deliveredAt for first few DELIVERED orders
      const deliveredOrders = ordersData.filter(o => o.status === 'DELIVERED').slice(0, 3)
      console.log('[History Page] Sample DELIVERED orders:', deliveredOrders.map(o => ({
        orderNumber: o.orderNumber,
        status: o.status,
        deliveredAt: o.deliveredAt,
        deliveredAtType: typeof o.deliveredAt
      })))

      setOrders(ordersData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل تحميل البيانات",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string, direction?: "asc" | "desc") => {
    if (direction) {
      setSortColumn(column)
      setSortDirection(direction)
    } else {
      if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortColumn(column)
        setSortDirection("asc")
      }
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id)
    setShowDetailsPanel(true)
  }

  // const handleDownloadPDF = async (order: Order) => {
  //   toast({
  //     title: "قريباً",
  //     description: "ميزة تحميل PDF ستكون متاحة قريباً",
  //   })
  // }

  // const handleExportAll = () => {
  //   toast({
  //     title: "قريباً",
  //     description: "ميزة تصدير جميع الطلبات ستكون متاحة قريباً",
  //   })
  // }

  // Helper function to get filtered orders excluding a specific field
  const getFilteredOrdersForField = useCallback(
    (excludeField: keyof typeof filters) => {
      return orders.filter((order) => {
        // Department filter
        if (
          excludeField !== "departmentId" &&
          filters.departmentId &&
          filters.departmentId !== "ALL"
        ) {
          if (order.departmentName !== filters.departmentId) return false
        }

        // Warehouse filter
        if (
          excludeField !== "warehouseId" &&
          filters.warehouseId &&
          filters.warehouseId !== "ALL"
        ) {
          if (order.warehouseName !== filters.warehouseId) return false
        }

        // Status filter
        if (
          excludeField !== "status" &&
          filters.status &&
          filters.status !== "ALL"
        ) {
          if (order.status !== filters.status) return false
        }

        // User filter
        if (
          excludeField !== "createdBy" &&
          filters.createdBy &&
          filters.createdBy !== "ALL"
        ) {
          if (order.createdBy !== filters.createdBy) return false
        }

        // Date from filter (Order Date)
        if (excludeField !== "dateFrom" && filters.dateFrom) {
          const orderDate = new Date(order.createdAt)
          const fromDate = new Date(filters.dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (orderDate < fromDate) return false
        }

        // Date to filter (Order Date)
        if (excludeField !== "dateTo" && filters.dateTo) {
          const orderDate = new Date(order.createdAt)
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (orderDate > toDate) return false
        }

        return true
      })
    },
    [orders, filters]
  )

  // Unique values for filters (Dynamic)
  const uniqueDepartments = useMemo(() => {
    const filtered = getFilteredOrdersForField("departmentId")
    return Array.from(new Set(filtered.map((o) => o.departmentName)))
      .sort()
      .map((name) => ({ id: name, name }))
  }, [getFilteredOrdersForField])

  const uniqueWarehouses = useMemo(() => {
    const filtered = getFilteredOrdersForField("warehouseId")
    return Array.from(new Set(filtered.map((o) => o.warehouseName)))
      .sort()
      .map((name) => ({ id: name, name }))
  }, [getFilteredOrdersForField])

  const uniqueUsers = useMemo(() => {
    const filtered = getFilteredOrdersForField("createdBy")
    const usersMap = new Map<string, string>()
    filtered.forEach((order) => {
      if (order.createdBy && order.createdByName) {
        usersMap.set(order.createdBy, order.createdByName)
      }
    })
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }))
  }, [getFilteredOrdersForField])

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Department filter
        if (filters.departmentId && filters.departmentId !== "ALL") {
          if (order.departmentName !== filters.departmentId) return false
        }

        // Warehouse filter
        if (filters.warehouseId && filters.warehouseId !== "ALL") {
          if (order.warehouseName !== filters.warehouseId) return false
        }

        // Status filter
        if (filters.status && filters.status !== "ALL") {
          if (order.status !== filters.status) return false
        }

        // Date from filter (Order Date)
        if (filters.dateFrom) {
          const orderDate = new Date(order.createdAt)
          const fromDate = new Date(filters.dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (orderDate < fromDate) return false
        }

        // Date to filter (Order Date)
        if (filters.dateTo) {
          const orderDate = new Date(order.createdAt)
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (orderDate > toDate) return false
        }

        // User filter
        if (filters.createdBy && filters.createdBy !== "ALL") {
          if (order.createdBy !== filters.createdBy) return false
        }

        return true
      })
      .sort((a, b) => {
        if (!sortColumn) return 0

        let aValue: any = a[sortColumn as keyof Order]
        let bValue: any = b[sortColumn as keyof Order]

        // Handle null/undefined values
        if (aValue == null) aValue = ""
        if (bValue == null) bValue = ""

        // Convert to string for comparison
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
  }, [orders, filters, sortColumn, sortDirection])

  // Pagination logic
  const { totalPages, paginatedOrders } = useMemo(() => {
    const total = Math.ceil(filteredOrders.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredOrders.slice(startIndex, endIndex)

    return {
      totalPages: total,
      paginatedOrders: paginated,
    }
  }, [filteredOrders, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setIsChangingPageSize(true)
    setPageSize(size)
    setCurrentPage(1)
    setTimeout(() => setIsChangingPageSize(false), 300)
  }, [])



  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start justify-between w-full md:w-auto">
          <h2 className="text-3xl font-bold tracking-tight">سجل الطلبات</h2>

          {/* View Mode Toggle - Mobile */}
          <div className="flex md:hidden items-center border rounded-md bg-background">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-md rounded-r-none h-8 px-2"
            >
              <TableIcon className="h-4 w-4" />
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
              <TableIcon className="h-4 w-4 ml-1" />
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

          <Button onClick={() => toast({ title: "قريباً", description: "ميزة تصدير جميع الطلبات ستكون متاحة قريباً" })} className="w-full md:w-auto">
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات المكتملة والمرفوضة</CardTitle>
          <CardDescription>
            سجل كامل لجميع الطلبات التي تم تسليمها أو رفضها
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isChangingPageSize ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                جاري تحميل البيانات...
              </p>
            </div>
          ) : (
            <>
              {/* Filter Component */}
              <div className="mb-6">
                <OrderFiltersExpandable
                  filters={filters}
                  onFiltersChange={setFilters}
                  departments={uniqueDepartments}
                  warehouses={uniqueWarehouses}
                  users={uniqueUsers}
                  showDepartmentFilter={true}
                  showWarehouseFilter={true}
                  showUserFilter={true}
                  showStatusFilter={true}
                  excludeStatuses={["PENDING", "APPROVED", "PREPARING", "READY"]}
                />
              </div>

              {/* Active Filters Summary */}
              {(Object.keys(filters).filter(
                (key) =>
                  filters[key as keyof typeof filters] &&
                  filters[key as keyof typeof filters] !== "ALL"
              ).length > 0) && (
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      عرض {filteredOrders.length} من {orders.length} طلب
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setFilters({})}
                    >
                      <X className="h-3 w-3 ml-1" />
                      مسح جميع الفلاتر
                    </Button>
                  </div>
                )}

              {viewMode === "table" ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("orderNumber")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            رقم الطلب
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("departmentName")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            القسم
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("warehouseName")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            المستودع
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("items")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            عدد المواد
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("createdAt")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            تاريخ الطلب
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("deliveredAt")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            تاريخ التسليم
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("status")}
                            className="h-8 text-xs font-medium hover:bg-transparent hover:text-primary p-0"
                          >
                            الحالة
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="h-10 text-center">
                          الإجراءات
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center h-24 text-muted-foreground"
                          >
                            لا توجد طلبات
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="text-center font-mono text-sm sm:text-base py-4 whitespace-nowrap">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell className="text-center py-4 text-sm sm:text-base whitespace-nowrap">
                              <div className="flex flex-col items-center gap-1">
                                <span>{order.departmentName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {order.createdByName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4 text-sm sm:text-base whitespace-nowrap">
                              {order.warehouseName}
                            </TableCell>
                            <TableCell className="text-center py-4 text-sm sm:text-base whitespace-nowrap">
                              {order.items.length}
                            </TableCell>
                            <TableCell className="text-center text-sm sm:text-base py-4 whitespace-nowrap">
                              {formatDateTime(order.createdAt)}
                            </TableCell>
                            <TableCell className="text-center text-sm sm:text-base py-4 whitespace-nowrap">
                              {order.status === "DELIVERED"
                                ? formatDateTime(order.deliveredAt || order.updatedAt)
                                : order.status === "REJECTED"
                                  ? "-"
                                  : "قيد المعالجة"}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <OrderStatusBadge status={order.status} className="text-xs sm:text-sm px-2 py-1" />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toast({ title: "قريباً", description: "ميزة تحميل PDF ستكون متاحة قريباً" })}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-2">
                      <div className="h-12 w-12 text-muted-foreground/50 flex items-center justify-center rounded-full bg-muted">
                        <Filter className="h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground">لا توجد طلبات</p>
                    </div>
                  ) : (
                    paginatedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onView={handleViewOrder}
                        onDownloadPDF={async () => {
                          toast({ title: "قريباً", description: "ميزة تحميل PDF ستكون متاحة قريباً" })
                        }}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-4">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredOrders.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Slide Panel */}
      <OrderDetailsSlidePanel
        orderId={selectedOrderId}
        open={showDetailsPanel}
        onOpenChange={setShowDetailsPanel}
      />
    </div>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { orderService } from "@/services/order-service"
import { pdfService } from "@/services/pdf-service"
import { userRestrictionService } from "@/services/user-restriction-service"
import {
  CheckCircle,
  Download,
  Edit,
  Eye,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
  XCircle,
} from "lucide-react"

import type { EditOrderData } from "@/components/orders/edit-order-dialog"
import type { Order } from "@/types"

import { formatDateTime } from "@/lib/date-utils"

import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderPreparationWizard } from "@/components/orders/OrderPreparationWizard"
import { OrderEditWizard } from "@/components/orders/OrderEditWizard"
import { EditOrderDialog } from "@/components/orders/edit-order-dialog"
import { OrderCard } from "@/components/orders/order-card"
import { OrderDetailsSlidePanel } from "@/components/orders/order-details-slide-panel"
import { OrderFiltersExpandable } from "@/components/orders/order-filters-expandable"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"

/**
 * صفحة إدارة الطلبيات - OOP Pattern
 * توفر واجهة محسّنة لإدارة الطلبيات مع pagination وإجراءات متقدمة
 */
import { useResponsiveView } from "@/hooks/use-responsive-view"

export default function ManageOrdersPage() {
  const router = useRouter()
  const { user } = useAuth() // استخدام AuthContext
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEditWizard, setShowEditWizard] = useState(false)
  const [showPrepareWizard, setShowPrepareWizard] = useState(false)
  const [orderToPrepare, setOrderToPrepare] = useState<Order | null>(null)
  const [orderToEditWizard, setOrderToEditWizard] = useState<Order | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Delete dialog state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Status update state
  const [orderToApprove, setOrderToApprove] = useState<Order | null>(null)
  const [orderToReject, setOrderToReject] = useState<Order | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Processing state - tracks which order is currently being processed
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null
  )

  // View mode state (table or cards)
  const [viewMode, setViewMode] = useResponsiveView()

  // Order details slide panel state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<{
    status?: string
    departmentId?: string
    warehouseId?: string
    createdBy?: string
    dateFrom?: string
    dateTo?: string
  }>({})

  // Warehouse restrictions state
  const [warehouseRestrictions, setWarehouseRestrictions] = useState<{
    canViewPendingOrders: boolean
    canApproveOrders: boolean
    canRejectOrders: boolean
  }>({
    canViewPendingOrders: false,
    canApproveOrders: true,
    canRejectOrders: true,
  })

  useEffect(() => {
    loadOrders(true)
    // Load warehouse restrictions if user is warehouse supervisor
    if (user?.role === "WAREHOUSE" && user?.id) {
      loadWarehouseRestrictions()
    }
  }, [user?.role, user?.id])

  const loadWarehouseRestrictions = async () => {
    if (!user?.id) return

    try {
      const [canViewPending, canApprove, canReject] = await Promise.all([
        userRestrictionService.canViewPendingOrders(user.id),
        userRestrictionService.canApproveOrders(user.id),
        userRestrictionService.canRejectOrders(user.id),
      ])

      setWarehouseRestrictions({
        canViewPendingOrders: canViewPending,
        canApproveOrders: canApprove,
        canRejectOrders: canReject,
      })
    } catch (error) {
      console.error("Error loading warehouse restrictions:", error)
    }
  }

  const loadOrders = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const data = await orderService.getOrders(filters)

      // Debug: check if preparationProgress exists
      const preparingOrders = data.filter((o) => o.status === "PREPARING")
      console.log("Preparing orders count:", preparingOrders.length)
      if (preparingOrders.length > 0) {
        console.log("First preparing order:", {
          orderNumber: preparingOrders[0].orderNumber,
          preparationProgress: preparingOrders[0].preparationProgress,
        })
      }

      setOrders(data)
    } catch (err: any) {
      console.error("Error refreshing orders:", err)
      setError(err.message || "فشل في تحديث الطلبيات")
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrderId(order.id)
    setShowDetailsPanel(true)
  }, [])

  const handleDownloadPDF = useCallback(async (order: Order) => {
    setProcessingOrderId(order.id)
    try {
      await pdfService.downloadOrderPDF(order)
    } catch (err) {
      console.error("Error downloading PDF:", err)
    } finally {
      setProcessingOrderId(null)
    }
  }, [])

  const handleEditOrder = useCallback((order: Order) => {
    // Use Wizard for PENDING orders only
    if (order.status === "PENDING") {
      setOrderToEditWizard(order)
      setShowEditWizard(true)
    }
  }, [])

  const handleSaveOrder = useCallback(
    async (orderId: string, updates: EditOrderData) => {
      try {
        await orderService.updateOrder(orderId, updates)
        await loadOrders(false)
        setShowEditDialog(false)
        setSelectedOrder(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تعديل الطلب"
        )
        throw err
      }
    },
    []
  )

  const handleEditWizardSuccess = useCallback(() => {
    setShowEditWizard(false)
    setOrderToEditWizard(null)
    loadOrders(false)
  }, [])



  const handleDeleteClick = useCallback((order: Order) => {
    setOrderToDelete(order)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      await orderService.deleteOrder(orderToDelete.id)
      await loadOrders(false)
      setOrderToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حذف الطلب")
    } finally {
      setIsDeleting(false)
    }
  }, [orderToDelete])

  const handleApproveClick = useCallback((order: Order) => {
    setOrderToApprove(order)
  }, [])

  const confirmApprove = useCallback(async () => {
    if (!orderToApprove) return

    setIsUpdatingStatus(true)
    setProcessingOrderId(orderToApprove.id)
    setError(null)

    try {
      await orderService.updateOrderStatus(orderToApprove.id, {
        status: "APPROVED",
      })
      await loadOrders(false)
      setOrderToApprove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء قبول الطلب")
    } finally {
      setIsUpdatingStatus(false)
      setProcessingOrderId(null)
    }
  }, [orderToApprove])

  const handleRejectClick = useCallback((order: Order) => {
    setOrderToReject(order)
  }, [])

  const confirmReject = useCallback(async () => {
    if (!orderToReject) return

    setIsUpdatingStatus(true)
    setProcessingOrderId(orderToReject.id)
    setError(null)

    try {
      await orderService.updateOrderStatus(orderToReject.id, {
        status: "REJECTED",
      })
      await loadOrders(false)
      setOrderToReject(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء رفض الطلب")
    } finally {
      setIsUpdatingStatus(false)
      setProcessingOrderId(null)
    }
  }, [orderToReject])

  const handlePrepareClick = useCallback((order: Order) => {
    setOrderToPrepare(order)
    setShowPrepareWizard(true)
  }, [])

  const handleMarkPreparingClick = useCallback(async (order: Order) => {
    setProcessingOrderId(order.id)
    setError(null)

    try {
      await orderService.updateOrderStatus(order.id, {
        status: "PREPARING",
      })
      await loadOrders(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحويل الطلب إلى قيد التجهيز"
      )
    } finally {
      setProcessingOrderId(null)
    }
  }, [])

  const handleMarkReadyClick = useCallback(async (order: Order) => {
    setProcessingOrderId(order.id)
    setError(null)

    try {
      await orderService.markOrderReady(order.id)
      await loadOrders(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحويل الطلب إلى جاهز"
      )
    } finally {
      setProcessingOrderId(null)
    }
  }, [])

  const handlePrepareSuccess = useCallback(() => {
    setShowPrepareWizard(false)
    setOrderToPrepare(null)
    loadOrders(false) // إعادة تحميل الطلبيات بعد التجهيز الناجح
  }, [])

  const handleViewClick = useCallback(
    (order: Order) => {
      router.push(`/orders/${order.id}`)
    },
    [router]
  )

  // حساب الإحصائيات حسب دور المستخدم
  const stats = useMemo(() => {
    if (user?.role === "WAREHOUSE") {
      // إحصائيات مسؤول المستودع
      const baseStats = {
        needsPreparation: orders.filter((o) => o.status === "APPROVED").length,
        preparing: orders.filter((o) => o.status === "PREPARING").length,
        ready: orders.filter((o) => o.status === "READY").length,
        total: orders.length,
      }

      // إضافة الطلبات قيد المراجعة إذا كان لديه صلاحية رؤيتها
      if (warehouseRestrictions.canViewPendingOrders) {
        return {
          ...baseStats,
          pending: orders.filter((o) => o.status === "PENDING").length,
        }
      }

      return baseStats
    } else {
      // إحصائيات المدير (الافتراضية)
      return {
        pending: orders.filter((o) => o.status === "PENDING").length,
        active: orders.filter((o) =>
          ["APPROVED", "PREPARING", "READY"].includes(o.status)
        ).length,
        total: orders.length,
      }
    }
  }, [orders, user?.role, warehouseRestrictions])

  // Helper function to get filtered orders excluding a specific field
  const getFilteredOrdersForField = useCallback(
    (excludeField: keyof typeof filters) => {
      return orders.filter((order) => {
        // إزالة الطلبات المكتملة والمرفوضة من صفحة الإدارة
        if (["DELIVERED", "REJECTED"].includes(order.status)) {
          return false
        }

        // فلترة حسب دور المستخدم
        if (user?.role === "WAREHOUSE") {
          const allowedStatuses = ["APPROVED", "PREPARING", "READY"]
          if (warehouseRestrictions.canViewPendingOrders) {
            allowedStatuses.push("PENDING")
          }
          if (!allowedStatuses.includes(order.status)) {
            return false
          }
        }

        // Search filter
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.departmentName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Status filter
        if (
          excludeField !== "status" &&
          filters.status &&
          filters.status !== "ALL"
        ) {
          if (order.status !== filters.status) return false
        }

        // Department filter
        if (
          excludeField !== "departmentId" &&
          filters.departmentId &&
          filters.departmentId !== "ALL"
        ) {
          if (order.departmentId !== filters.departmentId) return false
        }

        // Warehouse filter
        if (
          excludeField !== "warehouseId" &&
          filters.warehouseId &&
          filters.warehouseId !== "ALL"
        ) {
          if (order.warehouseId !== filters.warehouseId) return false
        }

        // User filter
        if (
          excludeField !== "createdBy" &&
          filters.createdBy &&
          filters.createdBy !== "ALL"
        ) {
          if (order.createdBy !== filters.createdBy) return false
        }

        // Date from filter
        if (excludeField !== "dateFrom" && filters.dateFrom) {
          const orderDate = new Date(order.createdAt)
          const fromDate = new Date(filters.dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (orderDate < fromDate) return false
        }

        // Date to filter
        if (excludeField !== "dateTo" && filters.dateTo) {
          const orderDate = new Date(order.createdAt)
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (orderDate > toDate) return false
        }

        return true
      })
    },
    [orders, searchTerm, filters, user, warehouseRestrictions]
  )

  // استخراج القوائم الفريدة للفلاتر (Dynamic)
  const uniqueDepartments = useMemo(() => {
    const filtered = getFilteredOrdersForField("departmentId")
    return Array.from(
      new Map(
        filtered.map((o) => [
          o.departmentId,
          { id: o.departmentId, name: o.departmentName },
        ])
      ).values()
    )
  }, [getFilteredOrdersForField])

  const uniqueWarehouses = useMemo(() => {
    const filtered = getFilteredOrdersForField("warehouseId")
    return Array.from(
      new Map(
        filtered.map((o) => [
          o.warehouseId,
          { id: o.warehouseId, name: o.warehouseName },
        ])
      ).values()
    )
  }, [getFilteredOrdersForField])

  const uniqueUsers = useMemo(() => {
    const filtered = getFilteredOrdersForField("createdBy")
    return Array.from(
      new Map(
        filtered.map((o) => [
          o.createdBy,
          { id: o.createdBy, name: o.createdByName },
        ])
      ).values()
    )
  }, [getFilteredOrdersForField])

  // Memoized filtered items
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // إزالة الطلبات المكتملة والمرفوضة من صفحة الإدارة
      // هذه الطلبات تظهر فقط في صفحة سجل الطلبات
      if (["DELIVERED", "REJECTED"].includes(order.status)) {
        return false
      }

      // فلترة حسب دور المستخدم
      if (user?.role === "WAREHOUSE") {
        // مسؤول المستودع يرى الطلبات المعتمدة وما بعدها
        const allowedStatuses = ["APPROVED", "PREPARING", "READY"]

        // إذا كان لديه صلاحية رؤية الطلبات قيد المراجعة، أضفها للقائمة
        if (warehouseRestrictions.canViewPendingOrders) {
          allowedStatuses.push("PENDING")
        }

        if (!allowedStatuses.includes(order.status)) {
          return false
        }
      }

      // Search filter
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      // Status filter
      if (filters.status && filters.status !== "ALL") {
        if (order.status !== filters.status) return false
      }

      // Department filter
      if (filters.departmentId && filters.departmentId !== "ALL") {
        if (order.departmentId !== filters.departmentId) return false
      }

      // Warehouse filter
      if (filters.warehouseId && filters.warehouseId !== "ALL") {
        if (order.warehouseId !== filters.warehouseId) return false
      }

      // User filter
      if (filters.createdBy && filters.createdBy !== "ALL") {
        if (order.createdBy !== filters.createdBy) return false
      }

      // Date from filter
      if (filters.dateFrom) {
        const orderDate = new Date(order.createdAt)
        const fromDate = new Date(filters.dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        if (orderDate < fromDate) return false
      }

      // Date to filter
      if (filters.dateTo) {
        const orderDate = new Date(order.createdAt)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (orderDate > toDate) return false
      }

      return true
    })
  }, [orders, searchTerm, filters, user])

  // Pagination logic - memoized
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

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setIsChangingPageSize(true)
    setPageSize(size)
    setCurrentPage(1)
    setTimeout(() => setIsChangingPageSize(false), 300)
  }, [])

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
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">إدارة الطلبيات</h2>
            <p className="text-muted-foreground">
              مراجعة وتجهيز الطلبيات الواردة من الأقسام
            </p>
          </div>

          {/* View Mode Toggle - Mobile (Visible only on mobile) */}
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
          {/* View Mode Toggle - Desktop (Hidden on mobile) */}
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

          {/* Refresh Button - Full width on mobile */}
          <Button
            onClick={() => loadOrders(false)}
            disabled={isRefreshing}
            className="w-full md:w-auto"
          >
            <RefreshCw
              className={`ml-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>تحديث البيانات</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* إحصائيات سريعة - مخفية في الجوال */}
      <div className="hidden md:block relative">
        {/* Carousel wrapper for mobile - one card at a time */}
        <div className="md:grid md:gap-4 md:grid-cols-3 overflow-x-auto md:overflow-x-visible scrollbar-hide snap-x snap-mandatory">
          <div className="flex md:contents gap-4 pb-2 md:pb-0 px-1 md:px-0">
            {user?.role === "WAREHOUSE" ? (
              <>
                {/* إحصائيات مسؤول المستودع */}
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      تحتاج تجهيز
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats as any).needsPreparation || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      طلبيات معتمدة
                    </p>
                  </CardContent>
                </Card>
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      قيد التجهيز
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats as any).preparing || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">يتم تجهيزها</p>
                  </CardContent>
                </Card>
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">جاهزة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any).ready || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      جاهزة للتوصيل
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* إحصائيات المدير */}
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      طلبيات جديدة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats as any).pending || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      تحتاج للمراجعة
                    </p>
                  </CardContent>
                </Card>
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      قيد التجهيز
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats as any).active || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">طلبيات نشطة</p>
                  </CardContent>
                </Card>
                <Card className="min-w-[calc(100%-0.5rem)] md:min-w-0 snap-center flex-shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      إجمالي الطلبيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      جميع الطلبيات
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Carousel indicators for mobile */}
        <div className="flex md:hidden justify-center gap-1.5 mt-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
        </div>
      </div>

      {/* جدول الطلبيات */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبيات</CardTitle>
          <CardDescription>عرض وإدارة جميع الطلبيات في النظام</CardDescription>

          <div className="relative">
            {/* Search and Filters - Unified Row */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الطلبيات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full"
                />
              </div>
              <div className="flex-shrink-0">
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
                  excludeStatuses={["DELIVERED", "REJECTED"]}
                  align="end"
                />
              </div>
            </div>
          </div>
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
              {/* Filter Status */}
              {(Object.keys(filters).filter(
                (key) =>
                  filters[key as keyof typeof filters] &&
                  filters[key as keyof typeof filters] !== "ALL"
              ).length > 0 ||
                searchTerm) && (
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      عرض {filteredOrders.length} من {orders.length} طلبية
                    </span>
                    {Object.keys(filters).filter(
                      (key) =>
                        filters[key as keyof typeof filters] &&
                        filters[key as keyof typeof filters] !== "ALL"
                    ).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setFilters({})}
                        >
                          <XCircle className="h-3 w-3 ml-1" />
                          مسح جميع الفلاتر
                        </Button>
                      )}
                  </div>
                )}
              {/* Table View */}
              {viewMode === "table" ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          رقم الطلبية
                        </TableHead>
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          القسم
                        </TableHead>
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          المستودع
                        </TableHead>
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          عدد المواد
                        </TableHead>
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          التاريخ
                        </TableHead>
                        <TableHead className="h-10 text-center whitespace-nowrap">
                          الحالة
                        </TableHead>
                        <TableHead className="h-10 w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <p className="text-muted-foreground">
                              لا توجد طلبيات
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm sm:text-base py-4 text-center whitespace-nowrap">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                                  {order.departmentName}
                                </span>
                                {order.createdByName && (
                                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                    {order.createdByName}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                                  {order.warehouseName}
                                </span>
                                {order.warehouseCode && (
                                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                    ({order.warehouseCode})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center text-sm sm:text-base">
                              <div className="flex flex-col items-center gap-1">
                                <span>{order.items.length}</span>
                                {/* Partial Preparation Badge */}
                                {order.status === "PREPARING" &&
                                  order.preparationProgress
                                    ?.hasPartialPreparation && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">
                                      <Package className="h-2.5 w-2.5" />
                                      محفوظ {order.preparationProgress.logged}/
                                      {order.preparationProgress.total}
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <span className="text-sm sm:text-base whitespace-nowrap">
                                {formatDateTime(order.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <OrderStatusBadge status={order.status} className="text-xs sm:text-sm px-2 py-1" />
                            </TableCell>
                            <TableCell className="py-2.5">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10"
                                    disabled={processingOrderId === order.id}
                                  >
                                    {processingOrderId === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">فتح القائمة</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[180px]"
                                >
                                  <DropdownMenuLabel>
                                    الإجراءات
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* الإجراءات الأساسية - تظهر دائماً */}
                                  <DropdownMenuItem
                                    onClick={() => handleViewOrder(order)}
                                    disabled={processingOrderId === order.id}
                                  >
                                    <Eye className="ml-2 h-4 w-4" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadPDF(order)}
                                    disabled={processingOrderId === order.id}
                                  >
                                    {processingOrderId === order.id ? (
                                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="ml-2 h-4 w-4" />
                                    )}
                                    {processingOrderId === order.id
                                      ? "جاري التحميل..."
                                      : "تحميل PDF"}
                                  </DropdownMenuItem>

                                  {/* إجراءات المدير ومسؤول المستودع للطلبات قيد المراجعة */}
                                  {((user?.role === "ADMIN") ||
                                    (user?.role === "WAREHOUSE" && (warehouseRestrictions.canApproveOrders || warehouseRestrictions.canRejectOrders))) &&
                                    order.status === "PENDING" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        {/* زر قبول الطلب */}
                                        {(user?.role === "ADMIN" || warehouseRestrictions.canApproveOrders) && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleApproveClick(order)
                                            }
                                            className="text-green-600 focus:text-green-600"
                                            disabled={
                                              processingOrderId === order.id
                                            }
                                          >
                                            {processingOrderId === order.id ? (
                                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            ) : (
                                              <CheckCircle className="ml-2 h-4 w-4" />
                                            )}
                                            {processingOrderId === order.id
                                              ? "جاري المعالجة..."
                                              : "قبول الطلب"}
                                          </DropdownMenuItem>
                                        )}
                                        {/* زر رفض الطلب */}
                                        {(user?.role === "ADMIN" || warehouseRestrictions.canRejectOrders) && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleRejectClick(order)
                                            }
                                            className="text-orange-600 focus:text-orange-600"
                                            disabled={
                                              processingOrderId === order.id
                                            }
                                          >
                                            {processingOrderId === order.id ? (
                                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            ) : (
                                              <XCircle className="ml-2 h-4 w-4" />
                                            )}
                                            {processingOrderId === order.id
                                              ? "جاري المعالجة..."
                                              : "رفض الطلب"}
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}

                                  {/* إجراءات مسؤول المستودع - للطلبات المعتمدة */}
                                  {user?.role === "WAREHOUSE" &&
                                    order.status === "APPROVED" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleMarkPreparingClick(order)
                                          }
                                          className="text-amber-600 focus:text-amber-600"
                                          disabled={
                                            processingOrderId === order.id
                                          }
                                        >
                                          {processingOrderId === order.id ? (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <Package className="ml-2 h-4 w-4" />
                                          )}
                                          {processingOrderId === order.id
                                            ? "جاري المعالجة..."
                                            : "قيد التجهيز"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleMarkReadyClick(order)
                                          }
                                          className="text-green-600 focus:text-green-600"
                                          disabled={
                                            processingOrderId === order.id
                                          }
                                        >
                                          {processingOrderId === order.id ? (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <CheckCircle className="ml-2 h-4 w-4" />
                                          )}
                                          {processingOrderId === order.id
                                            ? "جاري المعالجة..."
                                            : "جاهز مباشرة"}
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                  {/* إجراءات مسؤول المستودع - للطلبات قيد التجهيز */}
                                  {user?.role === "WAREHOUSE" &&
                                    order.status === "PREPARING" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handlePrepareClick(order)
                                          }
                                          className="text-blue-600 focus:text-blue-600"
                                          disabled={
                                            processingOrderId === order.id
                                          }
                                        >
                                          <Package className="ml-2 h-4 w-4" />
                                          تجهيز الطلب
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleMarkReadyClick(order)
                                          }
                                          className="text-green-600 focus:text-green-600"
                                          disabled={
                                            processingOrderId === order.id
                                          }
                                        >
                                          {processingOrderId === order.id ? (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <CheckCircle className="ml-2 h-4 w-4" />
                                          )}
                                          {processingOrderId === order.id
                                            ? "جاري المعالجة..."
                                            : "جاهز مباشرة"}
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                  {/* تعديل - للمدير فقط */}
                                  {user?.role === "ADMIN" &&
                                    order.status === "PENDING" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleEditOrder(order)}
                                          disabled={
                                            processingOrderId === order.id
                                          }
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
                                        onClick={() => handleDeleteClick(order)}
                                        className="text-destructive focus:text-destructive"
                                        disabled={
                                          processingOrderId === order.id
                                        }
                                      >
                                        <Trash2 className="ml-2 h-4 w-4" />
                                        حذف
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-2">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">لا توجد طلبيات</p>
                    </div>
                  ) : (
                    paginatedOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        userRole={user?.role}
                        isProcessing={processingOrderId === order.id}
                        onView={handleViewOrder}
                        onDownloadPDF={handleDownloadPDF}
                        onApprove={handleApproveClick}
                        onReject={handleRejectClick}
                        onMarkPreparing={handleMarkPreparingClick}
                        onPrepare={handlePrepareClick}
                        onMarkReady={handleMarkReadyClick}
                        onEdit={handleEditOrder}
                        onDelete={handleDeleteClick}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Pagination Section */}
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    عرض {(currentPage - 1) * pageSize + 1} إلى{" "}
                    {Math.min(currentPage * pageSize, filteredOrders.length)} من{" "}
                    {filteredOrders.length} طلبية
                  </div>
                  <div className="order-1 sm:order-2 w-full sm:w-auto">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={filteredOrders.length}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* حوار تعديل الطلب */}
      <EditOrderDialog
        order={selectedOrder}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setSelectedOrder(null)
        }}
        onSave={handleSaveOrder}
      />

      {/* Order Edit Wizard */}
      <OrderEditWizard
        order={orderToEditWizard}
        open={showEditWizard}
        onOpenChange={(open) => {
          setShowEditWizard(open)
          if (!open) setOrderToEditWizard(null)
        }}
        onSuccess={handleEditWizardSuccess}
      />

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
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={!!orderToApprove}
        onOpenChange={(open) => !open && setOrderToApprove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد قبول الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من قبول الطلبية رقم {orderToApprove?.orderNumber}؟
              سيتم تحديث حالة الطلب إلى "مقبول".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={isUpdatingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري القبول...
                </>
              ) : (
                "قبول الطلب"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!orderToReject}
        onOpenChange={(open) => !open && setOrderToReject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد رفض الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفض الطلبية رقم {orderToReject?.orderNumber}؟ سيتم
              تحديث حالة الطلب إلى "مرفوض".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={isUpdatingStatus}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفض...
                </>
              ) : (
                "رفض الطلب"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Preparation Wizard */}
      {
        showPrepareWizard && orderToPrepare && (
          <OrderPreparationWizard
            order={orderToPrepare}
            open={showPrepareWizard}
            onOpenChange={(open) => {
              setShowPrepareWizard(open)
              if (!open) {
                setOrderToPrepare(null)
              }
            }}
            onSuccess={handlePrepareSuccess}
          />
        )
      }

      {/* Order Details Slide Panel */}
      <OrderDetailsSlidePanel
        orderId={selectedOrderId}
        open={showDetailsPanel}
        onOpenChange={setShowDetailsPanel}
      />
    </div >
  )
}

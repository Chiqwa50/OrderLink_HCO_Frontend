"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { orderService } from "@/services/order-service"
import { pdfService } from "@/services/pdf-service"
import { userRestrictionService } from "@/services/user-restriction-service"
import { LayoutGrid, Loader2, Plus, Table as TableIcon, User, Users } from "lucide-react"

import type { Order } from "@/types"

import { useAuth } from "@/contexts/auth-context"

import { useToast } from "@/hooks/use-toast"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderCard } from "@/components/orders/order-card"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrderDetailsSlidePanel } from "@/components/orders/order-details-slide-panel"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

export default function MyOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [canViewAll, setCanViewAll] = useState(false)
  const [canReceive, setCanReceive] = useState(false)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(9) // عدد البطاقات المعروضة
  const CARDS_PER_PAGE = 9 // عدد البطاقات لكل صفحة
  const [activeTab, setActiveTab] = useState("all") // التبويب النشط

  // Pagination state for table view
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  useEffect(() => {
    checkRestrictions()
    loadOrders()
  }, [])

  const checkRestrictions = async () => {
    if (!user?.id) return

    try {
      const [canView, canReceiveOrders] = await Promise.all([
        userRestrictionService.canViewAllOrders(user.id),
        userRestrictionService.canReceiveReadyOrders(user.id),
      ])
      setCanViewAll(canView)
      setCanReceive(canReceiveOrders)
    } catch (err) {
      console.error("Error checking restrictions:", err)
    }
  }

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Backend يجلب الطلبيات حسب الصلاحية (إما طلبياته فقط أو جميع طلبات الأقسام)
      const data = await orderService.getMyOrders()
      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الطلبيات"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // إعادة تعيين عدد البطاقات المعروضة عند تغيير الفلتر أو التبويب
  useEffect(() => {
    setDisplayedCount(CARDS_PER_PAGE)
    setCurrentPage(1) // Reset table pagination too
  }, [showAllOrders, activeTab])

  // تصفية الطلبيات حسب الزر المختار
  const getFilteredOrders = () => {
    if (!canViewAll || !showAllOrders) {
      // إذا لم يكن لديه الصلاحية أو اختار "طلبياتي فقط"، نعرض طلبياته فقط
      return orders.filter(order => order.createdBy === user?.id)
    }
    // إذا اختار "جميع الطلبيات"، نعرض جميع الطلبيات
    return orders
  }

  // Pagination logic for table view - memoized
  const { totalPages, paginatedOrders } = useMemo(() => {
    const filteredOrders = getFilteredOrders()
    const total = Math.ceil(filteredOrders.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredOrders.slice(startIndex, endIndex)

    return {
      totalPages: total,
      paginatedOrders: paginated,
    }
  }, [orders, currentPage, pageSize, showAllOrders, canViewAll, user?.id])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setIsChangingPageSize(true)
    setPageSize(size)
    setCurrentPage(1)
    setTimeout(() => setIsChangingPageSize(false), 300)
  }, [])

  // تحميل المزيد من البطاقات
  const loadMoreCards = () => {
    setDisplayedCount(prev => prev + CARDS_PER_PAGE)
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrderId(order.id)
    setShowDetailsPanel(true)
  }

  const handleDownloadPDF = async (order: Order) => {
    try {
      setDownloadingOrderId(order.id)
      await pdfService.downloadOrderPDF(order)
    } catch (err) {
      console.error("Error downloading PDF:", err)
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحميل ملف PDF",
      })
    } finally {
      setDownloadingOrderId(null)
    }
  }

  const handleNewOrder = () => {
    router.push("/orders/new")
  }

  const handleDeleteOrder = async (order: Order) => {
    try {
      await orderService.deleteOrder(order.id)
      setOrders(orders.filter((o) => o.id !== order.id))
      toast({
        title: "تم الحذف",
        description: "تم حذف الطلبية بنجاح",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل حذف الطلبية",
      })
    }
  }

  const handleReceive = async (order: Order) => {
    setProcessingOrderId(order.id)
    try {
      await orderService.updateOrderStatus(order.id, { status: "DELIVERED" })
      await loadOrders()
      toast({
        title: "تم الاستلام",
        description: "تم استلام الطلبية بنجاح",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل استلام الطلبية",
      })
    } finally {
      setProcessingOrderId(null)
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            طلبياتي
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            عرض وإدارة جميع الطلبيات المقدمة من قسمك
          </p>
        </div>
        <Button
          onClick={handleNewOrder}
          className="w-full sm:w-auto flex-shrink-0"
        >
          <Plus className="ml-2 h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-4">
          {/* Tabs List - Scrollable within container */}
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto p-1 w-max min-w-full sm:w-auto sm:min-w-0 justify-start sm:justify-center">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                الكل ({getFilteredOrders().length})
              </TabsTrigger>
              <TabsTrigger
                value="PENDING"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                قيد المراجعة (
                {getFilteredOrders().filter((o) => o.status === "PENDING").length})
              </TabsTrigger>
              <TabsTrigger
                value="APPROVED"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                تم الموافقة (
                {getFilteredOrders().filter((o) => o.status === "APPROVED").length})
              </TabsTrigger>
              <TabsTrigger
                value="PREPARING"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                قيد التجهيز (
                {getFilteredOrders().filter((o) => o.status === "PREPARING").length})
              </TabsTrigger>
              <TabsTrigger
                value="READY"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                جاهز ({getFilteredOrders().filter((o) => o.status === "READY").length})
              </TabsTrigger>
              <TabsTrigger
                value="DELIVERED"
                className="text-xs sm:text-sm whitespace-nowrap px-3 py-2"
              >
                تم التسليم (
                {getFilteredOrders().filter((o) => o.status === "DELIVERED").length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 justify-end">
            {canViewAll && (
              <>
                <Button
                  variant={!showAllOrders ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllOrders(false)}
                >
                  <User className="ml-2 h-4 w-4" />
                  طلبياتي فقط
                </Button>
                <Button
                  variant={showAllOrders ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllOrders(true)}
                >
                  <Users className="ml-2 h-4 w-4" />
                  جميع الطلبيات
                </Button>
              </>
            )}
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          {viewMode === "grid" ? (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {getFilteredOrders().length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">لا توجد طلبيات</p>
                    <Button className="mt-4" onClick={handleNewOrder}>
                      <Plus className="ml-2 h-4 w-4" />
                      إنشاء طلب جديد
                    </Button>
                  </div>
                ) : (
                  getFilteredOrders().slice(0, displayedCount).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={handleViewDetails}
                      onDownloadPDF={handleDownloadPDF}
                      onDelete={() => setOrderToDelete(order)}
                      onReceive={canReceive && order.status === "READY" ? handleReceive : undefined}
                      isProcessing={processingOrderId === order.id || downloadingOrderId === order.id}
                    />
                  ))
                )}
              </div>
              {getFilteredOrders().length > displayedCount && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={loadMoreCards}
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    تحميل المزيد ({getFilteredOrders().length - displayedCount} متبقية)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {isChangingPageSize ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    جاري تحميل البيانات...
                  </p>
                </div>
              ) : (
                <>
                  <OrdersTable
                    orders={paginatedOrders}
                    onViewOrder={handleViewDetails}
                    onDownloadPDF={handleDownloadPDF}
                    onDeleteOrder={handleDeleteOrder}
                    showDepartment={false}
                  />
                  {/* Pagination Section */}
                  {getFilteredOrders().length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                          عرض {(currentPage - 1) * pageSize + 1} إلى{" "}
                          {Math.min(currentPage * pageSize, getFilteredOrders().length)} من{" "}
                          {getFilteredOrders().length} طلبية
                        </div>
                        <div className="order-1 sm:order-2 w-full sm:w-auto">
                          <DataTablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={getFilteredOrders().length}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        {["PENDING", "APPROVED", "PREPARING", "READY", "DELIVERED"].map(
          (status) => {
            const filteredByStatus = getFilteredOrders().filter((o) => o.status === status)

            // Pagination for this specific status tab
            const statusTotalPages = Math.ceil(filteredByStatus.length / pageSize)
            const statusStartIndex = (currentPage - 1) * pageSize
            const statusEndIndex = statusStartIndex + pageSize
            const statusPaginatedOrders = filteredByStatus.slice(statusStartIndex, statusEndIndex)

            return (
              <TabsContent key={status} value={status} className="mt-4">
                {viewMode === "grid" ? (
                  <>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredByStatus.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <p className="text-muted-foreground">
                            لا توجد طلبيات بهذه الحالة
                          </p>
                        </div>
                      ) : (
                        filteredByStatus.slice(0, displayedCount).map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            isProcessing={processingOrderId === order.id || downloadingOrderId === order.id}
                            onView={handleViewDetails}
                            onDownloadPDF={handleDownloadPDF}
                            onDelete={() => setOrderToDelete(order)}
                            onReceive={canReceive && order.status === "READY" ? handleReceive : undefined}
                          />
                        ))
                      )}
                    </div>
                    {filteredByStatus.length > displayedCount && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={loadMoreCards}
                          variant="outline"
                          className="min-w-[200px]"
                        >
                          تحميل المزيد ({filteredByStatus.length - displayedCount} متبقية)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {isChangingPageSize ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          جاري تحميل البيانات...
                        </p>
                      </div>
                    ) : (
                      <>
                        <OrdersTable
                          orders={statusPaginatedOrders}
                          onViewOrder={handleViewDetails}
                          onDownloadPDF={handleDownloadPDF}
                          onDeleteOrder={handleDeleteOrder}
                          showDepartment={false}
                        />
                        {/* Pagination Section */}
                        {filteredByStatus.length > 0 && (
                          <div className="mt-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                عرض {statusStartIndex + 1} إلى{" "}
                                {Math.min(statusEndIndex, filteredByStatus.length)} من{" "}
                                {filteredByStatus.length} طلبية
                              </div>
                              <div className="order-1 sm:order-2 w-full sm:w-auto">
                                <DataTablePagination
                                  currentPage={currentPage}
                                  totalPages={statusTotalPages}
                                  pageSize={pageSize}
                                  totalItems={filteredByStatus.length}
                                  onPageChange={handlePageChange}
                                  onPageSizeChange={handlePageSizeChange}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            )
          }
        )}
      </Tabs>

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
              onClick={() => {
                if (orderToDelete) {
                  handleDeleteOrder(orderToDelete)
                  setOrderToDelete(null)
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderDetailsSlidePanel
        orderId={selectedOrderId}
        open={showDetailsPanel}
        onOpenChange={setShowDetailsPanel}
      />
    </div>
  )
}

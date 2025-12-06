"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { orderService } from "@/services/order-service"
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Loader2,
  SortAsc,
  SortDesc,
  XCircle,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { OrderDetailsSlidePanel } from "@/components/orders/order-details-slide-panel"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"

export default function OrderHistoryPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtering state
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set()
  )
  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<string>>(
    new Set()
  )
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  )
  const [orderDateFrom, setOrderDateFrom] = useState("")
  const [orderDateTo, setOrderDateTo] = useState("")
  const [deliveryDateFrom, setDeliveryDateFrom] = useState("")
  const [deliveryDateTo, setDeliveryDateTo] = useState("")

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

  const handleDownloadPDF = async (order: Order) => {
    toast({
      title: "قريباً",
      description: "ميزة تحميل PDF ستكون متاحة قريباً",
    })
  }

  const handleExportAll = () => {
    toast({
      title: "قريباً",
      description: "ميزة تصدير جميع الطلبات ستكون متاحة قريباً",
    })
  }

  // Unique values for filters
  const uniqueDepartments = useMemo(
    () => Array.from(new Set(orders.map((o) => o.departmentName))).sort(),
    [orders]
  )
  const uniqueWarehouses = useMemo(
    () => Array.from(new Set(orders.map((o) => o.warehouseName))).sort(),
    [orders]
  )
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(orders.map((o) => o.status))),
    [orders]
  )

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Department filter
        if (
          selectedDepartments.size > 0 &&
          !selectedDepartments.has(order.departmentName)
        ) {
          return false
        }

        // Warehouse filter
        if (
          selectedWarehouses.size > 0 &&
          !selectedWarehouses.has(order.warehouseName)
        ) {
          return false
        }

        // Status filter
        if (selectedStatuses.size > 0 && !selectedStatuses.has(order.status)) {
          return false
        }

        // Order date filter
        if (orderDateFrom) {
          const orderDate = new Date(order.createdAt)
          const fromDate = new Date(orderDateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (orderDate < fromDate) return false
        }
        if (orderDateTo) {
          const orderDate = new Date(order.createdAt)
          const toDate = new Date(orderDateTo)
          toDate.setHours(23, 59, 59, 999)
          if (orderDate > toDate) return false
        }

        // Delivery date filter
        if (deliveryDateFrom && order.deliveredAt) {
          const deliveryDate = new Date(order.deliveredAt)
          const fromDate = new Date(deliveryDateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (deliveryDate < fromDate) return false
        }
        if (deliveryDateTo && order.deliveredAt) {
          const deliveryDate = new Date(order.deliveredAt)
          const toDate = new Date(deliveryDateTo)
          toDate.setHours(23, 59, 59, 999)
          if (deliveryDate > toDate) return false
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
  }, [
    orders,
    selectedDepartments,
    selectedWarehouses,
    selectedStatuses,
    orderDateFrom,
    orderDateTo,
    deliveryDateFrom,
    deliveryDateTo,
    sortColumn,
    sortDirection,
  ])

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
  }, [
    selectedDepartments,
    selectedWarehouses,
    selectedStatuses,
    orderDateFrom,
    orderDateTo,
    deliveryDateFrom,
    deliveryDateTo,
  ])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setIsChangingPageSize(true)
    setPageSize(size)
    setCurrentPage(1)
    setTimeout(() => setIsChangingPageSize(false), 300)
  }, [])

  const toggleFilter = useCallback(
    (
      value: string,
      currentSet: Set<string>,
      setFunction: React.Dispatch<React.SetStateAction<Set<string>>>
    ) => {
      const newSet = new Set(currentSet)
      if (newSet.has(value)) {
        newSet.delete(value)
      } else {
        newSet.add(value)
      }
      setFunction(newSet)
    },
    []
  )

  const renderFilterCommand = useCallback(
    (
      options: string[],
      selectedValues: Set<string>,
      setFunction: React.Dispatch<React.SetStateAction<Set<string>>>,
      placeholder: string = "بحث...",
      labels?: Record<string, string>
    ) => {
      return (
        <Command className="p-0 w-[200px]">
          <CommandInput
            placeholder={placeholder}
            autoFocus={true}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>لا توجد نتائج.</CommandEmpty>
            <CommandGroup className="max-h-[180px] overflow-auto">
              {options.map((option) => {
                const isSelected = selectedValues.has(option)
                const label = labels ? labels[option] : option
                return (
                  <CommandItem
                    key={option}
                    onSelect={() =>
                      toggleFilter(option, selectedValues, setFunction)
                    }
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "ml-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckCircle2 className={cn("h-3 w-3")} />
                    </div>
                    <span>{label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setFunction(new Set())}
                    className="justify-center text-center cursor-pointer"
                  >
                    مسح الفلتر
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      )
    },
    [toggleFilter]
  )

  const renderDateRangeFilter = (
    fromValue: string,
    toValue: string,
    onFromChange: (value: string) => void,
    onToChange: (value: string) => void,
    label: string
  ) => {
    return (
      <div className="p-3 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">من</Label>
          <Input
            type="date"
            value={fromValue}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">إلى</Label>
          <Input
            type="date"
            value={toValue}
            onChange={(e) => onToChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        {(fromValue || toValue) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => {
              onFromChange("")
              onToChange("")
            }}
          >
            <XCircle className="h-3 w-3 ml-1" />
            مسح
          </Button>
        )}
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    DELIVERED: "تم التسليم",
    REJECTED: "مرفوض",
  }

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">سجل الطلبات</h2>
        <Button onClick={handleExportAll}>
          <Download className="ml-2 h-4 w-4" />
          تصدير PDF
        </Button>
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
              {/* Filter Status */}
              {(selectedDepartments.size > 0 ||
                selectedWarehouses.size > 0 ||
                selectedStatuses.size > 0 ||
                orderDateFrom ||
                orderDateTo ||
                deliveryDateFrom ||
                deliveryDateTo) && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>
                      عرض {filteredOrders.length} من {orders.length} طلب
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        setSelectedDepartments(new Set())
                        setSelectedWarehouses(new Set())
                        setSelectedStatuses(new Set())
                        setOrderDateFrom("")
                        setOrderDateTo("")
                        setDeliveryDateFrom("")
                        setDeliveryDateTo("")
                      }}
                    >
                      <XCircle className="h-3 w-3 ml-1" />
                      مسح جميع الفلاتر
                    </Button>
                  </div>
                )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>رقم الطلب</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[150px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSort("orderNumber", "asc")}
                              >
                                <SortAsc className="ml-2 h-4 w-4" />
                                تصاعدي
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("orderNumber", "desc")
                                }
                              >
                                <SortDesc className="ml-2 h-4 w-4" />
                                تنازلي
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>القسم</span>
                          {selectedDepartments.size > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs"
                            >
                              {selectedDepartments.size}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    selectedDepartments.size > 0 &&
                                    "text-primary"
                                  )}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[220px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("departmentName", "asc")
                                }
                              >
                                <SortAsc className="ml-2 h-4 w-4" />أ - ي
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("departmentName", "desc")
                                }
                              >
                                <SortDesc className="ml-2 h-4 w-4" />ي - أ
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {renderFilterCommand(
                                uniqueDepartments,
                                selectedDepartments,
                                setSelectedDepartments,
                                "بحث في الأقسام..."
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>المستودع</span>
                          {selectedWarehouses.size > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs"
                            >
                              {selectedWarehouses.size}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    selectedWarehouses.size > 0 &&
                                    "text-primary"
                                  )}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[220px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("warehouseName", "asc")
                                }
                              >
                                <SortAsc className="ml-2 h-4 w-4" />أ - ي
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("warehouseName", "desc")
                                }
                              >
                                <SortDesc className="ml-2 h-4 w-4" />ي - أ
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {renderFilterCommand(
                                uniqueWarehouses,
                                selectedWarehouses,
                                setSelectedWarehouses,
                                "بحث في المستودعات..."
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>عدد المواد</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[150px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSort("items", "asc")}
                              >
                                <SortAsc className="ml-2 h-4 w-4" />
                                تصاعدي
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSort("items", "desc")}
                              >
                                <SortDesc className="ml-2 h-4 w-4" />
                                تنازلي
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>تاريخ الطلب</span>
                          {(orderDateFrom || orderDateTo) && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs"
                            >
                              ✓
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    (orderDateFrom || orderDateTo) &&
                                    "text-primary"
                                  )}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[200px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSort("createdAt", "asc")}
                              >
                                <SortAsc className="ml-2 h-4 w-4" />
                                الأقدم أولاً
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSort("createdAt", "desc")}
                              >
                                <SortDesc className="ml-2 h-4 w-4" />
                                الأحدث أولاً
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>
                                تصفية حسب التاريخ
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {renderDateRangeFilter(
                                orderDateFrom,
                                orderDateTo,
                                setOrderDateFrom,
                                setOrderDateTo,
                                "تاريخ الطلب"
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>تاريخ التسليم</span>
                          {(deliveryDateFrom || deliveryDateTo) && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs"
                            >
                              ✓
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    (deliveryDateFrom || deliveryDateTo) &&
                                    "text-primary"
                                  )}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[200px]"
                            >
                              <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSort("deliveredAt", "asc")}
                              >
                                <SortAsc className="ml-2 h-4 w-4" />
                                الأقدم أولاً
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSort("deliveredAt", "desc")
                                }
                              >
                                <SortDesc className="ml-2 h-4 w-4" />
                                الأحدث أولاً
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>
                                تصفية حسب التاريخ
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {renderDateRangeFilter(
                                deliveryDateFrom,
                                deliveryDateTo,
                                setDeliveryDateFrom,
                                setDeliveryDateTo,
                                "تاريخ التسليم"
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>

                      <TableHead className="h-10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>الحالة</span>
                          {selectedStatuses.size > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-xs"
                            >
                              {selectedStatuses.size}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <Filter
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    selectedStatuses.size > 0 && "text-primary"
                                  )}
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[220px]"
                            >
                              <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {renderFilterCommand(
                                uniqueStatuses,
                                selectedStatuses,
                                setSelectedStatuses,
                                "بحث في الحالات...",
                                statusLabels
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                          <TableCell className="text-center font-mono text-xs">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="text-center">
                            {order.departmentName}
                          </TableCell>
                          <TableCell className="text-center">
                            {order.warehouseName}
                          </TableCell>
                          <TableCell className="text-center">
                            {order.items.length}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {formatDateTime(order.createdAt)}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {order.status === "DELIVERED" && order.deliveredAt
                              ? formatDateTime(order.deliveredAt)
                              : order.status === "REJECTED"
                                ? "-"
                                : "قيد المعالجة"}
                          </TableCell>
                          <TableCell className="text-center">
                            <OrderStatusBadge status={order.status} />
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
                                onClick={() => handleDownloadPDF(order)}
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

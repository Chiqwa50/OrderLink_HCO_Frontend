"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { itemService } from "@/services/item-service"
import {
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Edit,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  XCircle,
} from "lucide-react"

import type { Item, UpdateItemRequest } from "@/types"

import { cn } from "@/lib/utils"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { Textarea } from "@/components/ui/textarea"

export default function ManageItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isChangingPageSize, setIsChangingPageSize] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "sku",
      "name",
      "category",
      "warehouse",
      "unit",
      "isActive",
      "creator",
    ])
  )

  // Filtering state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<string>>(
    new Set()
  )
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  )
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(
    new Set()
  )



  // Delete dialog state
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isDeleteConflict, setIsDeleteConflict] = useState(false)

  // Toggle status state
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  // Bulk Actions
  const handleBulkDisable = async () => {
    if (selectedItems.size === 0) return

    try {
      // Create an array of promises to update all selected items
      const updatePromises = Array.from(selectedItems).map((id) =>
        itemService.updateItem(id, { isActive: false })
      )

      await Promise.all(updatePromises)

      // Refresh items and clear selection
      await new Promise(resolve => setTimeout(resolve, 300))
      await loadItems(false)
      setSelectedItems(new Set())
    } catch (err) {
      console.error("Error disabling items:", err)
      setError("حدث خطأ أثناء تعطيل المواد المحددة")
    }
  }

  const handleBulkEnable = async () => {
    if (selectedItems.size === 0) return

    try {
      const updatePromises = Array.from(selectedItems).map((id) =>
        itemService.updateItem(id, { isActive: true })
      )

      await Promise.all(updatePromises)

      await new Promise(resolve => setTimeout(resolve, 300))
      await loadItems(false)
      setSelectedItems(new Set())
    } catch (err) {
      console.error("Error enabling items:", err)
      setError("حدث خطأ أثناء تفعيل المواد المحددة")
    }
  }

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return
    setTimeout(() => {
      setIsBulkDeleting(true)
      setShowDeleteDialog(true)
    }, 100)
  }

  useEffect(() => {
    loadItems(true)
  }, [])

  const loadItems = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const data = await itemService.getItems()
      setItems(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المواد"
      )
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadItems(false)
      return
    }

    setIsRefreshing(true)
    setError(null)

    try {
      const data = await itemService.getItems(searchTerm)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء البحث")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEdit = (item: Item) => {
    router.push(`/items/edit/${item.id}`)
  }

  const handleDelete = (item: Item) => {
    // Delay opening dialog to allow dropdown to close properly
    setTimeout(() => {
      setDeletingItem(item)
      setIsBulkDeleting(false)
      setIsDeleteConflict(false) // Reset conflict state
      setShowDeleteDialog(true)
    }, 100)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      if (isBulkDeleting) {
        const deletePromises = Array.from(selectedItems).map((id) =>
          itemService.deleteItem(id)
            .then(() => ({ status: 'fulfilled', id }))
            .catch((err) => ({ status: 'rejected', id, reason: err }))
        )

        const results = await Promise.all(deletePromises)

        const successful = results.filter((r: any) => r.status === 'fulfilled')
        const failed = results.filter((r: any) => r.status === 'rejected')

        if (failed.length > 0) {
          const errorMsg = failed.length === results.length
            ? "فشل حذف جميع المواد المحددة بسبب ارتباطها بطلبات سابقة"
            : `تم حذف ${successful.length} مادة، وفشل حذف ${failed.length} مادة لارتباطها بطلبات سابقة`
          setError(errorMsg)
        }

        const newSelected = new Set(selectedItems)
        successful.forEach((r: any) => newSelected.delete(r.id))
        setSelectedItems(newSelected)

        setIsBulkDeleting(false)
        setShowDeleteDialog(false)
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadItems(false)

      } else if (deletingItem) {
        await itemService.deleteItem(deletingItem.id)
        setDeletingItem(null)
        setShowDeleteDialog(false)
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadItems(false)
      }

    } catch (err: any) {
      const isConflict = !isBulkDeleting && (err.status === 409 || err.message.includes('لا يمكن حذف هذه المادة'));

      if (!isConflict) {
        console.error("Delete error:", err);
      }

      if (isConflict) {
        setIsDeleteConflict(true)
      } else if (!isBulkDeleting) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء حذف المادة")
        setShowDeleteDialog(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDisableFromDialog = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    try {
      await itemService.toggleItemStatus(deletingItem.id, false)
      setShowDeleteDialog(false)
      await new Promise(resolve => setTimeout(resolve, 300))
      await loadItems(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تعطيل المادة")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (item: Item) => {
    setTogglingItemId(item.id)
    setError(null)

    try {
      await itemService.toggleItemStatus(item.id, !item.isActive)
      // Wait for dropdown to close
      await new Promise(resolve => setTimeout(resolve, 300))
      await loadItems(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تغيير حالة المادة"
      )
    } finally {
      setTogglingItemId(null)
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

  // Unique values for filters - memoized to avoid recalculation
  const uniqueCategories = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.category || "بدون فئة"))).sort(),
    [items]
  )
  const uniqueWarehouses = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.warehouse?.name || "بدون مستودع"))
      ).sort(),
    [items]
  )
  const uniqueUnits = useMemo(
    () => Array.from(new Set(items.map((i) => i.unit || "بدون وحدة"))).sort(),
    [items]
  )
  const uniqueCreators = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.creator?.name || "غير معروف"))
      ).sort(),
    [items]
  )
  const uniqueStatuses = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => (i.isActive ? "active" : "inactive")))
      ),
    [items]
  )

  // Memoized filtered and sorted items for better performance
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search filter
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Category filter
        if (
          selectedCategories.size > 0 &&
          item.category &&
          !selectedCategories.has(item.category)
        ) {
          return false
        }
        if (
          selectedCategories.size > 0 &&
          !item.category &&
          !selectedCategories.has("بدون فئة")
        ) {
          return false
        }

        // Warehouse filter
        if (selectedWarehouses.size > 0) {
          const warehouseName = item.warehouse?.name || "بدون مستودع"
          if (!selectedWarehouses.has(warehouseName)) return false
        }

        // Unit filter
        if (selectedUnits.size > 0) {
          const unit = item.unit || "بدون وحدة"
          if (!selectedUnits.has(unit)) return false
        }

        // Status filter
        if (selectedStatuses.size > 0) {
          const status = item.isActive ? "active" : "inactive"
          if (!selectedStatuses.has(status)) return false
        }

        // Creator filter
        if (selectedCreators.size > 0) {
          const creator = item.creator?.name || "غير معروف"
          if (!selectedCreators.has(creator)) return false
        }

        return true
      })
      .sort((a, b) => {
        if (!sortColumn) return 0

        let aValue: any = a[sortColumn as keyof Item]
        let bValue: any = b[sortColumn as keyof Item]

        // Handle nested creator name
        if (sortColumn === "creator") {
          aValue = a.creator?.name || ""
          bValue = b.creator?.name || ""
        }

        // Handle nested warehouse name
        if (sortColumn === "warehouse") {
          aValue = a.warehouse?.name || ""
          bValue = b.warehouse?.name || ""
        }

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
    items,
    searchTerm,
    selectedCategories,
    selectedWarehouses,
    selectedUnits,
    selectedStatuses,
    selectedCreators,
    sortColumn,
    sortDirection,
  ])

  // Pagination logic - memoized
  const { totalPages, paginatedItems } = useMemo(() => {
    const total = Math.ceil(filteredItems.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredItems.slice(startIndex, endIndex)

    return {
      totalPages: total,
      paginatedItems: paginated,
    }
  }, [filteredItems, currentPage, pageSize])

  // Selection handlers - memoized
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set(paginatedItems.map((item) => item.id))
        setSelectedItems(allIds)
      } else {
        setSelectedItems(new Set())
      }
    },
    [paginatedItems]
  )

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(itemId)
      } else {
        newSelected.delete(itemId)
      }
      return newSelected
    })
  }, [])

  const isAllSelected = useMemo(
    () =>
      paginatedItems.length > 0 &&
      paginatedItems.every((item) => selectedItems.has(item.id)),
    [paginatedItems, selectedItems]
  )
  const isSomeSelected = useMemo(
    () =>
      paginatedItems.some((item) => selectedItems.has(item.id)) &&
      !isAllSelected,
    [paginatedItems, selectedItems, isAllSelected]
  )

  const toggleColumnVisibility = useCallback((column: string) => {
    setVisibleColumns((prev) => {
      const newVisible = new Set(prev)
      if (newVisible.has(column)) {
        newVisible.delete(column)
      } else {
        newVisible.add(column)
      }
      return newVisible
    })
  }, [])

  // Filter handlers - memoized
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
                    {isSelected && (
                      <span className="mr-auto flex h-4 w-4 items-center justify-center font-mono text-xs"></span>
                    )}
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

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    selectedCategories,
    selectedWarehouses,
    selectedUnits,
    selectedStatuses,
    selectedCreators,
  ])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setIsChangingPageSize(true)
    setPageSize(size)
    setCurrentPage(1)
    // Simulate brief loading for UI feedback
    setTimeout(() => setIsChangingPageSize(false), 300)
  }, [])

  // Check selection status - memoized
  const { hasActiveItems, hasInactiveItems } = useMemo(() => {
    const selectedItemsList = items.filter((item) => selectedItems.has(item.id))
    return {
      hasActiveItems: selectedItemsList.some((item) => item.isActive),
      hasInactiveItems: selectedItemsList.some((item) => !item.isActive),
    }
  }, [items, selectedItems])

  return (
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المواد</h1>
          <p className="text-muted-foreground">
            إدارة قائمة المواد والمخزون في النظام
          </p>
        </div>
        <Button
          onClick={() => router.push("/items/add")}
          className="w-full md:w-auto"
        >
          <Plus className="ml-2 h-4 w-4" />
          إضافة مادة
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي المواد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% من الشهر الماضي
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الفئات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map((i) => i.category).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">فئة مختلفة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المواد النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter((i) => i.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {items.length} مادة
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            قائمة المواد
          </CardTitle>
          <CardDescription>جميع المواد المتاحة في النظام</CardDescription>
          <div className="flex gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المواد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-10"
              />
            </div>

            {selectedItems.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <MoreHorizontal className="h-4 w-4 ml-2" />
                    إجراءات ({selectedItems.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>إجراءات على المحدد</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasActiveItems && (
                    <DropdownMenuItem onClick={handleBulkDisable}>
                      <Power className="ml-2 h-4 w-4 text-orange-600" />
                      تعطيل المحدد
                    </DropdownMenuItem>
                  )}
                  {hasInactiveItems && (
                    <DropdownMenuItem onClick={handleBulkEnable}>
                      <Power className="ml-2 h-4 w-4 text-green-600" />
                      تفعيل المحدد
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف المحدد
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>عرض الأعمدة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("sku")}
                  onCheckedChange={() => toggleColumnVisibility("sku")}
                >
                  رمز المادة
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("name")}
                  onCheckedChange={() => toggleColumnVisibility("name")}
                >
                  اسم المادة
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("category")}
                  onCheckedChange={() => toggleColumnVisibility("category")}
                >
                  الفئة
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("quantity")}
                  onCheckedChange={() => toggleColumnVisibility("quantity")}
                >
                  الكمية
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("unit")}
                  onCheckedChange={() => toggleColumnVisibility("unit")}
                >
                  الوحدة
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("isActive")}
                  onCheckedChange={() => toggleColumnVisibility("isActive")}
                >
                  الحالة
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("creator")}
                  onCheckedChange={() => toggleColumnVisibility("creator")}
                >
                  أنشئ من قبل
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has("warehouse")}
                  onCheckedChange={() => toggleColumnVisibility("warehouse")}
                >
                  المستودع
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => loadItems(false)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isChangingPageSize ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isChangingPageSize
                  ? "جاري تحميل البيانات..."
                  : "جاري تحميل المواد..."}
              </p>
            </div>
          ) : (
            <>
              {/* Filter Status */}
              {(selectedCategories.size > 0 ||
                selectedWarehouses.size > 0 ||
                selectedUnits.size > 0 ||
                selectedStatuses.size > 0 ||
                selectedCreators.size > 0 ||
                searchTerm) && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>
                      عرض {filteredItems.length} من {items.length} مادة
                    </span>
                    {(selectedCategories.size > 0 ||
                      selectedWarehouses.size > 0 ||
                      selectedUnits.size > 0 ||
                      selectedStatuses.size > 0 ||
                      selectedCreators.size > 0) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => {
                            setSelectedCategories(new Set())
                            setSelectedWarehouses(new Set())
                            setSelectedUnits(new Set())
                            setSelectedStatuses(new Set())
                            setSelectedCreators(new Set())
                          }}
                        >
                          <XCircle className="h-3 w-3 ml-1" />
                          مسح جميع الفلاتر
                        </Button>
                      )}
                  </div>
                )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 text-center px-6">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="تحديد الكل"
                            className={
                              isSomeSelected
                                ? "data-[state=checked]:bg-muted"
                                : ""
                            }
                          />
                        </div>
                      </TableHead>
                      {visibleColumns.has("sku") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="whitespace-nowrap">رمز المادة</span>
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
                                  onClick={() => handleSort("sku", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />
                                  تصاعدي (أ-ي)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("sku", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />
                                  تنازلي (ي-أ)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("name") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>اسم المادة</span>
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
                                  onClick={() => handleSort("name", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />أ - ي
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("name", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />ي - أ
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("category") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>الفئة</span>
                            {selectedCategories.size > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-xs"
                              >
                                {selectedCategories.size}
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
                                      selectedCategories.size > 0 &&
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
                                  onClick={() => handleSort("category", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />أ - ي
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("category", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />ي - أ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {renderFilterCommand(
                                  uniqueCategories,
                                  selectedCategories,
                                  setSelectedCategories,
                                  "بحث في الفئات..."
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("warehouse") && (
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
                                  onClick={() => handleSort("warehouse", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />أ - ي
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSort("warehouse", "desc")
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
                      )}
                      {visibleColumns.has("quantity") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>الكمية</span>
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
                                  onClick={() => handleSort("quantity", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />
                                  من الأقل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("quantity", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />
                                  من الأكثر
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("unit") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>الوحدة</span>
                            {selectedUnits.size > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-xs"
                              >
                                {selectedUnits.size}
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
                                      selectedUnits.size > 0 && "text-primary"
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
                                  onClick={() => handleSort("unit", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />أ - ي
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("unit", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />ي - أ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {renderFilterCommand(
                                  uniqueUnits,
                                  selectedUnits,
                                  setSelectedUnits,
                                  "بحث في الوحدات..."
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("isActive") && (
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
                                      selectedStatuses.size > 0 &&
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
                                  onClick={() => handleSort("isActive", "desc")}
                                >
                                  <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                                  النشطة أولاً
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("isActive", "asc")}
                                >
                                  <XCircle className="ml-2 h-4 w-4 text-gray-400" />
                                  غير النشطة أولاً
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {renderFilterCommand(
                                  uniqueStatuses,
                                  selectedStatuses,
                                  setSelectedStatuses,
                                  "بحث في الحالة...",
                                  {
                                    active: "نشط",
                                    inactive: "غير نشط",
                                  }
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.has("creator") && (
                        <TableHead className="h-10 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="whitespace-nowrap">من قبل</span>
                            {selectedCreators.size > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-xs"
                              >
                                {selectedCreators.size}
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
                                      selectedCreators.size > 0 &&
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
                                  onClick={() => handleSort("creator", "asc")}
                                >
                                  <SortAsc className="ml-2 h-4 w-4" />أ - ي
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSort("creator", "desc")}
                                >
                                  <SortDesc className="ml-2 h-4 w-4" />ي - أ
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>تصفية</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {renderFilterCommand(
                                  uniqueCreators,
                                  selectedCreators,
                                  setSelectedCreators,
                                  "بحث في المنشئين..."
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="h-10 w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.size + 2}
                          className="h-24 text-center"
                        >
                          <p className="text-muted-foreground">لا توجد مواد</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className={`${!item.isActive ? "opacity-60" : ""} ${selectedItems.has(item.id) ? "bg-muted" : ""
                            }`}
                          data-state={
                            selectedItems.has(item.id) ? "selected" : undefined
                          }
                        >
                          <TableCell className="text-center px-6">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) =>
                                handleSelectItem(item.id, checked as boolean)
                              }
                              aria-label={`تحديد ${item.name}`}
                            />
                          </TableCell>
                          {visibleColumns.has("sku") && (
                            <TableCell className="font-mono text-sm md:text-xs py-3 md:py-2.5 text-center whitespace-nowrap">
                              {item.sku}
                            </TableCell>
                          )}
                          {visibleColumns.has("name") && (
                            <TableCell className="font-medium text-base md:text-sm py-3 md:py-2.5 text-center whitespace-nowrap">
                              {item.name}
                            </TableCell>
                          )}
                          {visibleColumns.has("category") && (
                            <TableCell className="text-sm md:text-base py-3 md:py-2.5 text-center whitespace-nowrap">
                              {item.category || "-"}
                            </TableCell>
                          )}
                          {visibleColumns.has("warehouse") && (
                            <TableCell className="py-3 md:py-2.5 text-center whitespace-nowrap">
                              <span className="text-sm md:text-xs">
                                {item.warehouse?.name || "-"}
                              </span>
                              {item.warehouse?.code && (
                                <span className="text-xs text-muted-foreground block">
                                  ({item.warehouse.code})
                                </span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.has("quantity") && (
                            <TableCell className="text-sm md:text-base py-3 md:py-2.5 text-center whitespace-nowrap">
                              {item.quantity}
                            </TableCell>
                          )}
                          {visibleColumns.has("unit") && (
                            <TableCell className="text-sm md:text-base py-3 md:py-2.5 text-center whitespace-nowrap">
                              {item.unit || "-"}
                            </TableCell>
                          )}
                          {visibleColumns.has("isActive") && (
                            <TableCell className="py-3 md:py-2.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {item.isActive ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-sm md:text-xs text-green-600 font-medium">
                                      نشط
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-sm md:text-xs text-gray-500">
                                      غير نشط
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("creator") && (
                            <TableCell className="py-3 md:py-2.5 text-center whitespace-nowrap">
                              <span className="text-sm md:text-xs text-muted-foreground">
                                {item.creator?.name || "-"}
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="py-2.5">
                            {togglingItemId === item.id || (isDeleting && deletingItem?.id === item.id) ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">فتح القائمة</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px]"
                                >
                                  <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(item)}
                                    disabled={togglingItemId === item.id}
                                  >
                                    {togglingItemId === item.id ? (
                                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Power
                                        className={`ml-2 h-4 w-4 ${item.isActive
                                          ? "text-orange-600"
                                          : "text-green-600"
                                          }`}
                                      />
                                    )}
                                    {item.isActive ? "تعطيل" : "تفعيل"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="ml-2 h-4 w-4" />
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.sku)
                                    }}
                                  >
                                    <Copy className="ml-2 h-4 w-4" />
                                    نسخ الرمز
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(item)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Section */}
              <div className="mt-4">
                {selectedItems.size > 0 && (
                  <div className="text-sm text-muted-foreground mb-3">
                    تم تحديد {selectedItems.size} من {filteredItems.length} صف
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    عرض {(currentPage - 1) * pageSize + 1} إلى{" "}
                    {Math.min(currentPage * pageSize, filteredItems.length)} من{" "}
                    {filteredItems.length} مادة
                  </div>
                  <div className="order-1 sm:order-2 w-full sm:w-auto">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={filteredItems.length}
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



      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {isDeleteConflict ? "تعذر حذف المادة" : "تأكيد الحذف"}
            </DialogTitle>
            <DialogDescription>
              {isDeleteConflict ? (
                <>
                  لا يمكن حذف هذه المادة لأنها مستخدمة في طلبات سابقة.
                  <br />
                  يمكنك تعطيلها بدلاً من ذلك لمنع استخدامها في المستقبل.
                </>
              ) : (
                <>
                  {isBulkDeleting
                    ? `هل أنت متأكد من حذف ${selectedItems.size} مادة محددة؟`
                    : `هل أنت متأكد من حذف المادة "${deletingItem?.name}"؟`}
                  <br />
                  لا يمكن التراجع عن هذا الإجراء.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            {isDeleteConflict ? (
              <Button
                variant="default"
                onClick={handleDisableFromDialog}
                disabled={isDeleting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isDeleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تعطيل المادة
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حذف
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

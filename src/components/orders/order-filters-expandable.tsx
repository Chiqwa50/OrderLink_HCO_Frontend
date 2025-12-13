"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface OrderFilters {
  status?: string
  departmentId?: string
  warehouseId?: string
  createdBy?: string
  dateFrom?: string
  dateTo?: string
}

interface OrderFiltersExpandableProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  departments?: Array<{ id: string; name: string }>
  warehouses?: Array<{ id: string; name: string }>
  users?: Array<{ id: string; name: string }>
  showDepartmentFilter?: boolean
  showWarehouseFilter?: boolean
  showUserFilter?: boolean
  showStatusFilter?: boolean
  excludeStatuses?: string[] // حالات يجب استبعادها من خيارات الفلترة
}

const statusOptions = [
  { value: "ALL", label: "الكل" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "APPROVED", label: "معتمد" },
  { value: "PREPARING", label: "قيد التجهيز" },
  { value: "READY", label: "جاهز" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "REJECTED", label: "مرفوض" },
]

export function OrderFiltersExpandable({
  filters,
  onFiltersChange,
  departments = [],
  warehouses = [],
  users = [],
  showDepartmentFilter = false,
  showWarehouseFilter = false,
  showUserFilter = false,
  showStatusFilter = true,
  excludeStatuses = [],
}: OrderFiltersExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // فلترة خيارات الحالة بناءً على excludeStatuses
  const filteredStatusOptions = statusOptions.filter(
    (option) =>
      option.value === "ALL" || !excludeStatuses.includes(option.value)
  )

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    const newFilters = { ...filters }
    if (value === "ALL" || value === "") {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key as keyof OrderFilters] &&
      filters[key as keyof OrderFilters] !== "ALL"
  ).length

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-full sm:w-auto"
      >
        <Filter className="ml-2 h-4 w-4" />
        فلترة
        {isExpanded ? (
          <ChevronUp className="mr-2 h-4 w-4" />
        ) : (
          <ChevronDown className="mr-2 h-4 w-4" />
        )}
        {activeFiltersCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Expandable Filters Container - Full Width Below Parent */}
      {isExpanded && (
        <div className="absolute left-0 right-0 top-full mt-2 z-10">
          <div className="rounded-lg border bg-card p-6 shadow-lg">
            <div className="space-y-4">
              {/* Filters Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  خيارات الفلترة
                </h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-3 text-xs"
                  >
                    <X className="ml-1 h-3 w-3" />
                    مسح الكل ({activeFiltersCount})
                  </Button>
                )}
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* فلتر الحالة */}
                {showStatusFilter && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">الحالة</Label>
                    <Select
                      value={filters.status || "ALL"}
                      onValueChange={(value) =>
                        handleFilterChange("status", value)
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* فلتر القسم */}
                {showDepartmentFilter && departments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">القسم</Label>
                    <Select
                      value={filters.departmentId || "ALL"}
                      onValueChange={(value) =>
                        handleFilterChange("departmentId", value)
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">الكل</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* فلتر المستودع */}
                {showWarehouseFilter && warehouses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">المستودع</Label>
                    <Select
                      value={filters.warehouseId || "ALL"}
                      onValueChange={(value) =>
                        handleFilterChange("warehouseId", value)
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر المستودع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">الكل</SelectItem>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* فلتر المستخدم */}
                {showUserFilter && users.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">المستخدم</Label>
                    <Select
                      value={filters.createdBy || "ALL"}
                      onValueChange={(value) =>
                        handleFilterChange("createdBy", value)
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">الكل</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* فلتر التاريخ من */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                    className="h-10"
                  />
                </div>

                {/* فلتر التاريخ إلى */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

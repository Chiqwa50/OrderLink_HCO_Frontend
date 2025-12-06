"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

interface OrderFiltersComponentProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  departments?: Array<{ id: string; name: string }>
  warehouses?: Array<{ id: string; name: string }>
  users?: Array<{ id: string; name: string }>
  showDepartmentFilter?: boolean
  showWarehouseFilter?: boolean
  showUserFilter?: boolean
  showStatusFilter?: boolean
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

export function OrderFiltersComponent({
  filters,
  onFiltersChange,
  departments = [],
  warehouses = [],
  users = [],
  showDepartmentFilter = false,
  showWarehouseFilter = false,
  showUserFilter = false,
  showStatusFilter = true,
}: OrderFiltersComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="ml-2 h-4 w-4" />
          فلترة
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">خيارات الفلترة</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs"
              >
                <X className="ml-1 h-3 w-3" />
                مسح الكل
              </Button>
            )}
          </div>

          {/* فلتر الحالة */}
          {showStatusFilter && (
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
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
              <Label>القسم</Label>
              <Select
                value={filters.departmentId || "ALL"}
                onValueChange={(value) =>
                  handleFilterChange("departmentId", value)
                }
              >
                <SelectTrigger>
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
              <Label>المستودع</Label>
              <Select
                value={filters.warehouseId || "ALL"}
                onValueChange={(value) =>
                  handleFilterChange("warehouseId", value)
                }
              >
                <SelectTrigger>
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
              <Label>المستخدم</Label>
              <Select
                value={filters.createdBy || "ALL"}
                onValueChange={(value) =>
                  handleFilterChange("createdBy", value)
                }
              >
                <SelectTrigger>
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
            <Label>من تاريخ</Label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          {/* فلتر التاريخ إلى */}
          <div className="space-y-2">
            <Label>إلى تاريخ</Label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

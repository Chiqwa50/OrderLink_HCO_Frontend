"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { departmentService } from "@/services/department-service"
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react"

import type { Department, DepartmentWarehouse } from "@/types"

import { formatDate } from "@/lib/date-utils"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Department Row Component with Warehouses
function DepartmentRow({
  dept,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  dept: Department
  onEdit: (dept: Department) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}) {
  const [warehouses, setWarehouses] = useState<DepartmentWarehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)

  useEffect(() => {
    loadWarehouses()
  }, [dept.id])

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true)
      const data = await departmentService.getDepartmentWarehouses(dept.id)
      setWarehouses(data)
    } catch (err) {
      // Silent fail - just don't show warehouses
      setWarehouses([])
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{dept.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{dept.code}</Badge>
      </TableCell>
      <TableCell>
        {isLoadingWarehouses ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : warehouses.length === 0 ? (
          <span className="text-sm text-muted-foreground">لا توجد</span>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <WarehouseIcon className="h-4 w-4" />
                <span>{warehouses.length} مستودع</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">المستودعات المرتبطة</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {warehouses.map((dw) => (
                    <div
                      key={dw.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {dw.priority}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {dw.warehouse.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dw.warehouse.code}
                          </div>
                        </div>
                      </div>
                      {dw.isPrimary && (
                        <Badge variant="default" className="gap-1 text-xs">
                          <Star className="h-3 w-3 fill-current" />
                          رئيسي
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
      <TableCell className="max-w-xs truncate">
        {dept.description || "-"}
      </TableCell>
      <TableCell>
        <Badge variant={dept.isActive ? "default" : "secondary"}>
          {dept.isActive ? "نشط" : "غير نشط"}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(dept.createdAt)}</TableCell>
      <TableCell className="text-left">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onEdit(dept)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(dept.id, dept.isActive)}
          >
            {dept.isActive ? "تعطيل" : "تفعيل"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(dept.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function ManageDepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await departmentService.getDepartments()
      setDepartments(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الأقسام"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadDepartments()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await departmentService.getDepartments({
        search: searchTerm,
      })
      setDepartments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء البحث")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await departmentService.toggleDepartmentStatus(id, !currentStatus)
      loadDepartments()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحديث الحالة"
      )
    }
  }

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      await departmentService.deleteDepartment(deleteId)
      setDeleteId(null)
      loadDepartments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف")
    }
  }

  const handleEdit = (dept: Department) => {
    router.push(`/departments/edit/${dept.id}`)
  }

  const activeDepartments = departments.filter((d) => d.isActive).length
  const inactiveDepartments = departments.filter((d) => !d.isActive).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأقسام</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الأقسام</p>
        </div>
        <Button onClick={() => router.push("/departments/add")}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الأقسام
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الأقسام النشطة
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeDepartments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الأقسام غير النشطة
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {inactiveDepartments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث عن قسم</CardTitle>
          <CardDescription>ابحث باستخدام الاسم أو الرمز</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="ابحث عن قسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="ml-2 h-4 w-4" />
              بحث
            </Button>
            <Button
              variant="outline"
              onClick={loadDepartments}
              disabled={isLoading}
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأقسام</CardTitle>
          <CardDescription>جميع الأقسام المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أقسام
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الرمز</TableHead>
                  <TableHead className="text-right">
                    المستودعات المرتبطة
                  </TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <DepartmentRow
                    key={dept.id}
                    dept={dept}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد حذف هذا القسم؟ لا يمكن التراجع عن هذا
              الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

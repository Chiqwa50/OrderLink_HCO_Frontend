"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { warehouseService } from "@/services/warehouse-service"
import {
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react"

import type {
  UpdateWarehouseRequest,
  WarehouseType as WType,
  Warehouse as WarehouseType,
} from "@/types"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const warehouseTypeLabels: Record<WType, string> = {
  pharmaceutical: "دوائي",
  logistics: "لوجستي",
  equipment: "أجهزة",
  medical: "طبي",
  general: "عام",
}

const warehouseTypeColors: Record<WType, string> = {
  pharmaceutical: "bg-blue-100 text-blue-800",
  logistics: "bg-green-100 text-green-800",
  equipment: "bg-purple-100 text-purple-800",
  medical: "bg-red-100 text-red-800",
  general: "bg-gray-100 text-gray-800",
}

export default function ManageWarehousesPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<WType | "all">("all")

  // Edit dialog state
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editFormData, setEditFormData] = useState<UpdateWarehouseRequest>({})
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await warehouseService.getWarehouses()
      setWarehouses(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المستودعات"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: any = {}
      if (searchTerm.trim()) filters.search = searchTerm
      if (filterType !== "all") filters.type = filterType

      const data = await warehouseService.getWarehouses(filters)
      setWarehouses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء البحث")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await warehouseService.toggleWarehouseStatus(id, !currentStatus)
      loadWarehouses()
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
      await warehouseService.deleteWarehouse(deleteId)
      setDeleteId(null)
      loadWarehouses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف")
    }
  }

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse)
    setEditFormData({
      name: warehouse.name,
      code: warehouse.code,
      type: warehouse.type,
      description: warehouse.description || "",
      location: warehouse.location || "",
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingWarehouse) return

    setIsUpdating(true)
    setError(null)

    try {
      await warehouseService.updateWarehouse(editingWarehouse.id, editFormData)
      setShowEditDialog(false)
      setEditingWarehouse(null)
      setEditFormData({})
      loadWarehouses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التحديث")
    } finally {
      setIsUpdating(false)
    }
  }

  const activeWarehouses = warehouses.filter((w) => w.isActive).length
  const inactiveWarehouses = warehouses.filter((w) => !w.isActive).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستودعات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع المستودعات</p>
        </div>
        <Button onClick={() => router.push("/warehouses/add")}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة مستودع جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستودعات
            </CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستودعات النشطة
            </CardTitle>
            <Warehouse className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeWarehouses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستودعات غير النشطة
            </CardTitle>
            <Warehouse className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {inactiveWarehouses}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
          <CardDescription>
            ابحث باستخدام الاسم أو الرمز أو صفي حسب النوع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="ابحث عن مستودع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Select
              value={filterType}
              onValueChange={(value: any) => setFilterType(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="نوع المستودع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="pharmaceutical">دوائي</SelectItem>
                <SelectItem value="logistics">لوجستي</SelectItem>
                <SelectItem value="equipment">أجهزة</SelectItem>
                <SelectItem value="medical">طبي</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="ml-2 h-4 w-4" />
              بحث
            </Button>
            <Button
              variant="outline"
              onClick={loadWarehouses}
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

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستودعات</CardTitle>
          <CardDescription>جميع المستودعات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مستودعات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الرمز</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">
                      {warehouse.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{warehouse.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={warehouseTypeColors[warehouse.type]}>
                        {warehouseTypeLabels[warehouse.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {warehouse.location || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={warehouse.isActive ? "default" : "secondary"}
                      >
                        {warehouse.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(warehouse.createdAt)}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(warehouse)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(warehouse.id, warehouse.isActive)
                          }
                        >
                          {warehouse.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(warehouse.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستودع</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المستودع أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم المستودع</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">رمز المستودع</Label>
              <Input
                id="edit-code"
                value={editFormData.code || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">نوع المستودع</Label>
              <Select
                value={editFormData.type}
                onValueChange={(value: WType) =>
                  setEditFormData({ ...editFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المستودع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmaceutical">دوائي</SelectItem>
                  <SelectItem value="logistics">لوجستي</SelectItem>
                  <SelectItem value="equipment">أجهزة</SelectItem>
                  <SelectItem value="medical">طبي</SelectItem>
                  <SelectItem value="general">عام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">الموقع</Label>
              <Input
                id="edit-location"
                value={editFormData.location || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "حفظ التعديلات"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد حذف هذا المستودع؟ لا يمكن التراجع عن هذا
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

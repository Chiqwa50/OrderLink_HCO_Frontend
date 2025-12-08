"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { departmentService } from "@/services/department-service"
import { userService } from "@/services/user-service"
import { warehouseService } from "@/services/warehouse-service"
import {
  Edit,
  LayoutGrid,
  LayoutList,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"

import { UserCard } from "@/components/users/user-card"

import type { Department, UpdateUserRequest, User, Warehouse } from "@/types"

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
import { Checkbox } from "@/components/ui/checkbox"
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

const roleLabels: Record<string, string> = {
  ADMIN: "مدير",
  WAREHOUSE: "مستودع",
  DEPARTMENT: "قسم",
  DRIVER: "سائق",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  WAREHOUSE: "bg-blue-100 text-blue-800",
  DEPARTMENT: "bg-green-100 text-green-800",
  DRIVER: "bg-yellow-100 text-yellow-800",
}

import { useResponsiveView } from "@/hooks/use-responsive-view"

export default function ManageUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useResponsiveView()

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editFormData, setEditFormData] = useState<UpdateUserRequest>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)

  useEffect(() => {
    loadUsers()
    loadDepartments()
    loadWarehouses()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المستخدمين"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await departmentService.getDepartments()
      setDepartments(data)
    } catch (err) {
      console.error("Failed to load departments:", err)
    }
  }

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true)
      const data = await warehouseService.getWarehouses()
      setWarehouses(data.filter((w) => w.isActive))
    } catch (err) {
      console.error("Failed to load warehouses:", err)
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user)

    // جلب الأقسام والمستودعات المرتبطة بالمستخدم
    let userDepartmentIds: string[] = []
    let userWarehouseIds: string[] = []
    let isGlobal = false

    try {
      if (user.role === "DEPARTMENT") {
        const userDepts = await userService.getUserDepartments(user.id)
        userDepartmentIds = userDepts.map((d) => d.id)
      } else if (user.role === "WAREHOUSE") {
        const userWarehs = await userService.getUserWarehouses(user.id)
        // التحقق من وجود مشرف عام
        if (user.warehouseSupervisors && user.warehouseSupervisors.length > 0) {
          isGlobal = user.warehouseSupervisors[0].isGlobal
        }
        if (!isGlobal) {
          userWarehouseIds = userWarehs.map((w) => w.id)
        }
      }
    } catch (err) {
      console.error("Error loading user relations:", err)
    }

    setEditFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      departmentIds: userDepartmentIds,
      warehouseIds: userWarehouseIds,
      isGlobalWarehouseSupervisor: isGlobal,
    })
    setShowEditDialog(true)
  }

  const handleDepartmentToggle = (departmentId: string) => {
    setEditFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds?.includes(departmentId)
        ? prev.departmentIds.filter((id) => id !== departmentId)
        : [...(prev.departmentIds || []), departmentId],
    }))
  }

  const handleWarehouseToggle = (warehouseId: string) => {
    setEditFormData((prev) => ({
      ...prev,
      warehouseIds: prev.warehouseIds?.includes(warehouseId)
        ? prev.warehouseIds.filter((id) => id !== warehouseId)
        : [...(prev.warehouseIds || []), warehouseId],
    }))
  }

  const handleUpdate = async () => {
    if (!editingUser) return

    setIsUpdating(true)
    setError(null)

    try {
      await userService.updateUser(editingUser.id, editFormData)
      setShowEditDialog(false)
      setEditingUser(null)
      setEditFormData({})
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التحديث")
    } finally {
      setIsUpdating(false)
    }
  }

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      await userService.deleteUser(deleteId)
      setDeleteId(null)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف")
    }
  }

  const [visibleCount, setVisibleCount] = useState(10)

  const filteredUsers = users.filter(
    (user) =>
      user.name.includes(searchTerm) ||
      user.phone.includes(searchTerm) ||
      user.department?.name?.includes(searchTerm)
  )

  const displayedUsers = filteredUsers.slice(0, visibleCount)

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10)
  }

  // Reset visible count when search term changes
  useEffect(() => {
    setVisibleCount(10)
  }, [searchTerm])

  const adminUsers = users.filter((u) => u.role === "ADMIN").length
  const departmentUsers = users.filter((u) => u.role === "DEPARTMENT").length
  const warehouseUsers = users.filter((u) => u.role === "WAREHOUSE").length

  return (
    <div className="container mx-auto p-2 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div>
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين</p>
          </div>

          {/* View Mode Toggle - Mobile */}
          <div className="flex md:hidden items-center border rounded-md bg-background">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-md rounded-r-none h-8 px-2"
            >
              <LayoutList className="h-4 w-4" />
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
              <LayoutList className="h-4 w-4 ml-1" />
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

          <Button
            onClick={() => router.push("/users/add")}
            className="w-full md:w-auto"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستخدمين
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديرين</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موظفي الأقسام</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {departmentUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              موظفي المستودع
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {warehouseUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث عن مستخدم</CardTitle>
          <CardDescription>ابحث باستخدام الاسم أو رقم الهاتف</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="ابحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="w-full md:w-auto"
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>جميع المستخدمين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مستخدمين
            </div>
          ) : viewMode === "table" ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right whitespace-nowrap">
                      الاسم
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      رقم الهاتف
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      الدور
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      القسم
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      تاريخ الإنشاء
                    </TableHead>
                    <TableHead className="text-left whitespace-nowrap">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-base md:text-sm whitespace-nowrap">
                        {user.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.phone}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.department?.name || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-left whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visibleCount < filteredUsers.length && (
                <div className="flex justify-center pt-4">
                  <Button onClick={handleLoadMore} variant="outline">
                    تحميل المزيد
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
              {visibleCount < filteredUsers.length && (
                <div className="flex justify-center pt-4">
                  <Button onClick={handleLoadMore} variant="outline">
                    تحميل المزيد
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المستخدم أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">الاسم الكامل</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                كلمة المرور الجديدة (اختياري)
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="اتركه فارغاً إذا لم ترد التغيير"
                value={editFormData.password || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">الدور الوظيفي</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: any) =>
                  setEditFormData({
                    ...editFormData,
                    role: value,
                    departmentIds: [],
                    warehouseIds: [],
                    isGlobalWarehouseSupervisor: false,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور الوظيفي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                  <SelectItem value="WAREHOUSE">مشرف مستودع</SelectItem>
                  <SelectItem value="DEPARTMENT">مشرف قسم</SelectItem>
                  <SelectItem value="DRIVER">سائق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* اختيار الأقسام لمشرف القسم */}
            {editFormData.role === "DEPARTMENT" && (
              <div className="space-y-2">
                <Label>الأقسام المشرف عليها *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  اختر قسم واحد أو عدة أقسام
                </p>
                <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">
                      لا توجد أقسام نشطة
                    </p>
                  ) : (
                    departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Checkbox
                          id={`edit-dept-${dept.id}`}
                          checked={
                            editFormData.departmentIds?.includes(dept.id) ||
                            false
                          }
                          onCheckedChange={() =>
                            handleDepartmentToggle(dept.id)
                          }
                        />
                        <label
                          htmlFor={`edit-dept-${dept.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept.name} ({dept.code})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* اختيار المستودعات لمشرف المستودع */}
            {editFormData.role === "WAREHOUSE" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-global-supervisor"
                    checked={editFormData.isGlobalWarehouseSupervisor || false}
                    onCheckedChange={(checked: boolean) =>
                      setEditFormData({
                        ...editFormData,
                        isGlobalWarehouseSupervisor: checked as boolean,
                        warehouseIds: [],
                      })
                    }
                  />
                  <label
                    htmlFor="edit-global-supervisor"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    مشرف عام على جميع المستودعات
                  </label>
                </div>

                {!editFormData.isGlobalWarehouseSupervisor && (
                  <div className="space-y-2">
                    <Label>المستودعات المشرف عليها *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      اختر مستودع واحد أو عدة مستودعات
                    </p>
                    {isLoadingWarehouses ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                        {warehouses.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center">
                            لا توجد مستودعات نشطة
                          </p>
                        ) : (
                          warehouses.map((warehouse) => (
                            <div
                              key={warehouse.id}
                              className="flex items-center space-x-2 space-x-reverse"
                            >
                              <Checkbox
                                id={`edit-warehouse-${warehouse.id}`}
                                checked={
                                  editFormData.warehouseIds?.includes(
                                    warehouse.id
                                  ) || false
                                }
                                onCheckedChange={() =>
                                  handleWarehouseToggle(warehouse.id)
                                }
                              />
                              <label
                                htmlFor={`edit-warehouse-${warehouse.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {warehouse.name} ({warehouse.code})
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
              هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا
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

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { departmentService } from "@/services/department-service"
import { userService } from "@/services/user-service"
import { warehouseService } from "@/services/warehouse-service"
import { ArrowRight, Loader2, Users } from "lucide-react"

import type { Department, UserRole, Warehouse } from "@/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AddUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    role: "DEPARTMENT" as UserRole,
    departmentIds: [] as string[],
    warehouseIds: [] as string[],
    isGlobalWarehouseSupervisor: false,
  })

  // جلب الأقسام والمستودعات عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        const [depts, warehs] = await Promise.all([
          departmentService.getDepartments(),
          warehouseService.getWarehouses(),
        ])
        setDepartments(depts.filter((d) => d.isActive))
        setWarehouses(warehs.filter((w) => w.isActive))
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("فشل تحميل البيانات")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter((id) => id !== departmentId)
        : [...prev.departmentIds, departmentId],
    }))
  }

  const handleWarehouseToggle = (warehouseId: string) => {
    setFormData((prev) => ({
      ...prev,
      warehouseIds: prev.warehouseIds.includes(warehouseId)
        ? prev.warehouseIds.filter((id) => id !== warehouseId)
        : [...prev.warehouseIds, warehouseId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // التحقق من صحة البيانات
      if (
        formData.role === "DEPARTMENT" &&
        formData.departmentIds.length === 0
      ) {
        setError("يجب اختيار قسم واحد على الأقل لمشرف القسم")
        setIsSubmitting(false)
        return
      }

      if (
        formData.role === "WAREHOUSE" &&
        !formData.isGlobalWarehouseSupervisor &&
        formData.warehouseIds.length === 0
      ) {
        setError("يجب اختيار مستودع واحد على الأقل أو تحديد مشرف عام")
        setIsSubmitting(false)
        return
      }

      await userService.createUser(formData)
      router.push("/users/manage")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المستخدم"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-3xl font-bold">إضافة مستخدم جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المستخدم الجديد</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            بيانات المستخدم
          </CardTitle>
          <CardDescription>جميع الحقول المطلوبة يجب ملؤها</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                placeholder="مثال: أحمد محمد"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="مثال: 0912345678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                سيستخدم رقم الهاتف لتسجيل الدخول
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
              <p className="text-sm text-muted-foreground">
                يجب أن تكون 6 أحرف على الأقل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الدور الوظيفي *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({
                    ...formData,
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
            {formData.role === "DEPARTMENT" && (
              <div className="space-y-2">
                <Label>الأقسام المشرف عليها *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  اختر قسم واحد أو عدة أقسام
                </p>
                {isLoadingData ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
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
                            id={`dept-${dept.id}`}
                            checked={formData.departmentIds.includes(dept.id)}
                            onCheckedChange={() =>
                              handleDepartmentToggle(dept.id)
                            }
                          />
                          <label
                            htmlFor={`dept-${dept.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {dept.name} ({dept.code})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* اختيار المستودعات لمشرف المستودع */}
            {formData.role === "WAREHOUSE" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="global-supervisor"
                    checked={formData.isGlobalWarehouseSupervisor}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({
                        ...formData,
                        isGlobalWarehouseSupervisor: checked as boolean,
                        warehouseIds: [],
                      })
                    }
                  />
                  <label
                    htmlFor="global-supervisor"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    مشرف عام على جميع المستودعات
                  </label>
                </div>

                {!formData.isGlobalWarehouseSupervisor && (
                  <div className="space-y-2">
                    <Label>المستودعات المشرف عليها *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      اختر مستودع واحد أو عدة مستودعات
                    </p>
                    {isLoadingData ? (
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
                                id={`warehouse-${warehouse.id}`}
                                checked={formData.warehouseIds.includes(
                                  warehouse.id
                                )}
                                onCheckedChange={() =>
                                  handleWarehouseToggle(warehouse.id)
                                }
                              />
                              <label
                                htmlFor={`warehouse-${warehouse.id}`}
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Users className="ml-2 h-4 w-4" />
                    إنشاء المستخدم
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { departmentService } from "@/services/department-service"
import { warehouseService } from "@/services/warehouse-service"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building2,
  Loader2,
  Plus,
  Star,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react"

import type { CreateDepartmentRequest, Warehouse } from "@/types"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface WarehouseLink {
  warehouseId: string
  priority: number
  isPrimary: boolean
}

export default function AddDepartmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")

  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    name: "",
    code: "",
    description: "",
    warehouses: [],
  })

  // Load warehouses on mount
  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      setIsLoadingWarehouses(true)
      const data = await warehouseService.getWarehouses({ isActive: true })
      setWarehouses(data)
    } catch (err) {
      setError("فشل تحميل المستودعات")
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  const addWarehouse = () => {
    if (!selectedWarehouseId) return

    // Check if already added
    const alreadyAdded = formData.warehouses?.some(
      (w) => w.warehouseId === selectedWarehouseId
    )
    if (alreadyAdded) {
      setError("هذا المستودع مضاف بالفعل")
      return
    }

    const newWarehouse: WarehouseLink = {
      warehouseId: selectedWarehouseId,
      priority: (formData.warehouses?.length || 0) + 1,
      isPrimary: (formData.warehouses?.length || 0) === 0, // First one is primary by default
    }

    setFormData({
      ...formData,
      warehouses: [...(formData.warehouses || []), newWarehouse],
    })
    setSelectedWarehouseId("")
    setError(null)
  }

  const removeWarehouse = (warehouseId: string) => {
    const updatedWarehouses =
      formData.warehouses?.filter((w) => w.warehouseId !== warehouseId) || []

    // Reassign priorities
    const reorderedWarehouses = updatedWarehouses.map((w, index) => ({
      ...w,
      priority: index + 1,
      // If we removed the primary, make the first one primary
      isPrimary:
        index === 0
          ? true
          : w.warehouseId === warehouseId
            ? false
            : w.isPrimary,
    }))

    setFormData({
      ...formData,
      warehouses: reorderedWarehouses,
    })
  }

  const setPrimaryWarehouse = (warehouseId: string) => {
    const updatedWarehouses =
      formData.warehouses?.map((w) => ({
        ...w,
        isPrimary: w.warehouseId === warehouseId,
      })) || []

    setFormData({
      ...formData,
      warehouses: updatedWarehouses,
    })
  }

  const moveWarehouse = (warehouseId: string, direction: "up" | "down") => {
    const warehouses = formData.warehouses || []
    const index = warehouses.findIndex((w) => w.warehouseId === warehouseId)

    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === warehouses.length - 1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    const newWarehouses: WarehouseLink[] = [...warehouses]

    // Swap
    const temp = newWarehouses[index]
    newWarehouses[index] = newWarehouses[newIndex]
    newWarehouses[newIndex] = temp

    // Update priorities
    const reorderedWarehouses = newWarehouses.map(
      (w: WarehouseLink, i: number) => ({
        ...w,
        priority: i + 1,
      })
    )

    setFormData({
      ...formData,
      warehouses: reorderedWarehouses,
    })
  }

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find((w) => w.id === warehouseId)?.name || "غير معروف"
  }

  const getWarehouseType = (warehouseId: string) => {
    const type = warehouses.find((w) => w.id === warehouseId)?.type
    const typeLabels: Record<string, string> = {
      pharmaceutical: "دوائي",
      logistics: "لوجستي",
      equipment: "أجهزة",
      medical: "طبي",
      general: "عام",
    }
    return type ? typeLabels[type] || type : ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await departmentService.createDepartment(formData)
      router.push("/departments/manage")
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء القسم")
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableWarehouses = warehouses.filter(
    (w) => !formData.warehouses?.some((fw) => fw.warehouseId === w.id)
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-3xl font-bold">إضافة قسم جديد</h1>
        <p className="text-muted-foreground">
          أدخل بيانات القسم وحدد المستودعات المرتبطة
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              بيانات القسم الأساسية
            </CardTitle>
            <CardDescription>جميع الحقول المطلوبة يجب ملؤها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم القسم *</Label>
              <Input
                id="name"
                placeholder="مثال: قسم الطوارئ"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">رمز القسم *</Label>
              <Input
                id="code"
                placeholder="مثال: EMRG"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                رمز فريد للقسم (يُفضل باللغة الإنجليزية)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف مختصر عن القسم..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WarehouseIcon className="h-5 w-5" />
              المستودعات المرتبطة
            </CardTitle>
            <CardDescription>
              حدد المستودعات التي يمكن للقسم الطلب منها (اختياري)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Warehouse */}
            <div className="flex gap-2">
              <Select
                value={selectedWarehouseId}
                onValueChange={setSelectedWarehouseId}
                disabled={
                  isLoadingWarehouses || availableWarehouses.length === 0
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر مستودع..." />
                </SelectTrigger>
                <SelectContent>
                  {availableWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({getWarehouseType(warehouse.id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addWarehouse}
                disabled={!selectedWarehouseId || isLoadingWarehouses}
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة
              </Button>
            </div>

            {/* Warehouse List */}
            {formData.warehouses && formData.warehouses.length > 0 ? (
              <div className="space-y-2">
                <Label>المستودعات المضافة ({formData.warehouses.length})</Label>
                <div className="space-y-2">
                  {formData.warehouses.map((warehouse, index) => (
                    <div
                      key={warehouse.warehouseId}
                      className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="font-mono">
                          {warehouse.priority}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {getWarehouseName(warehouse.warehouseId)}
                            {warehouse.isPrimary && (
                              <Badge variant="default" className="gap-1">
                                <Star className="h-3 w-3" />
                                رئيسي
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getWarehouseType(warehouse.warehouseId)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            moveWarehouse(warehouse.warehouseId, "up")
                          }
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>

                        {/* Move Down */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            moveWarehouse(warehouse.warehouseId, "down")
                          }
                          disabled={index === formData.warehouses!.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>

                        {/* Set Primary */}
                        {!warehouse.isPrimary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPrimaryWarehouse(warehouse.warehouseId)
                            }
                            title="تعيين كرئيسي"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Remove */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWarehouse(warehouse.warehouseId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 الأولوية: رقم أقل = أولوية أعلى. المستودع الرئيسي يظهر
                  افتراضياً في الواجهة.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <WarehouseIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لم يتم إضافة أي مستودعات بعد</p>
                <p className="text-sm">يمكنك إضافة المستودعات لاحقاً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Building2 className="ml-2 h-4 w-4" />
                إنشاء القسم
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
    </div>
  )
}

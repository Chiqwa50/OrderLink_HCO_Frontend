"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { itemService } from "@/services/item-service"
import { warehouseService } from "@/services/warehouse-service"
import { ArrowRight, CheckCircle2, Loader2, PackagePlus } from "lucide-react"

import type { Warehouse } from "@/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
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

export default function AddItemPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    unit: "",
    warehouseId: "",
  })

  // جلب الفئات والوحدات والمستودعات عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الفئات
        const cats = await itemService.getCategories()
        setCategories(cats)

        // جلب الوحدات
        const unitsData = await itemService.getUnits()
        setUnits(unitsData)

        // جلب المستودعات النشطة فقط
        const warehousesData = await warehouseService.getWarehouses({
          isActive: true,
        })
        setWarehouses(warehousesData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("حدث خطأ أثناء تحميل البيانات")
      } finally {
        setIsLoadingWarehouses(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // التحقق من اختيار المستودع
    if (!formData.warehouseId) {
      setError("يجب اختيار المستودع")
      setIsLoading(false)
      return
    }

    try {
      await itemService.createItem({
        ...formData,
        description: formData.description || undefined,
        category: formData.category || undefined,
        unit: formData.unit || undefined,
      })

      setSuccess(true)
      // إعادة تعيين النموذج
      setFormData({
        name: "",
        description: "",
        category: "",
        unit: "",
        warehouseId: "",
      })

      // إعادة التوجيه بعد 2 ثانية
      setTimeout(() => {
        router.push("/items/manage")
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المادة"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-3xl font-bold">إضافة مادة جديدة</h1>
        <p className="text-muted-foreground">أدخل بيانات المادة الجديدة</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950 mb-6">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            تم إنشاء المادة بنجاح! جاري إعادة التوجيه...
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            معلومات المادة
          </CardTitle>
          <CardDescription>أدخل بيانات المادة الجديدة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المادة *</Label>
              <Input
                id="name"
                placeholder="قفازات طبية"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                سيتم توليد رمز المادة (SKU) تلقائياً
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف تفصيلي للمادة..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">المستودع *</Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => handleChange("warehouseId", value)}
                disabled={isLoadingWarehouses}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingWarehouses ? "جاري التحميل..." : "اختر المستودع"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      لا توجد مستودعات نشطة
                    </div>
                  ) : (
                    warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                اختر المستودع الذي ستنتمي إليه المادة
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Combobox
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                  options={categories}
                  placeholder="اختر أو أضف فئة..."
                  searchPlaceholder="ابحث عن فئة..."
                  emptyText="لا توجد فئات مطابقة"
                />
                <p className="text-sm text-muted-foreground">
                  اختر من القائمة أو اكتب فئة جديدة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">الوحدة</Label>
                <Combobox
                  value={formData.unit}
                  onValueChange={(value) => handleChange("unit", value)}
                  options={units}
                  placeholder="اختر أو أضف وحدة..."
                  searchPlaceholder="ابحث عن وحدة..."
                  emptyText="لا توجد وحدات مطابقة"
                />
                <p className="text-sm text-muted-foreground">
                  اختر من القائمة أو اكتب وحدة جديدة
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading || success}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {success ? "تم الإنشاء بنجاح" : "إضافة المادة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/items/manage")}
                disabled={isLoading}
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

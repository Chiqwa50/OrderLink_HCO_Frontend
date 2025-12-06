"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { warehouseService } from "@/services/warehouse-service"
import { ArrowRight, Loader2, Warehouse } from "lucide-react"

import type { CreateWarehouseRequest, WarehouseType } from "@/types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const warehouseTypes: { value: WarehouseType; label: string }[] = [
  { value: "pharmaceutical", label: "دوائي" },
  { value: "logistics", label: "لوجستي" },
  { value: "equipment", label: "أجهزة" },
  { value: "medical", label: "طبي" },
  { value: "general", label: "عام" },
]

export default function AddWarehousePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateWarehouseRequest>({
    name: "",
    code: "",
    type: "general",
    description: "",
    location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await warehouseService.createWarehouse(formData)
      router.push("/warehouses/manage")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المستودع"
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
        <h1 className="text-3xl font-bold">إضافة مستودع جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المستودع الجديد</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            بيانات المستودع
          </CardTitle>
          <CardDescription>جميع الحقول المطلوبة يجب ملؤها</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المستودع *</Label>
              <Input
                id="name"
                placeholder="مثال: مستودع الأدوية"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">رمز المستودع *</Label>
              <Input
                id="code"
                placeholder="مثال: WH-PHARMA"
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
                رمز فريد للمستودع (يُفضل باللغة الإنجليزية)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">نوع المستودع *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: WarehouseType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المستودع" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                placeholder="مثال: الطابق الأرضي - الجناح الشرقي"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف مختصر عن المستودع..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Warehouse className="ml-2 h-4 w-4" />
                    إنشاء المستودع
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

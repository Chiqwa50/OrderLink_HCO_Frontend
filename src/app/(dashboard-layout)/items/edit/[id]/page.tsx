"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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

export default function EditItemPage() {
    const params = useParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
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
        quantity: 0,
    })

    // جلب بيانات المادة والفئات والوحدات والمستودعات عند تحميل الصفحة
    useEffect(() => {
        const fetchData = async () => {
            try {
                // جلب بيانات المادة
                const item = await itemService.getItemById(params.id as string)

                setFormData({
                    name: item.name,
                    description: item.description || "",
                    category: item.category || "",
                    unit: item.unit || "",
                    warehouseId: item.warehouseId || "",
                    quantity: item.quantity || 0,
                })

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
                setIsInitialLoading(false)
            }
        }
        fetchData()
    }, [params.id])

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
            await itemService.updateItem(params.id as string, {
                ...formData,
                description: formData.description || undefined,
                category: formData.category || undefined,
                unit: formData.unit || undefined,
            })

            setSuccess(true)

            // إعادة التوجيه بعد 1.5 ثانية
            setTimeout(() => {
                router.push("/items/manage")
            }, 1500)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "حدث خطأ أثناء تحديث المادة"
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (isInitialLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mr-2 text-muted-foreground">جاري تحميل البيانات...</span>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    رجوع
                </Button>
                <h1 className="text-3xl font-bold">تعديل المادة</h1>
                <p className="text-muted-foreground">تحديث بيانات المادة</p>
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
                        تم تحديث المادة بنجاح! جاري إعادة التوجيه...
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PackagePlus className="h-5 w-5" />
                        معلومات المادة
                    </CardTitle>
                    <CardDescription>قم بتعديل البيانات المطلوبة</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">اسم المادة *</Label>
                            <Input
                                id="name"
                                placeholder="اسم المادة"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                required
                            />
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
                            </div>
                        </div>



                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={isLoading || success}>
                                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                {success ? "تم التحديث" : "حفظ التغييرات"}
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

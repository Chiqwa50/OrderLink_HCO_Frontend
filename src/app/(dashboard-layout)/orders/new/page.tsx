"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { departmentService } from "@/services/department-service"
import { orderService } from "@/services/order-service"
import { userService } from "@/services/user-service"
import { userRestrictionService } from "@/services/user-restriction-service"
import { CheckCircle2, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import type { Department, Item, Warehouse } from "@/types"

import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AddItemDialog } from "@/components/orders/add-item-dialog"

interface SelectedItem {
  item: Item
  quantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState("")

  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)

  // Load user departments
  useEffect(() => {
    loadDepartments()
  }, [])

  // Load warehouses when department is selected
  useEffect(() => {
    if (selectedDepartmentId) {
      loadWarehouses(selectedDepartmentId)
    } else {
      setWarehouses([])
    }
  }, [selectedDepartmentId])

  const loadDepartments = async () => {
    try {
      setIsLoadingDepartments(true)
      const userDepts = await userService.getCurrentUserDepartments()
      setDepartments(userDepts)

      // Auto-select if only one department
      if (userDepts.length === 1) {
        setSelectedDepartmentId(userDepts[0].id)
      }
    } catch (err) {
      console.error("Error loading departments:", err)
      setError("حدث خطأ أثناء تحميل الأقسام")
    } finally {
      setIsLoadingDepartments(false)
    }
  }

  const loadWarehouses = async (departmentId: string) => {
    try {
      setIsLoadingWarehouses(true)
      const deptWarehouses =
        await departmentService.getDepartmentWarehouses(departmentId)
      // Extract warehouse objects from DepartmentWarehouse and cast to Warehouse type
      const warehouseList = deptWarehouses.map(
        (dw) => dw.warehouse as Warehouse
      )
      setWarehouses(warehouseList)
    } catch (err) {
      console.error("Error loading warehouses:", err)
      setError("حدث خطأ أثناء تحميل المستودعات")
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  const handleAddItem = (item: Item, quantity: number) => {
    // Check if item already exists
    const existingIndex = selectedItems.findIndex(
      (si) => si.item.id === item.id
    )

    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedItems]
      updated[existingIndex].quantity += quantity
      setSelectedItems(updated)
    } else {
      // Add new item
      setSelectedItems([...selectedItems, { item, quantity }])
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((si) => si.item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }

    const updated = selectedItems.map((si) =>
      si.item.id === itemId ? { ...si, quantity } : si
    )
    setSelectedItems(updated)
  }

  const validateForm = (): boolean => {
    if (!selectedDepartmentId) {
      setError("يرجى اختيار القسم")
      return false
    }

    if (selectedItems.length === 0) {
      setError("يرجى إضافة مادة واحدة على الأقل")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setRateLimitWarning(null)

    if (!validateForm()) {
      return
    }

    if (!user?.id) {
      setError("لم يتم العثور على معلومات المستخدم")
      return
    }

    setIsLoading(true)

    try {
      // التحقق من معدل الطلبات قبل الإرسال
      const rateLimitCheck = await userRestrictionService.checkRateLimit(user.id)

      if (!rateLimitCheck.allowed) {
        const errorMessage = rateLimitCheck.message || "لقد تجاوزت الحد المسموح من الطلبات"
        setError(errorMessage)
        // عرض toast notification
        toast.error("تجاوز الحد المسموح", {
          description: errorMessage,
        })
        setIsLoading(false)
        return
      }

      // عرض تحذير إذا اقترب من الحد
      if (rateLimitCheck.remaining > 0 && rateLimitCheck.remaining <= 2) {
        setRateLimitWarning(`تنبيه: متبقي ${rateLimitCheck.remaining} طلبات فقط`)
      }

      await orderService.createOrder({
        items: selectedItems.map(({ item, quantity }) => ({
          itemName: item.name,
          quantity,
          unit: item.unit || "piece",
        })),
        notes: notes.trim() || undefined,
      })

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/orders/my-orders")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/dashboard")
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-center">
                تم إرسال الطلب بنجاح!
              </h2>
              <p className="text-muted-foreground text-center">
                سيتم مراجعة طلبك من قبل المستودع قريباً
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري التحويل إلى صفحة الطلبيات...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          طلب جديد
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {rateLimitWarning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{rateLimitWarning}</AlertDescription>
          </Alert>
        )}

        {/* Department Selection */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الطلب</CardTitle>
            <CardDescription>اختر القسم الطالب</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDepartments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="mr-2 text-muted-foreground">
                  جاري تحميل الأقسام...
                </span>
              </div>
            ) : departments.length === 1 ? (
              <div className="space-y-2">
                <Label>القسم الطالب</Label>
                <div className="p-3 border rounded-md bg-muted">
                  <p className="font-medium">{departments[0].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {departments[0].code}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>القسم الطالب *</Label>
                <Select
                  value={selectedDepartmentId}
                  onValueChange={setSelectedDepartmentId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        {selectedDepartmentId && !isLoadingWarehouses && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قائمة المواد</CardTitle>
                  <CardDescription>
                    {selectedItems.length} مادة في الطلب
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  disabled={isLoading}
                  size="sm"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مادة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    لم تقم بإضافة أي مواد بعد
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مادة
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      {/* Item Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-sm sm:text-base line-clamp-2">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono">{item.sku}</span>
                          {item.category && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">
                                {item.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 justify-between sm:justify-end">
                        <div className="flex items-center border rounded-md">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity - 1)
                            }
                            className="h-9 w-9 p-0 rounded-r-none hover:bg-muted"
                            disabled={quantity <= 1}
                          >
                            <span className="text-lg">−</span>
                          </Button>
                          <div className="h-9 w-16 flex items-center justify-center border-x">
                            <span className="font-medium text-sm">
                              {quantity}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity + 1)
                            }
                            className="h-9 w-9 p-0 rounded-l-none hover:bg-muted"
                          >
                            <span className="text-lg">+</span>
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {selectedDepartmentId && (
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات إضافية</CardTitle>
              <CardDescription>أي تعليمات خاصة بالطلب</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="أي تعليمات خاصة بالطلب..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {selectedDepartmentId && (
          <Card>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading || selectedItems.length === 0}
                className="w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إرسال الطلب ({selectedItems.length} مادة)
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>

      {/* Add Item Dialog */}
      <AddItemDialog
        warehouses={warehouses}
        onAddItem={handleAddItem}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}

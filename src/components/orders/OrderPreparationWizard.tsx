"use client"

import { useEffect, useState } from "react"
import type { Order, PreparedItem } from "@/types"
import { OrderUnit } from "@/types"
import { orderService } from "@/services/order-service"
import { toast } from "sonner"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

interface OrderPreparationWizardProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OrderPreparationWizard({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderPreparationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [preparedItems, setPreparedItems] = useState<PreparedItem[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingItem, setIsLoggingItem] = useState(false)
  const [loggedSteps, setLoggedSteps] = useState<Set<number>>(new Set())
  const [isCompleting, setIsCompleting] = useState(false) // حالة إنهاء التجهيز

  // تحويل مواد الطلب إلى PreparedItems عند فتح الحوار
  useEffect(() => {
    if (order && open) {
      // جلب المواد المسجلة من الطلب
      const loggedItemNames = new Set(
        order.preparationLogs
          ?.filter(
            (log: any) =>
              log.action === "ITEM_AVAILABLE" ||
              log.action === "ITEM_UNAVAILABLE"
          )
          .map((log: any) => log.itemName) || []
      )

      const items: PreparedItem[] = order.items.map((item) => ({
        id: item.id,
        name: item.name || item.itemName || "",
        itemName: item.itemName || item.name,
        requestedQuantity: item.quantity,
        availableQuantity: item.quantity,
        unit: item.unit,
        isUnavailable: false,
        notes: "",
      }))
      setPreparedItems(items)

      // تحديد الخطوة الحالية: البحث عن أول مادة غير محفوظة
      let nextUnloggedStep = 0
      for (let i = 0; i < items.length; i++) {
        const itemName = items[i].name || items[i].itemName
        if (!loggedItemNames.has(itemName)) {
          nextUnloggedStep = i
          break
        }
      }

      // تحديث loggedSteps بناءً على المواد المسجلة
      const newLoggedSteps = new Set<number>()
      items.forEach((item, index) => {
        const itemName = item.name || item.itemName
        if (loggedItemNames.has(itemName)) {
          newLoggedSteps.add(index)
        }
      })
      setLoggedSteps(newLoggedSteps)

      setCurrentStep(nextUnloggedStep)
      setNotes("")
      setIsSubmitting(false)
    } else if (!open) {
      // Reset state عند إغلاق الـ dialog نهائياً
      setPreparedItems([])
      setCurrentStep(0)
      setNotes("")
      setIsSubmitting(false)
      setLoggedSteps(new Set())
    }
  }, [order, open])

  const currentItem = preparedItems[currentStep]
  const totalSteps = preparedItems.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  const updateCurrentItem = (updates: Partial<PreparedItem>) => {
    const newItems = [...preparedItems]
    newItems[currentStep] = { ...newItems[currentStep], ...updates }
    setPreparedItems(newItems)
  }

  const handleQuantityChange = (quantity: string) => {
    const numQuantity = parseInt(quantity) || 0
    updateCurrentItem({ availableQuantity: numQuantity })
  }

  const toggleUnavailable = (unavailable: boolean) => {
    updateCurrentItem({
      isUnavailable: unavailable,
      availableQuantity: unavailable ? 0 : currentItem.requestedQuantity,
    })
  }

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setIsLoggingItem(true)
      try {
        // تسجيل المادة الحالية قبل الانتقال
        await logCurrentItem()
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error("Error in handleNext:", error)
      } finally {
        setIsLoggingItem(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const logCurrentItem = async () => {
    if (!order || !currentItem) return

    // السماح بإعادة تسجيل المواد المحفوظة (لتحديثها)
    // لا نتخطى المواد المحفوظة، بل نسجلها مرة أخرى
    const isAlreadyLogged = loggedSteps.has(currentStep)

    if (isAlreadyLogged) {
      console.log(
        `Item at step ${currentStep} was previously logged, updating...`
      )
    }

    try {
      await orderService.logItemPreparation(order.id, {
        itemName: currentItem.name,
        isUnavailable: currentItem.isUnavailable,
        requestedQty: currentItem.requestedQuantity,
        availableQty: currentItem.availableQuantity,
        notes: currentItem.notes || "",
      })

      // تسجيل أن هذه الخطوة تم تسجيلها
      setLoggedSteps((prev) => new Set(prev).add(currentStep))
    } catch (error) {
      console.error("Error logging item:", error)
      // لا نوقف المستخدم، فقط نسجل الخطأ
    }
  }

  const handleFinish = async () => {
    if (!order) return

    // التحقق من أن هناك مادة واحدة على الأقل متوفرة
    const availableItems = preparedItems.filter((item) => !item.isUnavailable)
    if (availableItems.length === 0) {
      toast.error("يجب توفير مادة واحدة على الأقل")
      return
    }

    setIsSubmitting(true)
    try {
      // تسجيل المادة الأخيرة
      await logCurrentItem()

      // تفعيل شاشة إنهاء التجهيز
      setIsCompleting(true)

      // تحديث الطلب إلى READY مع المواد النهائية
      await orderService.prepareOrderWithWizard(order.id, preparedItems, notes)

      // انتظار قليلاً للتأكد من تحديث الطلب في الجدول
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("تم تجهيز الطلب بنجاح")

      // Reset state قبل الإغلاق
      setPreparedItems([])
      setCurrentStep(0)
      setNotes("")
      setIsSubmitting(false)
      setIsCompleting(false)

      // استدعاء onSuccess لتحديث الجدول
      onSuccess()

      // انتظار قليلاً قبل الإغلاق للسماح بتحديث الجدول
      await new Promise((resolve) => setTimeout(resolve, 500))

      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تجهيز الطلب")
      setIsSubmitting(false)
      setIsCompleting(false)
    }
  }

  const availableCount = preparedItems.filter(
    (item) => !item.isUnavailable
  ).length
  const unavailableCount = preparedItems.filter(
    (item) => item.isUnavailable
  ).length

  if (!order || !currentItem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => {
          if (isSubmitting || isCompleting) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting || isCompleting) {
            e.preventDefault()
          }
        }}
      >
        {/* شاشة إنهاء التجهيز */}
        {isCompleting && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">جاري إنهاء التجهيز...</h3>
                <p className="text-sm text-muted-foreground">
                  يتم الآن تحديث حالة الطلب، الرجاء الانتظار
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">
              معالج تجهيز الطلب {order.orderNumber}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            قم بمراجعة كل مادة وتحديد الكمية المتوفرة
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* شريط التقدم */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">
                الخطوة {currentStep + 1} من {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />

            {/* رسالة استئناف إذا كانت هناك خطوات مسجلة */}
            {loggedSteps.size > 0 && currentStep > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  تم حفظ {loggedSteps.size} مادة - الاستئناف من المادة{" "}
                  {currentStep + 1}
                </span>
              </div>
            )}
          </div>

          {/* ملخص سريع */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              متوفر: {availableCount}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <XCircle className="h-3 w-3 text-red-600" />
              غير متوفر: {unavailableCount}
            </Badge>
          </div>

          {/* المادة الحالية */}
          <Card
            className={`${currentItem.isUnavailable ? "opacity-60 bg-muted/50" : ""}`}
          >
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* اسم المادة مع مؤشر المادة المحفوظة */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {currentItem.isUnavailable && (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <Label className="text-sm sm:text-base font-semibold break-words">
                    {currentItem.name}
                  </Label>
                </div>
                {/* مؤشر المادة المحفوظة */}
                {loggedSteps.has(currentStep) && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs border-green-500 text-green-700 dark:text-green-400 flex-shrink-0"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    محفوظة
                  </Badge>
                )}
              </div>

              {/* الكميات - Grid متجاوب */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* الكمية المطلوبة */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    الكمية المطلوبة
                  </Label>
                  <div className="bg-secondary rounded-md px-3 h-9 flex items-center justify-center">
                    <span className="text-sm sm:text-base font-medium">
                      {currentItem.requestedQuantity} {currentItem.unit}
                    </span>
                  </div>
                </div>

                {/* الكمية المتوفرة */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    الكمية المتوفرة
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={currentItem.availableQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    disabled={currentItem.isUnavailable}
                    className="text-sm sm:text-base text-center font-medium h-9"
                  />
                </div>
              </div>

              {/* غير متوفر - كزر */}
              <Button
                type="button"
                variant={currentItem.isUnavailable ? "destructive" : "outline"}
                size="sm"
                onClick={() => toggleUnavailable(!currentItem.isUnavailable)}
                className="w-full justify-center gap-2"
              >
                {currentItem.isUnavailable ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    المادة غير متوفرة
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    المادة متوفرة
                  </>
                )}
              </Button>

              {/* رسالة معلوماتية للمواد المحفوظة */}
              {loggedSteps.has(currentStep) && (
                <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-2.5 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    هذه المادة محفوظة مسبقاً. يمكنك تعديل الكمية أو الحالة وسيتم
                    تحديث السجل تلقائياً.
                  </span>
                </div>
              )}

              {/* تحذير إذا كانت الكمية أقل من المطلوب */}
              {!currentItem.isUnavailable &&
                currentItem.availableQuantity <
                currentItem.requestedQuantity && (
                  <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 p-2.5 rounded-md">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      الكمية المتوفرة ({currentItem.availableQuantity}) أقل من
                      المطلوب ({currentItem.requestedQuantity})
                    </span>
                  </div>
                )}

              {/* ملاحظات للمادة */}
              <div className="space-y-1.5">
                <Label
                  htmlFor={`notes-${currentStep}`}
                  className="text-xs sm:text-sm"
                >
                  ملاحظات (اختياري)
                </Label>
                <Textarea
                  id={`notes-${currentStep}`}
                  placeholder="أضف ملاحظات حول هذه المادة..."
                  value={currentItem.notes || ""}
                  onChange={(e) => updateCurrentItem({ notes: e.target.value })}
                  rows={1}
                  className="resize-none text-xs sm:text-sm min-h-[2.5rem]"
                />
              </div>
            </CardContent>
          </Card>

          {/* ملاحظات عامة - تظهر في الخطوة الأخيرة فقط */}
          {currentStep === totalSteps - 1 && (
            <div className="space-y-2 pt-2 border-t">
              <Label
                htmlFor="general-notes"
                className="text-xs sm:text-sm font-medium"
              >
                ملاحظات عامة على الطلب (اختياري)
              </Label>
              <Textarea
                id="general-notes"
                placeholder="أضف ملاحظات عامة على الطلب..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="resize-none text-xs sm:text-sm min-h-[2.5rem]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting || isLoggingItem}
            className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
            السابق
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting || isLoggingItem}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
            >
              {isLoggingItem ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  التالي
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting || isLoggingItem}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
            >
              {isSubmitting ? (
                "جاري التجهيز..."
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                  إنهاء التجهيز
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useState } from "react"
import type { Order, PreparedItem } from "@/types"
import { OrderUnit } from "@/types"
import { orderService } from "@/services/order-service"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Package, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"

interface PrepareOrderDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PrepareOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: PrepareOrderDialogProps) {
  const [items, setItems] = useState<PreparedItem[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // تحويل مواد الطلب إلى PreparedItems عند فتح الحوار
  useEffect(() => {
    if (order && open) {
      const preparedItems: PreparedItem[] = order.items.map((item) => ({
        id: item.id,
        name: item.name || item.itemName || "",
        itemName: item.itemName || item.name,
        requestedQuantity: item.quantity,
        availableQuantity: item.quantity,
        unit: item.unit,
        isUnavailable: false,
        notes: "",
      }))
      setItems(preparedItems)
      setNotes("")
      setIsSubmitting(false)
    } else if (!open) {
      // Reset state عند إغلاق الـ dialog
      setItems([])
      setNotes("")
      setIsSubmitting(false)
    }
  }, [order, open])

  const updateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...items]
    const numQuantity = parseInt(quantity) || 0
    newItems[index].availableQuantity = numQuantity
    setItems(newItems)
  }

  const toggleItemAvailability = (index: number, unavailable: boolean) => {
    const newItems = [...items]
    newItems[index].isUnavailable = unavailable
    if (unavailable) {
      newItems[index].availableQuantity = 0
    } else {
      newItems[index].availableQuantity = newItems[index].requestedQuantity
    }
    setItems(newItems)
  }

  const handlePrepare = async () => {
    if (!order) return

    // التحقق من أن هناك مادة واحدة على الأقل متوفرة
    const availableItems = items.filter((item) => !item.isUnavailable)
    if (availableItems.length === 0) {
      toast.error("يجب توفير مادة واحدة على الأقل")
      return
    }

    setIsSubmitting(true)
    try {
      await orderService.prepareOrder(order.id, items, notes)
      toast.success("تم بدء تجهيز الطلب بنجاح")
      // Reset state قبل الإغلاق
      setItems([])
      setNotes("")
      setIsSubmitting(false)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تجهيز الطلب")
      setIsSubmitting(false)
    }
  }

  const availableCount = items.filter((item) => !item.isUnavailable).length
  const unavailableCount = items.filter((item) => item.isUnavailable).length

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            تجهيز الطلب {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            حدد الكميات المتوفرة لكل مادة أو قم بإلغاء المواد غير المتوفرة
          </DialogDescription>
        </DialogHeader>

        {/* ملخص سريع */}
        <div className="flex gap-2 py-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            متوفر: {availableCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3 text-red-600" />
            غير متوفر: {unavailableCount}
          </Badge>
        </div>

        {/* قائمة المواد - قابلة للتمرير */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {items.map((item, index) => (
            <Card
              key={index}
              className={`transition-all ${item.isUnavailable ? "opacity-60 bg-muted/50" : ""
                }`}
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* اسم المادة */}
                  <div className="col-span-12 sm:col-span-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {item.isUnavailable && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {item.name}
                    </Label>
                  </div>

                  {/* الكمية المطلوبة */}
                  <div className="col-span-6 sm:col-span-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        المطلوب
                      </Label>
                      <Badge
                        variant="secondary"
                        className="w-full justify-center"
                      >
                        {item.requestedQuantity} {item.unit}
                      </Badge>
                    </div>
                  </div>

                  {/* الكمية المتوفرة */}
                  <div className="col-span-6 sm:col-span-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        المتوفر
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.availableQuantity}
                        onChange={(e) =>
                          updateItemQuantity(index, e.target.value)
                        }
                        disabled={item.isUnavailable}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* غير متوفر */}
                  <div className="col-span-12 sm:col-span-3">
                    <div className="flex items-center gap-2 h-9">
                      <Checkbox
                        id={`unavailable-${index}`}
                        checked={item.isUnavailable}
                        onCheckedChange={(checked) =>
                          toggleItemAvailability(index, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`unavailable-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        غير متوفر
                      </Label>
                    </div>
                  </div>
                </div>

                {/* تحذير إذا كانت الكمية أقل من المطلوب */}
                {!item.isUnavailable &&
                  item.availableQuantity < item.requestedQuantity && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        الكمية المتوفرة ({item.availableQuantity}) أقل من
                        المطلوب ({item.requestedQuantity})
                      </span>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ملاحظات */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="notes" className="text-sm">
            ملاحظات (اختياري)
          </Label>
          <Textarea
            id="notes"
            placeholder="أضف أي ملاحظات حول التجهيز..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button onClick={handlePrepare} disabled={isSubmitting}>
            {isSubmitting ? "جاري التجهيز..." : "بدء التجهيز"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

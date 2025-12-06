"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import type { Order, OrderItem, OrderUnit } from "@/types"

import { Button } from "@/components/ui/button"
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

interface EditOrderDialogProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onSave: (orderId: string, updates: EditOrderData) => Promise<void>
}

export interface EditOrderData {
  items: OrderItem[]
  notes?: string
}

/**
 * مكون حوار تعديل الطلب - OOP Pattern
 * يسمح للمدير بتعديل تفاصيل الطلب قبل الموافقة عليه
 */
export function EditOrderDialog({
  order,
  isOpen,
  onClose,
  onSave,
}: EditOrderDialogProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // تحديث البيانات عند فتح الحوار
  useEffect(() => {
    if (order) {
      setItems([...order.items])
      setNotes(order.notes || "")
    }
  }, [order])

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: "",
        quantity: 1,
        unit: "piece" as OrderUnit,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setItems(newItems)
  }

  const handleSave = async () => {
    if (!order) return

    // التحقق من صحة البيانات
    const validItems = items.filter(
      (item) => item.name.trim() && item.quantity > 0
    )

    if (validItems.length === 0) {
      alert("يجب إضافة مادة واحدة على الأقل")
      return
    }

    setIsSaving(true)
    try {
      await onSave(order.id, {
        items: validItems,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error("Error saving order:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الطلبية</DialogTitle>
          <DialogDescription>
            طلبية رقم: {order.orderNumber} - {order.departmentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* جدول المواد */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>المواد المطلوبة</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة مادة
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المادة</TableHead>
                    <TableHead className="text-right w-32">الكمية</TableHead>
                    <TableHead className="text-right w-32">الوحدة</TableHead>
                    <TableHead className="text-left w-20">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground h-24"
                      >
                        لا توجد مواد. اضغط "إضافة مادة" للبدء
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            placeholder="اسم المادة"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(value) =>
                              handleItemChange(index, "unit", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="piece">قطعة</SelectItem>
                              <SelectItem value="box">صندوق</SelectItem>
                              <SelectItem value="carton">كرتون</SelectItem>
                              <SelectItem value="kg">كجم</SelectItem>
                              <SelectItem value="liter">لتر</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات على الطلبية..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

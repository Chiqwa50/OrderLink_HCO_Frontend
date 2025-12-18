"use client"

import { useEffect, useState } from "react"
import type { Order, OrderItem } from "@/types"
import { orderService } from "@/services/order-service"
import { toast } from "sonner"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Package,
    Edit,
} from "lucide-react"

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

interface OrderEditWizardProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function OrderEditWizard({
    order,
    open,
    onOpenChange,
    onSuccess,
}: OrderEditWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [items, setItems] = useState<OrderItem[]>([])
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize state when order opens
    useEffect(() => {
        if (order && open) {
            setItems(order.items.map(item => ({
                ...item,
                name: item.name || item.itemName || "مادة غير معروفة"
            })))
            setNotes(order.notes || "")
            setCurrentStep(0)
            setIsSubmitting(false)
        } else if (!open) {
            setItems([])
            setCurrentStep(0)
            setNotes("")
            setIsSubmitting(false)
        }
    }, [order, open])

    const currentItem = items[currentStep]
    const totalSteps = items.length
    const progress = ((currentStep + 1) / totalSteps) * 100

    const updateCurrentItem = (updates: Partial<OrderItem>) => {
        const newItems = [...items]
        newItems[currentStep] = { ...newItems[currentStep], ...updates }
        setItems(newItems)
    }

    const handleQuantityChange = (quantity: string) => {
        const numQuantity = parseInt(quantity) || 0
        updateCurrentItem({ quantity: numQuantity })
    }

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleFinish = async () => {
        if (!order) return

        // Validate items
        const validItems = items.filter(
            (item) => item.name.trim() && item.quantity > 0
        )

        if (validItems.length === 0) {
            toast.error("يجب أن يحتوي الطلب على مادة واحدة على الأقل")
            return
        }

        setIsSubmitting(true)
        try {
            await orderService.updateOrder(order.id, {
                items: validItems,
                notes: notes.trim() || undefined,
            })

            toast.success("تم تعديل الطلب بنجاح")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء تعديل الطلب")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!order || !currentItem) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
            <DialogContent
                className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0"
                onInteractOutside={(e) => {
                    if (isSubmitting) {
                        e.preventDefault()
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isSubmitting) {
                        e.preventDefault()
                    }
                }}
            >
                {/* Header */}
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">
                            تعديل الطلب {order.orderNumber}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        قم بمراجعة وتعديل كميات المواد المطلوبة
                    </DialogDescription>
                </DialogHeader>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">
                                المادة {currentStep + 1} من {totalSteps}
                            </span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 sm:h-2" />
                    </div>

                    {/* Current Item Card */}
                    <Card>
                        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                            {/* Item Name */}
                            <div className="flex items-start gap-2">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                                <Label className="text-sm sm:text-base font-semibold break-words">
                                    {currentItem.name}
                                </Label>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    الكمية المطلوبة ({currentItem.unit})
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => updateCurrentItem({ quantity: Math.max(1, currentItem.quantity - 1) })}
                                    >
                                        -
                                    </Button>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={currentItem.quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        className="text-lg text-center font-bold h-10"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => updateCurrentItem({ quantity: currentItem.quantity + 1 })}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* General Notes - Only on last step */}
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
                                rows={2}
                                className="resize-none text-xs sm:text-sm min-h-[3rem]"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0 || isSubmitting}
                        className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                    >
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                        السابق
                    </Button>

                    {currentStep < totalSteps - 1 ? (
                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                        >
                            التالي
                            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                                    حفظ التعديلات
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

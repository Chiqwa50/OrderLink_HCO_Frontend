"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"

import type { Item, Warehouse } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WarehouseItemsList } from "./warehouse-items-list"

interface SelectedItem {
  item: Item
  quantity: number
}

interface AddItemDialogProps {
  warehouses: Warehouse[]
  onAddItem: (item: Item, quantity: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddItemDialog({
  warehouses,
  onAddItem,
  open,
  onOpenChange,
}: AddItemDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null
  )

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setCurrentStep(1)
  }

  const handleItemAdd = (item: Item, quantity: number) => {
    onAddItem(item, quantity)
    // Reset and close
    setCurrentStep(0)
    setSelectedWarehouse(null)
    onOpenChange(false)
  }

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0)
      setSelectedWarehouse(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1 flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="hidden sm:inline">رجوع</span>
              </Button>
            )}
            <DialogTitle className="text-lg sm:text-xl flex-1">
              {currentStep === 0 ? "اختر المستودع" : "اختر المادة"}
            </DialogTitle>
          </div>

          {/* Progress Steps */}
          <div className="space-y-2 mt-3 sm:mt-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${currentStep >= 0 ? "bg-primary" : "bg-muted"}`}
              />
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${currentStep >= 1 ? "bg-primary" : "bg-muted"}`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>المستودع</span>
              <span>المادة</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          {currentStep === 0 ? (
            // Step 1: Select Warehouse
            <ScrollArea className="h-full">
              <div className="space-y-2 sm:space-y-3 pr-4">
                {warehouses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مستودعات متاحة لهذا القسم
                  </div>
                ) : (
                  warehouses.map((warehouse) => (
                    <button
                      key={warehouse.id}
                      onClick={() => handleWarehouseSelect(warehouse)}
                      className="w-full p-3 sm:p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-right"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {warehouse.name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {warehouse.code}
                          </p>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            // Step 2: Select Item
            selectedWarehouse && (
              <WarehouseItemsList
                warehouse={selectedWarehouse}
                onAddItem={handleItemAdd}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { X } from "lucide-react"

import type { Item, Warehouse } from "@/types"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WarehouseItemsList } from "./warehouse-items-list"

interface SelectedItem {
  item: Item
  quantity: number
}

interface ItemSelectionWizardProps {
  warehouses: Warehouse[]
  selectedItems: SelectedItem[]
  onItemsChange: (items: SelectedItem[]) => void
}

export function ItemSelectionWizard({
  warehouses,
  selectedItems,
  onItemsChange,
}: ItemSelectionWizardProps) {
  const handleAddItem = (item: Item, quantity: number) => {
    // Check if item already exists
    const existingIndex = selectedItems.findIndex(
      (si) => si.item.id === item.id
    )

    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedItems]
      updated[existingIndex].quantity += quantity
      onItemsChange(updated)
    } else {
      // Add new item
      onItemsChange([...selectedItems, { item, quantity }])
    }
  }

  const handleRemoveItem = (itemId: string) => {
    onItemsChange(selectedItems.filter((si) => si.item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }

    const updated = selectedItems.map((si) =>
      si.item.id === itemId ? { ...si, quantity } : si
    )
    onItemsChange(updated)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Warehouses and Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">اختر المواد من المستودعات</h3>

        {warehouses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد مستودعات متاحة لهذا القسم
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {warehouses.map((warehouse) => (
              <AccordionItem
                key={warehouse.id}
                value={warehouse.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{warehouse.name}</span>
                    <Badge variant="outline">{warehouse.code}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <WarehouseItemsList
                    warehouse={warehouse}
                    onAddItem={handleAddItem}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Selected Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">المواد المختارة</h3>
          <Badge variant="secondary">{selectedItems.length} مادة</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلب</CardTitle>
            <CardDescription>المواد التي سيتم إضافتها للطلب</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لم تقم باختيار أي مواد بعد
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {selectedItems.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.sku}</span>
                          {item.category && (
                            <>
                              <span>•</span>
                              <span>{item.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity - 1)
                            }
                          >
                            -
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateQuantity(item.id, quantity + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

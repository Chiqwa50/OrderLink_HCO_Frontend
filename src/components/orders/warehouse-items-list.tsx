"use client"

import { useEffect, useRef, useState } from "react"
import { itemService } from "@/services/item-service"
import { Loader2, Plus, Search } from "lucide-react"

import type { Item, Warehouse } from "@/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WarehouseItemsListProps {
  warehouse: Warehouse
  onAddItem: (item: Item, quantity: number) => void
}

export function WarehouseItemsList({
  warehouse,
  onAddItem,
}: WarehouseItemsListProps) {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset state when warehouse changes
    setItems([])
    setPage(1)
    setHasMore(true)
    loadItems(1, searchTerm)
  }, [warehouse.id])

  // Debounce search
  useEffect(() => {
    // Skip the first run as it's handled by the warehouse.id effect
    if (items.length === 0 && page === 1 && !searchTerm) return

    const timer = setTimeout(() => {
      // Reset page when searching
      setPage(1)
      loadItems(1, searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    )

    if (!scrollElement) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100

      // Load more when scrolled to 80%
      if (scrollPercentage > 80 && !isLoading && hasMore && !searchTerm) {
        loadItems(page + 1, searchTerm)
      }
    }

    scrollElement.addEventListener("scroll", handleScroll)
    return () => scrollElement.removeEventListener("scroll", handleScroll)
  }, [isLoading, hasMore, page, searchTerm])

  const loadItems = async (pageNum: number, search: string = "") => {
    try {
      setIsLoading(true)
      const result = await itemService.getItemsByWarehouse(
        warehouse.id,
        pageNum,
        20,
        search
      )

      if (pageNum === 1) {
        setItems(result.items)
      } else {
        setItems((prev) => {
          // Filter out items that already exist in the list
          const newItems = result.items.filter(
            (newItem) => !prev.some((existingItem) => existingItem.id === newItem.id)
          )
          return [...prev, ...newItems]
        })
      }

      setPage(pageNum)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Error loading items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadItems(page + 1, searchTerm)
    }
  }

  const handleAddItem = (item: Item) => {
    const quantity = quantities[item.id] || 1
    onAddItem(item, quantity)
    // Reset quantity after adding
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }))
  }

  // The filtering logic is now handled by the API call via the 'search' parameter

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن مادة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Items List */}
      <ScrollArea
        ref={scrollRef}
        className="h-[calc(85vh-220px)] max-h-[400px]"
        dir="rtl"
      >
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight">{item.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span>{item.sku}</span>
                  {item.category && (
                    <>
                      <span>•</span>
                      <span className="truncate">{item.category}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={quantities[item.id] || 1}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [item.id]: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-14 sm:w-16 text-center h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddItem(item)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="mr-2 text-sm text-muted-foreground">
                جاري التحميل...
              </span>
            </div>
          )}

          {!isLoading && hasMore && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={loadMore}
              size="sm"
            >
              تحميل المزيد
            </Button>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد مواد متاحة"}
            </div>
          )}

          {!isLoading && !hasMore && items.length > 0 && (
            <div className="text-center py-3 text-xs text-muted-foreground">
              تم عرض جميع المواد ({items.length})
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}

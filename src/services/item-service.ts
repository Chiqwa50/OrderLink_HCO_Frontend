import type { CreateItemRequest, Item, UpdateItemRequest } from "@/types"

/**
 * خدمة إدارة المواد - OOP Pattern
 * تتعامل مع جميع العمليات المتعلقة بالمواد
 */
class ItemService {
  private baseUrl: string

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  }

  /**
   * الحصول على التوكن من localStorage
   */
  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }

  /**
   * إرسال طلب HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      const error = new Error(data.error || "حدث خطأ في الاتصال") as any
      error.status = response.status
      throw error
    }

    return data as T
  }

  /**
   * إنشاء مادة جديدة
   */
  async createItem(itemData: CreateItemRequest): Promise<Item> {
    const response = await this.request<{ message: string; item: Item }>(
      "/items",
      {
        method: "POST",
        body: JSON.stringify(itemData),
      }
    )
    return response.item
  }

  /**
   * جلب جميع المواد مع إمكانية البحث
   */
  async getItems(search?: string): Promise<Item[]> {
    const params = new URLSearchParams()
    if (search) params.append("search", search)

    const queryString = params.toString()
    const endpoint = queryString ? `/items?${queryString}` : "/items"

    const response = await this.request<{ items: Item[] }>(endpoint)
    return response.items
  }

  /**
   * جلب مادة محددة بواسطة ID
   */
  async getItemById(itemId: string): Promise<Item> {
    const response = await this.request<{ item: Item }>(`/items/${itemId}`)
    return response.item
  }

  /**
   * تحديث مادة موجودة
   */
  async updateItem(itemId: string, itemData: UpdateItemRequest): Promise<Item> {
    const response = await this.request<{ message: string; item: Item }>(
      `/items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(itemData),
      }
    )
    return response.item
  }

  /**
   * حذف مادة
   */
  async deleteItem(itemId: string): Promise<void> {
    await this.request<{ message: string }>(`/items/${itemId}`, {
      method: "DELETE",
    })
  }

  /**
   * تبديل حالة المادة (نشط/غير نشط)
   */
  async toggleItemStatus(itemId: string, isActive: boolean): Promise<Item> {
    const response = await this.request<{ message: string; item: Item }>(
      `/items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }
    )
    return response.item
  }

  /**
   * جلب جميع الفئات المتاحة
   */
  async getCategories(): Promise<string[]> {
    const response = await this.request<{ categories: string[] }>(
      "/items/meta/categories"
    )
    return response.categories
  }

  /**
   * جلب جميع الوحدات المتاحة
   */
  async getUnits(): Promise<string[]> {
    const response = await this.request<{ units: string[] }>(
      "/items/meta/units"
    )
    return response.units
  }

  /**
   * جلب المواد حسب المستودع مع دعم Pagination والبحث
   */
  async getItemsByWarehouse(
    warehouseId: string,
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<{
    items: Item[]
    total: number
    page: number
    totalPages: number
    hasMore: boolean
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) {
      params.append("search", search)
    }

    const response = await this.request<{
      items: Item[]
      total: number
      page: number
      totalPages: number
      hasMore: boolean
    }>(`/items/warehouse/${warehouseId}?${params.toString()}`)

    return response
  }
  /**
   * جلب سجل المواد غير المتوفرة
   */
  async getUnavailableItems(filters: {
    dateFrom?: string
    dateTo?: string
    category?: string
    warehouseId?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
  }): Promise<{
    logs: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const params = new URLSearchParams()
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.append("dateTo", filters.dateTo)
    if (filters.category) params.append("category", filters.category)
    if (filters.warehouseId) params.append("warehouseId", filters.warehouseId)
    if (filters.sortBy) params.append("sortBy", filters.sortBy)
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)
    if (filters.page) params.append("page", filters.page.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString
      ? `/items/unavailable/logs?${queryString}`
      : "/items/unavailable/logs"

    return await this.request<{
      logs: any[]
      total: number
      page: number
      totalPages: number
    }>(endpoint)
  }
}
// تصدير instance واحد من الخدمة (Singleton Pattern)
export const itemService = new ItemService()
export default ItemService

import type {
  CreateOrderRequest,
  Order,
  OrderHistory,
  UpdateOrderStatusRequest,
} from "@/types"

/**
 * خدمة إدارة الطلبيات - OOP Pattern
 * تتعامل مع جميع العمليات المتعلقة بالطلبيات
 */
class OrderService {
  private baseUrl: string

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  }

  /**
   * تحويل بيانات الطلب من backend format إلى frontend format
   */
  private transformOrder(order: any): Order {
    return {
      ...order,
      departmentName: order.department?.name || order.departmentName || "",
      warehouseName: order.warehouse?.name || order.warehouseName || "",
      warehouseCode: order.warehouse?.code || order.warehouseCode,
      warehouseType: order.warehouse?.type || order.warehouseType,
      createdByName: order.creator?.name || order.createdByName || "",
    }
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
      throw new Error(data.error || "حدث خطأ في الاتصال")
    }

    return data as T
  }

  /**
   * إنشاء طلبية جديدة
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await this.request<{
      message: string
      order: Order
      orders?: any[]
    }>("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
    // إذا كانت الاستجابة تحتوي على orders متعددة، نرجع الأول
    const order = response.orders?.[0] || response.order
    return this.transformOrder(order)
  }

  /**
   * جلب جميع الطلبيات مع إمكانية الفلترة
   */
  async getOrders(filters?: {
    status?: string
    departmentId?: string
    warehouseId?: string
    createdBy?: string
    startDate?: string
    endDate?: string
  }): Promise<Order[]> {
    const params = new URLSearchParams()

    if (filters?.status) params.append("status", filters.status)
    if (filters?.departmentId)
      params.append("departmentId", filters.departmentId)
    if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId)
    if (filters?.createdBy) params.append("createdBy", filters.createdBy)
    if (filters?.startDate) params.append("dateFrom", filters.startDate)
    if (filters?.endDate) params.append("dateTo", filters.endDate)

    const queryString = params.toString()
    const endpoint = queryString ? `/orders?${queryString}` : "/orders"

    const response = await this.request<{ orders: any[] }>(endpoint)
    return response.orders.map((order) => this.transformOrder(order))
  }

  /**
   * جلب الطلبيات المكتملة والمرفوضة (للسجل)
   */
  async getCompletedOrders(filters?: {
    departmentId?: string
    warehouseId?: string
    createdBy?: string
    startDate?: string
    endDate?: string
  }): Promise<Order[]> {
    const params = new URLSearchParams()

    // فلترة حسب الحالات المكتملة والمرفوضة فقط
    // نستخدم استعلامين منفصلين ونجمعهم
    const deliveredParams = new URLSearchParams()
    deliveredParams.append("status", "DELIVERED")

    const rejectedParams = new URLSearchParams()
    rejectedParams.append("status", "REJECTED")

    // إضافة الفلاتر الإضافية
    const addFilters = (p: URLSearchParams) => {
      if (filters?.departmentId) p.append("departmentId", filters.departmentId)
      if (filters?.warehouseId) p.append("warehouseId", filters.warehouseId)
      if (filters?.createdBy) p.append("createdBy", filters.createdBy)
      if (filters?.startDate) p.append("dateFrom", filters.startDate)
      if (filters?.endDate) p.append("dateTo", filters.endDate)
    }

    addFilters(deliveredParams)
    addFilters(rejectedParams)

    // جلب الطلبات المكتملة والمرفوضة
    const [deliveredResponse, rejectedResponse] = await Promise.all([
      this.request<{ orders: any[] }>(`/orders?${deliveredParams.toString()}`),
      this.request<{ orders: any[] }>(`/orders?${rejectedParams.toString()}`),
    ])

    // دمج النتائج وترتيبها حسب التاريخ
    const allOrders = [
      ...deliveredResponse.orders,
      ...rejectedResponse.orders,
    ].map((order) => this.transformOrder(order))

    // ترتيب حسب التاريخ (الأحدث أولاً)
    return allOrders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * جلب طلبية محددة بواسطة ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.request<{ order: any }>(`/orders/${orderId}`)
    return this.transformOrder(response.order)
  }

  /**
   * تحديث حالة الطلبية
   */
  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusRequest
  ): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(statusData),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * جلب سجل التغييرات للطلبية
   */
  async getOrderHistory(orderId: string): Promise<OrderHistory[]> {
    const response = await this.request<{ history: OrderHistory[] }>(
      `/orders/${orderId}/history`
    )
    return response.history
  }

  /**
   * جلب طلبيات القسم الخاص بالمستخدم الحالي
   */
  async getMyOrders(filters?: {
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<Order[]> {
    // Backend يفلتر تلقائياً حسب departmentId للمستخدم الحالي
    const params = new URLSearchParams()

    if (filters?.status) params.append("status", filters.status)
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)

    const queryString = params.toString()
    const endpoint = queryString
      ? `/orders/my-orders?${queryString}`
      : "/orders/my-orders"

    const response = await this.request<{ orders: any[] }>(endpoint)
    return response.orders.map((order) => this.transformOrder(order))
  }

  /**
   * جلب الطلبيات الجاهزة للتوصيل (للسائقين)
   */
  async getReadyOrders(): Promise<Order[]> {
    const response = await this.request<{ orders: any[] }>(
      "/orders?status=READY"
    )
    return response.orders.map((order) => this.transformOrder(order))
  }

  /**
   * جلب الطلبيات المسلمة (للسائقين)
   */
  async getDeliveredOrders(filters?: {
    startDate?: string
    endDate?: string
  }): Promise<Order[]> {
    const params = new URLSearchParams()
    params.append("status", "DELIVERED")

    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)

    const queryString = params.toString()
    const response = await this.request<{ orders: any[] }>(
      `/orders?${queryString}`
    )
    return response.orders.map((order) => this.transformOrder(order))
  }

  /**
   * تعديل طلبية (للمسؤولين فقط)
   */
  async updateOrder(
    orderId: string,
    updates: {
      items?: Array<{
        name: string
        quantity: number
        unit: string
      }>
      notes?: string
    }
  ): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * حذف طلبية (للمسؤولين فقط)
   */
  async deleteOrder(orderId: string): Promise<void> {
    return this.request<void>(`/orders/${orderId}`, {
      method: "DELETE",
    })
  }

  /**
   * تجهيز الطلب (مسؤول المستودع فقط)
   */
  async prepareOrder(
    orderId: string,
    items: Array<{
      id?: string
      name?: string
      itemName?: string
      requestedQuantity: number
      availableQuantity: number
      unit: string
      isUnavailable: boolean
      notes?: string
    }>,
    notes?: string
  ): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}/prepare`,
      {
        method: "POST",
        body: JSON.stringify({ items, notes }),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * تحديث مواد الطلب أثناء التجهيز (مسؤول المستودع فقط)
   */
  async updateOrderItems(
    orderId: string,
    items: Array<{
      id?: string
      name?: string
      itemName?: string
      quantity: number
      unit?: string
      isAvailable: boolean
      notes?: string
    }>
  ): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}/items`,
      {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * تحويل الطلب إلى جاهز (مسؤول المستودع فقط)
   */
  async markOrderReady(orderId: string, notes?: string): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}/mark-ready`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * تجهيز الطلب مع المعالج (مسؤول المستودع فقط)
   */
  async prepareOrderWithWizard(
    orderId: string,
    items: Array<{
      id?: string
      name?: string
      itemName?: string
      requestedQuantity: number
      availableQuantity: number
      unit: string
      isUnavailable: boolean
      notes?: string
    }>,
    notes?: string
  ): Promise<Order> {
    const response = await this.request<{ message: string; order: any }>(
      `/orders/${orderId}/prepare-wizard`,
      {
        method: "POST",
        body: JSON.stringify({ items, notes }),
      }
    )
    return this.transformOrder(response.order)
  }

  /**
   * تسجيل تجهيز مادة واحدة (مسؤول المستودع فقط)
   */
  async logItemPreparation(
    orderId: string,
    item: {
      itemName: string
      isUnavailable: boolean
      requestedQty: number
      availableQty: number
      notes?: string
    }
  ): Promise<void> {
    await this.request<{ success: boolean; message: string }>(
      `/orders/${orderId}/prepare-item`,
      {
        method: "POST",
        body: JSON.stringify(item),
      }
    )
  }

  /**
   * جلب سجلات التجهيز للطلب
   */
  async getPreparationLogs(orderId: string): Promise<any[]> {
    const response = await this.request<{ logs: any[] }>(
      `/orders/${orderId}/preparation-logs`
    )
    return response.logs
  }
}

// تصدير instance واحد من الخدمة (Singleton Pattern)
export const orderService = new OrderService()
export default OrderService

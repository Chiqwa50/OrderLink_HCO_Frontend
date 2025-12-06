import type {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Warehouse,
  WarehouseType,
} from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to normalize warehouse data from backend
const normalizeWarehouse = (warehouse: any): Warehouse => ({
  ...warehouse,
  type: warehouse.type.toLowerCase() as WarehouseType,
})

export const warehouseService = {
  // Get all warehouses
  async getWarehouses(filters?: {
    isActive?: boolean
    type?: WarehouseType
    search?: string
  }): Promise<Warehouse[]> {
    const token = localStorage.getItem("token")
    const params = new URLSearchParams()

    if (filters?.isActive !== undefined) {
      params.append("isActive", String(filters.isActive))
    }
    if (filters?.type) {
      params.append("type", filters.type.toUpperCase())
    }
    if (filters?.search) {
      params.append("search", filters.search)
    }

    const url = `${API_URL}/warehouses${params.toString() ? `?${params.toString()}` : ""}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب المستودعات")
    }

    const data = await response.json()
    return data.warehouses.map(normalizeWarehouse)
  },

  // Get warehouse by ID
  async getWarehouseById(id: string): Promise<Warehouse> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب المستودع")
    }

    const data = await response.json()
    return normalizeWarehouse(data.warehouse)
  },

  // Create new warehouse
  async createWarehouse(data: CreateWarehouseRequest): Promise<Warehouse> {
    const token = localStorage.getItem("token")

    // Convert type to uppercase to match backend enum
    const requestData = {
      ...data,
      type: data.type.toUpperCase(),
    }

    const response = await fetch(`${API_URL}/warehouses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل إنشاء المستودع")
    }

    const result = await response.json()
    return normalizeWarehouse(result.warehouse)
  },

  // Update warehouse
  async updateWarehouse(
    id: string,
    data: UpdateWarehouseRequest
  ): Promise<Warehouse> {
    const token = localStorage.getItem("token")

    // Convert type to uppercase to match backend enum if type is being updated
    const requestData = {
      ...data,
      ...(data.type && { type: data.type.toUpperCase() }),
    }

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل تحديث المستودع")
    }

    const result = await response.json()
    return normalizeWarehouse(result.warehouse)
  },

  // Toggle warehouse status
  async toggleWarehouseStatus(
    id: string,
    isActive: boolean
  ): Promise<Warehouse> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/warehouses/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    })

    if (!response.ok) {
      throw new Error("فشل تحديث حالة المستودع")
    }

    const result = await response.json()
    return normalizeWarehouse(result.warehouse)
  },

  // Delete warehouse
  async deleteWarehouse(id: string): Promise<void> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل حذف المستودع")
    }
  },
}

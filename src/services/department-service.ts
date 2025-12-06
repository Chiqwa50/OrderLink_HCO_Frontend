import type {
  CreateDepartmentRequest,
  Department,
  DepartmentWarehouse,
  UpdateDepartmentRequest,
} from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const departmentService = {
  // Get all departments
  async getDepartments(filters?: {
    isActive?: boolean
    search?: string
  }): Promise<Department[]> {
    const token = localStorage.getItem("token")
    const params = new URLSearchParams()

    if (filters?.isActive !== undefined) {
      params.append("isActive", String(filters.isActive))
    }
    if (filters?.search) {
      params.append("search", filters.search)
    }

    const url = `${API_URL}/departments${params.toString() ? `?${params.toString()}` : ""}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب الأقسام")
    }

    const data = await response.json()
    return data.departments
  },

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب القسم")
    }

    const data = await response.json()
    return data.department
  },

  // Create new department
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل إنشاء القسم")
    }

    const result = await response.json()
    return result.department
  },

  // Update department
  async updateDepartment(
    id: string,
    data: UpdateDepartmentRequest
  ): Promise<Department> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل تحديث القسم")
    }

    const result = await response.json()
    return result.department
  },

  // Toggle department status
  async toggleDepartmentStatus(
    id: string,
    isActive: boolean
  ): Promise<Department> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    })

    if (!response.ok) {
      throw new Error("فشل تحديث حالة القسم")
    }

    const result = await response.json()
    return result.department
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || "فشل حذف القسم")
    }
  },

  // Get department warehouses
  async getDepartmentWarehouses(id: string): Promise<DepartmentWarehouse[]> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/departments/${id}/warehouses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب المستودعات المرتبطة")
    }

    const data = await response.json()
    return data.warehouses
  },
}

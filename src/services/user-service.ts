import type {
  CreateUserRequest,
  Department,
  UpdateUserRequest,
  User,
  Warehouse,
} from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const userService = {
  // Get all users
  // Note: department might be undefined/null for admins or warehouse staff
  async getUsers(): Promise<User[]> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب المستخدمين")
    }

    const data = await response.json()
    return data.users
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب المستخدم")
    }

    const data = await response.json()
    return data.user
  },

  // Create new user
  async createUser(data: CreateUserRequest): Promise<User> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "فشل إنشاء المستخدم")
    }

    const result = await response.json()
    return result.user
  },

  // Update user
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "فشل تحديث المستخدم")
    }

    const result = await response.json()
    return result.user
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "فشل حذف المستخدم")
    }
  },

  // Get user departments (for department supervisors)
  async getUserDepartments(userId: string): Promise<Department[]> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/${userId}/departments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب أقسام المستخدم")
    }

    const data = await response.json()
    return data.departments
  },

  // Get user warehouses (for warehouse supervisors)
  async getUserWarehouses(userId: string): Promise<Warehouse[]> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/${userId}/warehouses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب مستودعات المستخدم")
    }

    const data = await response.json()
    return data.warehouses
  },

  // Get current user's departments
  async getCurrentUserDepartments(): Promise<Department[]> {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/users/me/departments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("فشل جلب أقسام المستخدم")
    }

    const data = await response.json()
    return data.departments
  },
}

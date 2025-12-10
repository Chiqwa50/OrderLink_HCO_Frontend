const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface LoginRequest {
  phone: string
  password: string
}

interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    phone: string
    name: string
    role: string
    departmentName: string | null
  }
}

interface ApiError {
  error: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error((data as ApiError).error || "حدث خطأ في الاتصال")
    }

    return data as T
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async getMe(): Promise<{ user: LoginResponse["user"] }> {
    return this.request<{ user: LoginResponse["user"] }>("/auth/me")
  }

  async updateMe(data: any): Promise<{ user: LoginResponse["user"] }> {
    return this.request<{ user: LoginResponse["user"] }>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    return this.request("/dashboard/stats")
  }

  async getOrdersTimeline(days: number = 7): Promise<any> {
    return this.request(`/dashboard/timeline?days=${days}`)
  }

  async getDepartmentActivity(limit: number = 10): Promise<any> {
    return this.request(`/dashboard/departments?limit=${limit}`)
  }

  async getTopItems(limit: number = 5): Promise<any> {
    return this.request(`/dashboard/top-items?limit=${limit}`)
  }

  async getOrderStatusDistribution(): Promise<any> {
    return this.request("/dashboard/status-distribution")
  }

  async getTopWarehouseUsers(limit: number = 5): Promise<any> {
    return this.request(`/dashboard/top-warehouse-users?limit=${limit}`)
  }
}

export const api = new ApiClient(API_BASE_URL)
export type { LoginRequest, LoginResponse, ApiError }

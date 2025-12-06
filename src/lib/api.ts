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
}

export const api = new ApiClient(API_BASE_URL)
export type { LoginRequest, LoginResponse, ApiError }

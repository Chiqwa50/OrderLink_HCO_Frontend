"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { LoginRequest } from "@/lib/api"
import type { ReactNode } from "react"

import { api } from "@/lib/api"

interface User {
  id: string
  phone: string
  name: string
  role: string
  departmentId?: string
  department?: {
    id: string
    name: string
    code: string
  }
  departmentName?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem("token")
    if (token) {
      // Verify token and get user data
      api
        .getMe()
        .then((response: any) => {
          const userData = {
            ...response.user,
            departmentName: response.user.department?.name || null,
          }
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem("token")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response: any = await api.login(credentials)
      localStorage.setItem("token", response.token)

      const userData = {
        ...response.user,
        departmentName: response.user.department?.name || null,
      }
      setUser(userData)

      // توجيه المستخدم حسب دوره
      const role = response.user.role.toUpperCase()

      switch (role) {
        case "DEPARTMENT":
          router.push("/orders/my-orders")
          break
        case "WAREHOUSE":
          router.push("/orders/manage")
          break
        case "DRIVER":
          router.push("/deliveries/pending")
          break
        case "ADMIN":
          router.push("/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

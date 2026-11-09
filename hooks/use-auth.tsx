"use client"

import type React from "react"

import type { User } from "@/types/user"
import { createContext, useContext, useEffect, useState } from "react"
import { authService } from "@/services/auth-service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem("token")
        console.log("[AUTH] Token exists:", !!token)
        if (token) {
          console.log("[AUTH] Fetching user data from API...")
          // Try to get user from API
          const userData = await authService.getUser()
          console.log("[AUTH] User data received:", userData)
          setUser(userData)
        }
      } catch (error) {
        console.error("[AUTH] Failed to fetch user:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      } finally {
        console.log("[AUTH] Setting isLoading to false")
        setIsLoading(false)
      }
    }

    // Try loading from local storage first for immediate UI update
    const storedUser = localStorage.getItem("user")
    console.log("[AUTH] Stored user in localStorage:", storedUser)
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("[AUTH] Setting user from localStorage:", parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("[AUTH] Failed to parse stored user:", error)
      }
    }

    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    console.log("[AUTH] Login attempt for email:", email)
    try {
      const response = await authService.login({ email, password })
      console.log("[AUTH] Login response:", response)
      
      console.log("[AUTH] Setting user state:", response.user)
      setUser(response.user)
      
      console.log("[AUTH] Storing user in localStorage")
      localStorage.setItem("user", JSON.stringify(response.user))
      localStorage.setItem("token", response.token)
      
      console.log("[AUTH] Login completed successfully")
    } catch (error) {
      console.error("[AUTH] Login failed:", error)
      throw error
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

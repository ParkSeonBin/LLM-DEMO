"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User) => Promise<void> // ✅ login 함수 타입 추가
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkAuthStatus = async () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/login')) {
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('인증 체크 중 에러 발생:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ 로그인 성공 시 호출하여 상태를 즉시 업데이트하는 함수
  const login = async (userData: User) => {
    setIsLoading(true)
    try {
      setUser(userData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/login', { method: 'DELETE' })
    } catch (e) {
      console.error('로그아웃 요청 실패:', e)
    }
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login, // ✅ value에 추가하여 외부(login/page.tsx)에서 사용 가능하게 함
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
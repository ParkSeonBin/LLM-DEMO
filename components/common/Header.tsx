"use client"

import { useState } from 'react'
import { Search, Settings, Bell, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
// 아까 설치한 드롭다운 메뉴 컴포넌트들을 가져옵니다.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // 로그아웃 핸들러 (자바의 Controller 메서드 역할)
  const handleLogout = async () => {
    try {
      // 1. 서버에 로그아웃 요청 (쿠키 삭제)
      const res = await fetch('/api/login', { method: 'DELETE' })
      
      if (res.ok) {
        // 2. 성공 시 로그인 페이지로 강제 이동
        // window.location.href를 쓰면 모든 상태가 초기화되어 안전합니다.
        window.location.href = '/login'
      }
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="flex items-center justify-between mb-6">
      {/* 1. 현재 메뉴 제목 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500">관리자 시스템 / {title}</p>
      </div>

      {/* 2. 오른쪽 유틸리티 영역 */}
      <div className="flex items-center gap-4">
        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="검색어를 입력하세요..."
            className="pl-10 pr-4 py-2 bg-white/50 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005F28]/50 transition-all w-64"
          />
        </div>
        
        {/* 알림 버튼 */}
        <button className="p-2 bg-white/50 border border-white/40 rounded-lg hover:bg-white transition-colors">
          <Bell className="h-4 w-4 text-gray-600" />
        </button>
        
        {/* 설정(로그아웃) 드롭다운 메뉴 */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="p-2 bg-white/50 border border-white/40 rounded-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#005F28]/50">
              <Settings className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-48 mt-2 rounded-xl shadow-xl border-white/40 bg-white/90 backdrop-blur-lg">
            <DropdownMenuLabel className="text-xs font-semibold text-gray-500">계정 설정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* 프로필 정보 (선택 사항) */}
            <DropdownMenuItem className="cursor-pointer py-2 gap-2 text-gray-700">
              <User className="h-4 w-4" />
              <span>내 프로필</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* 로그아웃 버튼 */}
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer py-2 gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// 아이콘들을 주식/데이터 분석에 어울리는 것들로 추가
import { User, Lock, LogIn, Building2, HelpCircle, Sparkles, TrendingUp, BarChart3, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const { login } = useAuth();

  // 1. 컴포넌트 마운트 시 저장된 아이디 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem('saved_login_id')
    if (savedId) {
      setId(savedId)
      setRememberMe(true)
    }
  }, [])

  // 2. 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id, password }),
      })

      if (res.ok) {
        // 아이디 저장 로직
        if (rememberMe) {
          localStorage.setItem('saved_login_id', id)
        } else {
          localStorage.removeItem('saved_login_id')
        }
        
        const data = await res.json();
        console.log(data.user.id);
        const userWithRole = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        };
        
        await login(userWithRole)

        router.replace('/')
      } else {
        const data = await res.json()
        setError(data.error || '로그인 실패')
      }
    } catch (err) {
      setError("서버와 통신 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc]">
      {/* 배경 장식... */}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl h-[80vh] flex-col justify-center gap-10 px-6 lg:flex-row lg:items-center lg:gap-16">
        
        {/* 좌측: 서비스 설명 영역 (주식 분석 컨셉) */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            AI 기반 실시간 주식 데이터 분석 시스템
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
              Stock <span className="block text-[#6B9B4D]">Insight Engine</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              복잡한 시장 데이터를 한눈에 파악하고,<br />
              퀀트 알고리즘으로 정밀한 투자 전략을 수립하세요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[ 
              { icon: TrendingUp, label: "실시간 시세 연동" }, 
              { icon: BarChart3, label: "AI 패턴 분석" } 
            ].map((item) => (
              <div key={item.label} className="flex items-center rounded-2xl border border-white/60 bg-white/85 px-4 py-3 shadow-lg backdrop-blur">
                <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <item.icon className="h-5 w-5 text-[#6B9B4D]" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 로그인 카드 영역 */}
        <div className="flex w-full max-w-md items-center justify-center">
          <div className="w-full flex flex-col rounded-[32px] border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#005F28] to-[#6B9B4D] shadow-lg">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">시스템 로그인</h2>
              <p className="text-sm text-slate-500">인증된 관리자 계정으로 접속하세요</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">아이디</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="admin@stock-insight.com"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-[#6B9B4D] focus:ring-[#6B9B4D]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-[#6B9B4D] focus:ring-[#6B9B4D]/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#005F28] focus:ring-[#005F28]/20"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer">아이디 저장</label>
              </div>

              {/* 로그인 버튼: 아이콘 + 텍스트 */}
              <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#005F28] hover:bg-[#004d20] py-6 font-semibold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? (
                  "로그인 중..."
                ) : (
                  <>
                    <LogIn className="h-5 w-5" /> 
                    <span>로그인</span>
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-xs uppercase text-slate-400">
                <span className="bg-white px-3">외부 연동</span>
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-xl border-slate-200 py-6 text-slate-700 hover:bg-slate-50 gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              Enterprise SSO
            </Button>

            {/* 좌측 정렬된 문의하기 버튼 */}
            <div className="mt-6 flex justify-start">
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="group flex items-center gap-2 text-sm text-slate-500 hover:text-[#005F28] transition-colors">
                    <HelpCircle className="h-4 w-4 text-slate-400 group-hover:text-[#005F28]" />
                    <span>로그인에 문제가 있으신가요?</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-[#005F28]" />
                      시스템 지원 문의
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-sm text-slate-600 space-y-4">
                    <p>계정 잠김 또는 비밀번호 분실 시 담당자에게 문의 바랍니다.</p>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="font-medium text-slate-900">주식 데이터 지원팀</p>
                      <p className="mt-1">Email: support@stock-insight.com</p>
                      <p>내선번호: 02-1234-5678</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
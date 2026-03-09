"use client"

import { useState, useRef } from 'react'
import { 
  TrendingUp, TrendingDown, Home, MessageSquare, FileUp, 
  User, LogOut, ChevronDown, Settings,
  LineChart, Clock, Users, ShieldCheck
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatCard } from '@/components/common/StatCard'
import { AiAssistant } from '@/components/common/AiAssistant'
import { FileManager } from '@/components/common/FileManager'
import { UsrMngListener } from '@/components/common/UsrMngListener';
import { PwdMngListener } from '@/components/common/PwdMngListener';
import { useAuth } from "@/lib/auth-context"

export default function MainPage() {
  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState('home')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // [수정] Auth Context에서 사용자 정보 가져오기
  const { user, logout } = useAuth(); 
  
  // [수정] 새로운 DDL 필드명 매핑 (user.name은 api/auth에서 반환하는 usr_nm_ko 값)
  const userName = user?.name || "사용자";
  const userEmail = user?.email || "";

  // 2. 통계 데이터 (기존 유지)
  const statsData = [
    { title: "데이터 처리량", value: "2.4TB", description: "실시간 로그", icon: TrendingUp, trend: { value: 15, isUp: true } },
    { title: "분석 종목 수", value: "1,284", description: "코스피/코스닥", icon: LineChart, trend: { value: 8, isUp: true } },
    { title: "평균 응답속도", value: "0.4s", description: "초저지연 서버", icon: Clock, trend: { value: 12, isUp: true } },
    { title: "활성 세션", value: "156", description: "실시간 사용자", icon: Users, trend: { value: 4, isUp: false } },
  ]

  const filteredAnalysisData = [
    { id: "STK-1", ticker: "NVDA", name: "엔비디아", market: "NASDAQ", score: 92, status: "강력 매수", lastAnalyzed: "2026-02-27", indicators: { rsi: 65, per: 42.5 }, trend: "상승" },
    { id: "STK-2", ticker: "005930", name: "삼성전자", market: "KOSPI", score: 78, status: "매수", lastAnalyzed: "2026-02-27", indicators: { rsi: 48, per: 15.2 }, trend: "보합" },
    { id: "STK-3", ticker: "TSLA", name: "테슬라", market: "NASDAQ", score: 54, status: "관망", lastAnalyzed: "2026-02-26", indicators: { rsi: 32, per: 68.1 }, trend: "하락" },
    { id: "STK-4", ticker: "AAPL", name: "애플", market: "NASDAQ", score: 85, status: "매수", lastAnalyzed: "2026-02-27", indicators: { rsi: 55, per: 28.4 }, trend: "상승" },
    { id: "STK-5", ticker: "000660", name: "SK하이닉스", market: "KOSPI", score: 88, status: "강력 매수", lastAnalyzed: "2026-02-27", indicators: { rsi: 62, per: 12.8 }, trend: "상승" },
  ];

  // 3. 핸들러 함수
  const handleLogout = async () => {
    try {
      await fetch('/api/login', { method: 'DELETE' });
      if (logout) await logout(); // 클라이언트 세션 초기화
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] relative flex flex-col overflow-hidden text-slate-900">
      <UsrMngListener />
      <PwdMngListener />

      {/* --- [HEADER] --- */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 pb-2 bg-gradient-to-b from-[#f8fafc]/80 to-transparent backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-6">
          <nav className="relative bg-white/40 backdrop-blur-xl border border-white/40 rounded-full px-6 py-2.5 shadow-2xl flex items-center justify-between">
            
            {/* [LEFT] 로고 영역 */}
            <div className="flex items-center space-x-4 shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="bg-[#005F28] p-1.5 rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-900 font-bold text-lg tracking-tight">Stock Insight</span>
            </div>

            {/* [RIGHT] 네비게이션 + 사용자 정보 통합 영역 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 mr-2">
                <NavButton isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} label="대시보드" icon={<Home className="w-3.5 h-3.5" />} />
                <NavButton isActive={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} label="AI 분석" icon={<MessageSquare className="w-3.5 h-3.5" />} />
                <NavButton isActive={activeTab === 'financial-docs'} onClick={() => setActiveTab('financial-docs')} label="데이터 관리" icon={<FileUp className="w-3.5 h-3.5" />} />
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              {/* [수정] 사용자 드롭다운 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full pl-2 pr-4 py-1.5 h-10 flex items-center gap-2 bg-white/50 hover:bg-white/80 border border-white/60 transition-all shadow-sm group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#005F28] to-[#6B9B4D] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform font-bold text-[10px]">
                      {userName.substring(0, 1)}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-xs font-bold text-slate-700">{userName}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56 rounded-2xl mt-2 p-2 bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl">
                  <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">내 계정 정보</p>
                    <p className="text-xs font-bold text-slate-800">{userName}</p>
                    {userEmail && <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 mx-2" />
                  <DropdownMenuItem className="rounded-xl cursor-pointer py-2 text-slate-600 focus:bg-slate-50 transition-colors">
                    <Settings className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-xs font-medium">환경 설정</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100 mx-2" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="rounded-xl cursor-pointer py-2 text-red-500 focus:bg-red-50 focus:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.xlsx,.xls" />

      {/* --- [MAIN CONTENT] --- */}
      <main className="flex-1 pt-28 pb-10 h-screen overflow-hidden flex flex-col items-center"> 
        <div className="w-full max-w-7xl mx-auto px-6 h-full flex flex-col">
          
          {activeTab === 'home' && (
            <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                {statsData.map((stat, i) => <StatCard key={i} {...stat} />)}
              </div>
              
              <div className="flex-1 min-h-0 pb-4">
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[40px] p-8 shadow-xl h-full flex flex-col overflow-hidden">
                  <div className="mb-6 px-2 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                      <LineChart className="h-6 w-6 text-[#005F28]" />
                      AI 종목 분석 현황
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">알고리즘이 실시간으로 분석한 시장 지표입니다.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredAnalysisData.map((stock) => (
                        <div key={stock.id} className="group bg-white/80 p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center font-bold text-[#005F28] shadow-inner">
                                {stock.ticker[0]}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-[#005F28] transition-colors">{stock.name}</h4>
                                <p className="text-xs text-slate-400 font-medium">{stock.ticker} · {stock.market}</p>
                              </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                              stock.status === '강력 매수' ? 'bg-red-50 text-red-600 border border-red-100' : 
                              stock.status === '매수' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {stock.status}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {[ { label: 'Score', val: `${stock.score}점` }, { label: 'RSI', val: stock.indicators.rsi }, { label: 'PER', val: stock.indicators.per } ].map((item, idx) => (
                              <div key={idx} className="bg-slate-50/50 rounded-2xl p-3 text-center border border-slate-50">
                                <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">{item.label}</p>
                                <p className="text-sm font-extrabold text-slate-700">{item.val}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                            <span className="text-[11px] text-slate-400 font-medium">Last: {stock.lastAnalyzed}</span>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                              {stock.trend === "상승" ? <TrendingUp className="w-3.5 h-3.5 text-red-500" /> : <TrendingDown className="w-3.5 h-3.5 text-blue-500" />}
                              <span className={`text-[11px] font-black ${stock.trend === "상승" ? "text-red-500" : "text-blue-500"}`}>{stock.trend}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden pb-4">
              <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[40px] shadow-xl overflow-hidden flex flex-col">
                <AiAssistant />
              </div>
            </div>
          )}

          {activeTab === 'financial-docs' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-4">
              <FileManager userName={userName} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function NavButton({ isActive, onClick, label, icon }: { isActive: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 transform ${
        isActive 
        ? 'bg-[#005F28] text-white shadow-[#005F28]/30 shadow-lg scale-105' 
        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
import { useState } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react' // Loader2 추가

export function AiAssistant() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false) // 로딩 상태 추가 (자바의 '처리 중' 플래그)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '무엇을 도와드릴까요? 주가 분석이나 데이터 검색이 가능합니다.' }
  ])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    // 1. 사용자 메시지 화면에 즉시 추가
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setIsLoading(true)

    try {
      // 2. 백엔드 API 호출 (자바의 RestTemplate.post와 유사)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || '서버 응답 오류')

      // 3. AI 응답을 화면에 추가
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])

    } catch (error: any) {
      console.error("통신 에러:", error)
      setMessages(prev => [...prev, { role: 'assistant', content: `에러가 발생했습니다: ${error.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 1. 메시지 출력창 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
              m.role === 'user' ? 'bg-[#005F28] text-white' : 'bg-white text-gray-800 border'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] font-bold uppercase">{m.role}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {/* 로딩 표시 (AI가 생각 중일 때) */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/50 p-3 rounded-xl border border-dashed border-gray-300 animate-pulse">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Loader2 size={14} className="animate-spin" />
                <span>에이전트가 생각 중입니다...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 입력창 영역 */}
      <div className="p-4 bg-white/60 border-t border-white/40">
        <div className="relative flex items-center">
          <input 
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLoading ? "답변을 기다리는 중..." : "에이전트에게 질문하기..."}
            className="w-full p-3 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#005F28]/50 bg-white/80 disabled:bg-gray-100"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 p-1.5 bg-[#005F28] text-white rounded-md hover:bg-[#004d20] transition-colors disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
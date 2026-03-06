'use client';

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, Trash2, Plus } from 'lucide-react'

const STORAGE_KEY = 'ai_chat_sessions';

export function AiAssistant() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      else createNewChat();
    } else {
      createNewChat();
    }
  }, []);

  // 2. 세션 저장 및 자동 스크롤
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions]);

  const createNewChat = () => {
    const newSession = {
      id: Date.now().toString(),
      title: "새로운 대화",
      messages: [{ role: 'assistant', content: '무엇을 도와드릴까요? 주가 분석이나 데이터 검색이 가능합니다.' }]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (filtered.length === 0) createNewChat();
    else if (currentSessionId === id) setCurrentSessionId(filtered[0].id);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage = input.trim();
    const sessionId = currentSessionId;

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          title: s.messages.length <= 1 ? userMessage.slice(0, 10) : s.title,
          messages: [...s.messages, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }]
        };
      }
      return s;
    }));

    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);

        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const newMessages = [...s.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = { ...lastMsg, content: lastMsg.content + chunk };
            return { ...s, messages: newMessages };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-row h-full bg-transparent overflow-hidden">
      
      {/* --- 왼쪽: 채팅 목록 리스트 --- */}
      <div className="w-[280px] border-r border-white/40 bg-white/20 flex flex-col">
        <div className="p-4 border-b border-white/20">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white/50 hover:bg-white/80 border border-white/60 rounded-xl text-sm font-bold text-slate-700 transition-all"
          >
            <Plus size={16} /> 새 대화 시작
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {sessions.map((s) => (
            <div 
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                currentSessionId === s.id ? 'bg-[#005F28] text-white shadow-md' : 'hover:bg-white/40 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={currentSessionId === s.id ? 'text-white' : 'text-slate-400'} />
                <span className="text-xs font-medium truncate">{s.title}</span>
              </div>
              <button 
                onClick={(e) => deleteChat(e, s.id)}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all ${currentSessionId === s.id ? 'text-white/70' : 'text-slate-400'}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- 오른쪽: 기존 채팅창 영역 --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 1. 메시지 출력창 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.map((m: any, i: number) => (
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
          {/* 로딩 표시 */}
          {isLoading && messages[messages.length - 1]?.content === '' && (
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

    </div>
  )
}
'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export const PwdMngListener = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const [form, setForm] = useState({ newPwd: '', confirmPwd: '' });
  const [showPwd, setShowPwd] = useState({ new: false, confirm: false });

  // 1. 유효성 검사 및 우선순위 메시지 도출
  const validationStatus = useMemo(() => {
    const { newPwd, confirmPwd } = form;
    if (!newPwd) return { message: '새 비밀번호를 입력해주세요.', isValid: false, type: 'info' };

    // 우선순위 순서대로 체크
    if (newPwd.length < 8) 
      return { message: '최소 8자 이상 입력이 필요합니다.', isValid: false };
    
    const combinationCount = [/[A-Z]/.test(newPwd), /[a-z]/.test(newPwd), /[0-9]/.test(newPwd), /[!@#$%^&*(),.?":{}|<>]/.test(newPwd)].filter(Boolean).length;
    if (combinationCount < 3) 
      return { message: '영문 대/소문자, 숫자, 특수문자 중 3개 이상 조합하세요.', isValid: false };

    if (newPwd === currentUser?.id) 
      return { message: '계정명과 동일한 비밀번호는 사용할 수 없습니다.', isValid: false };

    if (['1234', 'abcd', 'asdf', 'qwerty'].some(p => newPwd.toLowerCase().includes(p))) 
      return { message: '추측하기 쉬운 연속된 문자열이 포함되어 있습니다.', isValid: false };

    if (/(\w)\1\1\1/.test(newPwd)) 
      return { message: '동일한 문자를 4회 이상 반복할 수 없습니다.', isValid: false };

    // 새 비밀번호 자체는 통과한 상태
    if (!confirmPwd) 
      return { message: '비밀번호 확인을 위해 한 번 더 입력해주세요.', isValid: false, type: 'info' };

    if (newPwd !== confirmPwd) 
      return { message: '비밀번호가 일치하지 않습니다.', isValid: false };

    // 모든 조건 충족
    return { message: '안전한 비밀번호입니다. 변경 가능합니다.', isValid: true, type: 'success' };
  }, [form, currentUser?.id]);

  const { message, isValid, type } = validationStatus;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usr_id: currentUser?.id,
          new_pwd: form.newPwd
        }),
      });

      if (res.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다.");
        setIsOpen(false);
        setForm({ newPwd: '', confirmPwd: '' });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "변경에 실패했습니다.");
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[28px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* 헤더 */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold">비밀번호 변경</h2>
              <p className="text-[10px] text-slate-400 font-mono">User: {currentUser?.id}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 폼 영역 */}
        <div className="p-8 space-y-6">
          {/* 새 비밀번호 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">새 비밀번호</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPwd.new ? "text" : "password"}
                name="newPwd"
                value={form.newPwd}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                  form.newPwd && !isValid && message.includes('조합') || message.includes('8자') 
                  ? 'border-orange-400 focus:ring-orange-100' 
                  : 'border-slate-200 focus:ring-blue-100'
                }`}
                placeholder="비밀번호 입력"
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">새 비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPwd.confirm ? "text" : "password"}
                name="confirmPwd"
                value={form.confirmPwd}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                  form.confirmPwd && (isValid ? 'border-emerald-500 focus:ring-emerald-100' : 'border-rose-400 focus:ring-rose-100')
                }`}
                placeholder="다시 한번 입력"
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 실시간 단일 가이드 메시지 영역 */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
            type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-700' :
            'bg-orange-50 border-orange-100 text-orange-700'
          }`}>
            {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span className="text-[11px] font-medium">{message}</span>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="px-8 py-6 bg-slate-50 flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            className="flex-1 rounded-xl h-11 text-slate-600 font-bold border-slate-200 hover:bg-white"
          >
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !isValid}
            className={`flex-1 rounded-xl h-11 font-bold shadow-lg transition-all active:scale-95 ${
              isValid 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </div>
      </div>
    </div>
  );
};
'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ShieldCheck, Save, Trash2, RefreshCcw, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

// 샘플 데이터 정의
const DEPARTMENTS = [
  { cd: 'D01', nm: 'IT전략팀' },
  { cd: 'D02', nm: '인사총무팀' },
  { cd: 'D03', nm: '영업기획팀' },
  { cd: 'D04', nm: '재무회계팀' },
  { cd: 'D05', nm: '데이터분석팀' },
];

const POSITIONS = [
  { cd: 'P01', nm: '사원' },
  { cd: 'P02', nm: '대리' },
  { cd: 'P03', nm: '과장' },
  { cd: 'P04', nm: '차장' },
  { cd: 'P05', nm: '부장' },
];

interface UserData {
  usr_sid?: number;
  usr_id: string;
  usr_pwd: string;
  usr_email: string;
  usr_nm_ko: string;
  usr_nm_en: string | null;
  status: string;
  dept_cd: string | null;
  dept_nm: string | null;
  position_cd: string | null;
  position_nm: string | null;
  employ_no: string | null;
  mobile_no: string | null;
  create_dtm?: string;
  create_usr_id?: string;
  update_dtm?: string;
  update_usr_id?: string;
}

export const EasterEggListener = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [originalUsers, setOriginalUsers] = useState<UserData[]>([]); // [추가] 변경 감지용 원본 데이터
  const [loading, setLoading] = useState(false);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
      // 깊은 복사를 통해 원본 데이터 보관
      setOriginalUsers(JSON.parse(JSON.stringify(data)));
      setDeletedIds([]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        setIsOpen(true);
        fetchUsers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchUsers]);

  // 특정 필드가 원본과 다른지 확인하는 함수
  const isFieldChanged = (index: number, field: keyof UserData, value: any) => {
    const originalRow = originalUsers[index];
    if (!originalRow) return true; // 신규 추가된 행은 무조건 변경으로 간주
    return originalRow[field] !== value;
  };

  const handleAddRow = () => {
    const newUser: UserData = {
      usr_id: '', 
      usr_pwd: 'pwd',
      usr_email: '', usr_nm_ko: '', usr_nm_en: '',
      status: 'ACTIVE', 
      dept_cd: DEPARTMENTS[0].cd, dept_nm: DEPARTMENTS[0].nm, 
      position_cd: POSITIONS[0].cd, position_nm: POSITIONS[0].nm,
      employ_no: '', mobile_no: '',
    };
    setUsers([newUser, ...users]);
    // 원본 배열에도 빈 자리를 만들어 인덱스 싱크를 맞춤
    setOriginalUsers([null as any, ...originalUsers]);
  };

  const handleInputChange = (index: number, field: keyof UserData, value: string) => {
    const updatedUsers = [...users];
    
    if (field === 'dept_nm') {
      const dept = DEPARTMENTS.find(d => d.nm === value);
      updatedUsers[index] = { ...updatedUsers[index], dept_nm: value, dept_cd: dept?.cd || '' };
    } else if (field === 'position_nm') {
      const pos = POSITIONS.find(p => p.nm === value);
      updatedUsers[index] = { ...updatedUsers[index], position_nm: value, position_cd: pos?.cd || '' };
    } else {
      updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    }

    updatedUsers[index].update_usr_id = currentUser?.id;
    setUsers(updatedUsers);
  };

  const handleSave = async () => {
    // 1. 중복 검사 로직 추가
    const idSet = new Set();
    const emailSet = new Set();

    for (const u of users) {
      if (!u.usr_id || !u.usr_email) {
        alert("ID와 이메일은 필수 입력 항목입니다.");
        return;
      }
      if (idSet.has(u.usr_id)) {
        alert(`중복된 ID가 리스트에 존재합니다: ${u.usr_id}`);
        return;
      }
      if (emailSet.has(u.usr_email)) {
        alert(`중복된 이메일이 리스트에 존재합니다: ${u.usr_email}`);
        return;
      }
      idSet.add(u.usr_id);
      emailSet.add(u.usr_email);
    }
    
    if (!confirm("변경사항을 저장하시겠습니까?")) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, deletedIds, adminId: currentUser?.id }),
      });
      if (res.ok) {
        alert("성공적으로 저장되었습니다.");
        fetchUsers();
      }
    } catch (err) { alert("저장 실패"); }
  };

  const handleDelete = (index: number) => {
    const target = users[index];

    // [추가] 본인 계정 삭제 방지 로직
    if (target.usr_id === currentUser?.id) {
      alert("현재 로그인된 관리자 본인의 계정은 삭제할 수 없습니다.");
      return;
    }

    if (!confirm("이 행을 삭제하시겠습니까? (저장 시 최종 반영)")) return;
    
    if (target.usr_sid) {
      setDeletedIds(prev => [...prev, target.usr_sid!]);
    }
    
    setUsers(users.filter((_, i) => i !== index));
    setOriginalUsers(originalUsers.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[85vh] bg-white border border-white/80 shadow-2xl rounded-[32px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between bg-[#005F28] px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h2 className="text-base font-bold text-white">User Master Management</h2>
              <p className="text-[10px] text-white/60 font-mono italic">DB: TB_CO_USR_M</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={fetchUsers} className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors text-white">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 컨트롤 바 */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div className="flex gap-2">
            <Button onClick={handleAddRow} size="sm" className="bg-[#005F28] hover:bg-[#004b1f] text-white rounded-lg text-[11px] font-bold gap-1.5 h-8">
              <UserPlus size={13} /> 추가
            </Button>
            <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold gap-1.5 h-8">
              <Save size={13} /> 저장
            </Button>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Active Session: <span className="text-[#005F28] font-bold">{currentUser?.id}</span>
          </div>
        </div>

        {/* 그리드 영역 */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50/30">
          <div className="h-full border border-slate-200 rounded-xl bg-white shadow-sm overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 border-b sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] w-[120px]">ID (고정)</th>
                  <th className="px-4 py-3 border-b">이름(KO)</th>
                  <th className="px-4 py-3 border-b">이메일</th>
                  <th className="px-4 py-3 border-b w-[140px] min-w-[140px]">상태</th>
                  <th className="px-4 py-3 border-b w-[160px] min-w-[160px]">부서명</th>
                  <th className="px-4 py-3 border-b w-[120px] min-w-[120px]">직급</th>
                  <th className="px-4 py-3 border-b">사번</th>
                  <th className="px-4 py-3 border-b">연락처</th>
                  <th className="px-4 py-3 border-b text-center sticky right-0 bg-slate-50 z-30 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">작업</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-slate-100">
                {users.map((u, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-3 py-1.5 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <input 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none ${u.usr_sid ? 'text-slate-400' : 'text-blue-600 font-bold'}`}
                        value={u.usr_id} 
                        readOnly={!!u.usr_sid}
                        onChange={(e) => handleInputChange(index, 'usr_id', e.target.value)}
                        placeholder="아이디 입력"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none ${isFieldChanged(index, 'usr_nm_ko', u.usr_nm_ko) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.usr_nm_ko} 
                        onChange={(e) => handleInputChange(index, 'usr_nm_ko', e.target.value)} 
                        placeholder="성함" 
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none font-mono ${isFieldChanged(index, 'usr_email', u.usr_email) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.usr_email} 
                        onChange={(e) => handleInputChange(index, 'usr_email', e.target.value)} 
                        placeholder="example@email.com" 
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none cursor-pointer font-bold ${isFieldChanged(index, 'status', u.status) ? 'text-sky-500' : 'text-slate-700'}`} 
                        value={u.status} 
                        onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                      >
                        <option value="ACTIVE">✅ ACTIVE</option>
                        <option value="LOCK">🔒 LOCK</option>
                        <option value="LEAVE">🚪 LEAVE</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none cursor-pointer ${isFieldChanged(index, 'dept_nm', u.dept_nm) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.dept_nm || ''} 
                        onChange={(e) => handleInputChange(index, 'dept_nm', e.target.value)}
                      >
                        {DEPARTMENTS.map(dept => <option key={dept.cd} value={dept.nm}>{dept.nm}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none cursor-pointer ${isFieldChanged(index, 'position_nm', u.position_nm) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.position_nm || ''} 
                        onChange={(e) => handleInputChange(index, 'position_nm', e.target.value)}
                      >
                        {POSITIONS.map(pos => <option key={pos.cd} value={pos.nm}>{pos.nm}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none ${isFieldChanged(index, 'employ_no', u.employ_no) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.employ_no || ''} 
                        onChange={(e) => handleInputChange(index, 'employ_no', e.target.value)} 
                        placeholder="사번" 
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input 
                        className={`w-full p-1 rounded border-none focus:ring-1 focus:ring-[#005F28] bg-transparent outline-none ${isFieldChanged(index, 'mobile_no', u.mobile_no) ? 'text-sky-500 font-bold' : ''}`} 
                        value={u.mobile_no || ''} 
                        onChange={(e) => handleInputChange(index, 'mobile_no', e.target.value)} 
                        placeholder="010-0000-0000" 
                      />
                    </td>
                    <td className="px-3 py-1.5 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
                      <button 
                        onClick={() => handleDelete(index)} 
                        disabled={u.usr_id === currentUser?.id}
                        className={`p-2 rounded-lg transition-all active:scale-90 ${u.usr_id === currentUser?.id ? 'text-slate-200 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-emerald-600 w-3.5 h-3.5" />
            <span className="text-[10px] text-emerald-800 font-medium leading-relaxed">
              하늘색(<span className="text-sky-500 font-bold">Skyblue</span>)으로 표시된 항목은 아직 저장되지 않은 수정본입니다. 
              본인 계정은 삭제할 수 없습니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
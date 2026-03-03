'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, Plus, FileText, MoreVertical, EyeOff, Trash2, Edit3, 
  Search, FileType, Calendar, User as UserIcon, Loader2, FileQuestion,
  Check, X
} from 'lucide-react';

interface FileDetail {
  id: number;
  file_name: string;
  stored_path: string;
  file_type: string;
  file_size: string | number;
  regNm: string;
  regDt: string;
  url?: string;
}

export function FileManager({ userName }: { userName: string }) {
  const [files, setFiles] = useState<FileDetail[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editFileName, setEditFileName] = useState("");
  const [editStoredPath, setEditStoredPath] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
  if (selectedFile) {
    setEditFileName(selectedFile.file_name);
    // [수정] 단순히 경로를 복사하지 않고, 파일명 변경 로직이 필요하면 여기에 작성
    setEditStoredPath(selectedFile.stored_path);
  }
  }, [selectedFile, isEditing]);

  // --- [추가] 파일명 변경 시 저장 경로도 함께 바꾸는 로직 ---
  useEffect(() => {
  if (isEditing && selectedFile) {
    const oldPath = selectedFile.stored_path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = editFileName; // 마지막 요소(파일명) 교체
    setEditStoredPath(pathParts.join('/'));
  }
  }, [editFileName, isEditing]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      const result = await response.json();
      if (result.success) {
        const mappedFiles = result.list.map((f: any) => ({
          ...f,
          url: f.stored_path,
          file_size: typeof f.file_size === 'number' 
            ? (f.file_size / 1024 / 1024).toFixed(2) + ' MB' 
            : f.file_size
        }));
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- [추가] 업로드 직후 자동 실행될 분석 함수 ---
  const handleAnalyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    console.log(`[분석 시작] ${file.name}`);

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        console.log('분석 완료:', result.data);
      } else {
        console.error('분석 실패:', result.error);
      }
    } catch (error) {
      console.error('분석 API 호출 에러:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('regNm', userName);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        const newFile: FileDetail = {
          id: result.id,
          file_name: file.name,
          stored_path: result.storedPath,
          file_type: file.name.split('.').pop()?.toLowerCase() || '',
          file_size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          regNm: userName,
          regDt: new Date().toISOString().replace('T', ' ').split('.')[0],
          url: result.storedPath,
        };
        setFiles((prev) => [newFile, ...prev]);
        setSelectedFile(newFile);

        handleAnalyzeFile(file);
      }
    } catch (error) {
      alert("업로드 실패");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedFile) return;
    try {
        const response = await fetch('/api/files/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: selectedFile.id,
            oldStoredPath: selectedFile.stored_path, // [추가] 이전 경로 전달
            newFileName: editFileName,
            newStoredPath: editStoredPath
        }),
        });

        if (response.ok) {
        const updatedFile = {
            ...selectedFile,
            file_name: editFileName,
            stored_path: editStoredPath,
            url: editStoredPath
        };
        setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
        setSelectedFile(updatedFile);
        setIsEditing(false);
        alert("파일 정보와 실제 파일명이 변경되었습니다.");
        }
    } catch (error) {
        alert("수정 실패");
    }
    };

  const handleDeleteFile = async () => {
    if (!selectedFile || !confirm(`${selectedFile.file_name}을(를) 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFile.id,
          storedPath: selectedFile.stored_path
        }),
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== selectedFile.id));
        setSelectedFile(null);
      }
    } catch (error) {
      alert("삭제 실패");
    }
  };

  const filteredFiles = files.filter(f => 
    f.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[40px] shadow-xl overflow-hidden flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.xlsx,.xls,.csv" />

      {/* 상단 액션 바 */}
      <div className="p-8 pb-6 flex items-center justify-between border-b border-white/40 bg-white/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#005F28] rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="w-6 h-6 text-white" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">재무 데이터 보관함</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">파일 관리 및 미리보기</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="파일명 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white/50 border border-white/80 rounded-xl text-sm w-64" />
          </div>
          <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-[#005F28] hover:bg-[#004d20] disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 text-sm font-bold">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
            {isUploading ? "업로드 중..." : "새 파일 업로드"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 좌측: 파일 리스트 */}
        <div className="w-[380px] border-r border-white/40 flex flex-col bg-white/20">
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#005F28]" /></div> :
             filteredFiles.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><FileQuestion size={48} className="mb-4" /></div> :
             filteredFiles.map((file) => (
              <div key={file.id} onClick={() => { setSelectedFile(file); setIsEditing(false); }} className={`group p-4 rounded-[24px] border transition-all cursor-pointer ${selectedFile?.id === file.id ? 'bg-white border-[#005F28]/30 shadow-xl' : 'bg-white/40 border-transparent hover:bg-white/80'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${selectedFile?.id === file.id ? 'bg-[#005F28] text-white' : 'bg-slate-100 text-slate-400'}`}><FileText size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selectedFile?.id === file.id ? 'text-slate-900' : 'text-slate-700'}`}>{file.file_name}</p>
                    <div className="flex items-center gap-3 mt-1.5"><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{file.file_type}</span><span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Calendar size={10} /> {file.regDt.split(' ')[0]}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 미리보기 및 상세 */}
        <div className="flex-1 flex flex-col bg-slate-50/30 relative">
          {selectedFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 py-5 border-b border-white flex justify-between items-center bg-white/40 backdrop-blur-md">
                <div className="flex flex-col flex-1 min-w-0"> {/* --- [수정] 너비 유연성 확보 --- */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#005F28] uppercase tracking-widest">Document Insight</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><UserIcon size={10} /> {selectedFile.regNm}</span>
                  </div>
                  
                  {/* --- [수정] 편집 모드: 이름 입력 박스 너비 증가 --- */}
                  {isEditing ? (
                    <input type="text" value={editFileName} onChange={(e) => setEditFileName(e.target.value)} className="text-base font-bold text-slate-800 mt-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 w-full" />
                  ) : (
                    <h4 className="text-base font-bold text-slate-800 mt-1 truncate">{selectedFile.file_name}</h4>
                  )}
                </div>
                
                {/* 편집/삭제 버튼 UI */}
                <div className="flex gap-2 ml-4 flex-shrink-0"> {/* --- [수정] 버튼 그룹 고정 --- */}
                  {isEditing ? (
                    <>
                      <button onClick={handleSaveEdit} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-sm">
                        <Check size={14}/> 저장
                      </button>
                      <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all shadow-sm">
                        <X size={14}/> 취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <Edit3 size={14}/> 편집
                      </button>
                      <button onClick={handleDeleteFile} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold hover:bg-red-100 transition-all shadow-sm">
                        <Trash2 size={14}/> 삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 미리보기 컨텐츠 */}
              <div className="flex-1 p-8 overflow-hidden flex flex-col">
                <div className="flex-1 bg-white shadow-2xl rounded-[32px] border border-slate-200/60 overflow-hidden relative">
                  
                  {selectedFile.file_type === 'pdf' ? (
                    <iframe src={selectedFile.url} className="w-full h-full border-none" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mb-6"><FileType size={32} /></div>
                      <h5 className="text-xl font-bold text-slate-800">엑셀/기타 데이터 파일</h5>
                      <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-md text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">저장 경로</p>
                        <code className="text-xs text-[#005F28] break-all">{selectedFile.stored_path}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-12"><EyeOff size={40} className="mb-4" /><h4 className="text-xl font-bold text-slate-800">선택된 문서 없음</h4></div>
          )}
        </div>
      </div>
    </div>
  );
}
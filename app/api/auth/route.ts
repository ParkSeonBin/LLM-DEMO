import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    // 토큰 검증 및 페이로드 반환
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return NextResponse.json({
      id: decoded.id,      
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles || ['USER'] // 원본에서 roles는 필수 배열
    })
   } catch (err: any) {
  console.error("❌ JWT 검증 실패 상세 원인:", err.message); 
  
  return NextResponse.json({ 
    message: 'Invalid token', 
    error: err.message // 브라우저에서도 에러 내용을 볼 수 있게 추가
  }, { status: 401 })
}
}
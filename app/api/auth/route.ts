import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 토큰 검증 및 페이로드 추출
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    
    // 2. 새로운 테이블 구조(usr_id, usr_nm_ko 등)에 맞춰 반환 필드 구성
    // login API의 tokenPayload와 필드명을 동일하게 맞춥니다.
    return NextResponse.json({
      id: decoded.id,       // 토큰에 담긴 usr_id
      email: decoded.email, // 토큰에 담긴 usr_email
      name: decoded.name,   // 토큰에 담긴 usr_nm_ko
      roles: decoded.roles || ['USER'] 
    })
    
  } catch (err: any) {
    console.error("❌ JWT 검증 실패 상세 원인:", err.message); 
    
    return NextResponse.json({ 
      message: 'Invalid token', 
      error: err.message 
    }, { status: 401 })
  }
}
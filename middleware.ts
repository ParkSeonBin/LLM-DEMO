import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// jose 대신 jsonwebtoken을 사용
const jwt = require('jsonwebtoken'); 

// 노드 환경임을 명시하여 jsonwebtoken 라이브러리가 동작하게 합니다.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 쿠키에서 auth_token 추출
  const token = request.cookies.get('auth_token')?.value;

  // 2. 로그인 페이지 접근 제어
  if (pathname === '/login') {
    if (token) {
      try {
        // 토큰이 유효한지 검사
        jwt.verify(token, process.env.JWT_SECRET || 'inspire-framework-jwt-secret-key-2024');
        return NextResponse.redirect(new URL('/', request.url));
      } catch (e) {
        // 토큰이 무효하면 쿠키 삭제 후 로그인 페이지 유지
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // 3. 보호된 경로 접근 제어
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // JWT 검증 (자바의 JwtDecoder.decode()와 유사)
    // 여기서 토큰이 만료되었거나 서명이 틀리면 catch로 빠집니다.
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'inspire-framework-jwt-secret-key-2024'
    );

    // 성공 시 다음 단계로 진행
    const response = NextResponse.next();
    
    // (선택 사항) 서버 컴포넌트에서 유저 정보를 쉽게 쓰도록 헤더에 주입
    // response.headers.set('x-user-id', decoded.userId);
    
    return response;
  } catch (error) {
    console.error('❌ 미들웨어 토큰 검증 실패:', error);
    // 검증 실패 시 쿠키 삭제 후 로그인 페이지로 강제 리다이렉트
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth_token');
    return response;
  }
}

// 4. 미들웨어 적용 경로 설정 (로그인, 정적 파일 제외)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
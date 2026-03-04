import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    const pool = await getDbPool();

    // 1. 확정된 테이블 TB_CO_USR_M에서 데이터 조회
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT 
          usr_id, 
          usr_email, 
          usr_pwd, 
          usr_nm_ko, 
          status 
        FROM TB_CO_USR_M 
        WHERE usr_id = @userId
      `);

    const user = result.recordset[0];

    // 2. 인증 및 상태 검증
    if (!user || user.usr_pwd !== password) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 관리자에게 문의하세요.' }, 
        { status: 403 }
      );
    }

    // 3. JWT 토큰 생성 (Payload 구성)
    const tokenPayload = {
      id: user.usr_id,
      email: user.usr_email,
      name: user.usr_nm_ko,
      // 필요한 경우 roles: ['USER'] 등을 추가할 수 있습니다.
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // 4. 응답 생성 및 쿠키 설정
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.usr_id,
        email: user.usr_email,
        name: user.usr_nm_ko
      }
    });

    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24시간
      path: '/',
    });

    // 5. [수정] last_login_dtm이 없으므로 대신 update_dtm을 갱신하거나, 
    // 로깅이 필요 없다면 이 부분을 생략합니다. 
    // 현재 DDL 기준으로는 로그 기록용 컬럼이 없으므로 업데이트를 생략합니다.

    return response;
  } catch (error) {
    console.error('Login Server Error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 서버 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // 쿠키 삭제
  response.cookies.set('auth_token', '', { 
    path: '/', 
    maxAge: 0 
  });
  
  return response;
}
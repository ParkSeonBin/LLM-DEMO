import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    // 2. 사용자 존재 여부 확인
    if (!user) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 
        { status: 401 }
      );
    }

    // 3. [수정] bcrypt 비밀번호 검증
    // DB의 암호화된 값(user.usr_pwd)과 입력값(password)을 비교합니다.
    const isPasswordMatch = await bcrypt.compare(password, user.usr_pwd);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 
        { status: 401 }
      );
    }

    // 4. 상태 검증 (ACTIVE 여부)
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 관리자에게 문의하세요.' }, 
        { status: 403 }
      );
    }

    // 5. JWT 토큰 생성 (Payload 구성)
    const tokenPayload = {
      id: user.usr_id,
      email: user.usr_email,
      name: user.usr_nm_ko,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // 6. 응답 생성 및 쿠키 설정
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
  
  response.cookies.set('auth_token', '', { 
    path: '/', 
    maxAge: 0 
  });
  
  return response;
}
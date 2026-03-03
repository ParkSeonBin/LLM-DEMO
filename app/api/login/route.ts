import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const pool = await getDbPool();
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM TB_CO_USR WHERE email = @email');

    const user = result.recordset[0];

    if (!user || user.pwd !== password) {
      return NextResponse.json({ error: '인증 정보가 올바르지 않습니다.' }, { status: 401 });
    }

    // 2. JWT 토큰 생성 (Payload 설정)
    // 유저 정보를 객체에
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      // role: user.role || 'USER' // 필요시 추가
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret', // 비밀키
      { expiresIn: '24h' } // 유효기간 설정
    );

    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

    // 3. 쿠키에 토큰 저장
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  // 쿠키를 즉시 만료시켜서 삭제 (maxAge: 0)
  response.cookies.set('auth_token', '', { 
    path: '/', 
    maxAge: 0 
  });
  
  return response;
}
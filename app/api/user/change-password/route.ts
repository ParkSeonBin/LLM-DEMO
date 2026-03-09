import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // 1. 쿠키에서 토큰 추출 및 검증
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    let usr_id: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      usr_id = decoded.id; 
    } catch (err) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // current_pwd 추출 로직 제거
    const { new_pwd } = await req.json();

    // 2. DB 연결 및 현재 사용자 데이터 조회
    const pool = await getDbPool();
    const userResult = await pool.request()
      .input('usr_id', sql.NVarChar, usr_id)
      .query(`
        SELECT usr_sid, update_dtm 
        FROM master.dbo.TB_CO_USR_M 
        WHERE usr_id = @usr_id
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userData = userResult.recordset[0];

    // 3. 보안 규정 검증 (제15조 패스워드 관리 규정 준수)
    
    // (A) 최소 사용기간 검증 (제15조 3항 - 1일)
    const lastUpdate = new Date(userData.update_dtm);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - lastUpdate.getTime()) / (1000 * 3600);
    if (diffInHours < 24) {
      return NextResponse.json({ error: '패스워드는 변경 후 24시간이 지나야 다시 변경할 수 있습니다.' }, { status: 403 });
    }

    // [제거됨] (B) 현재 비밀번호 일치 확인 (bcrypt 비교 로직 삭제)

    // (C) 복잡도 검사 (제15조 3항 - 3개 조합, 8자 이상)
    const complexityRegex = /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])|(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])|(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])).{8,}$/;
    if (!complexityRegex.test(new_pwd)) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이며 영문 대/소문자, 숫자, 특수문자 중 3개 이상을 조합해야 합니다.' }, { status: 400 });
    }

    // (D) 계정 정보와 동일 여부 확인 (제15조 2항)
    if (new_pwd.includes(usr_id)) {
      return NextResponse.json({ error: '계정명을 포함한 비밀번호는 사용할 수 없습니다.' }, { status: 400 });
    }

    // 4. 새로운 비밀번호 암호화 및 업데이트
    const hashedPwd = await bcrypt.hash(new_pwd, 12);
    
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateRequest = new sql.Request(transaction);
      updateRequest.input('hashedPwd', sql.NVarChar, hashedPwd);
      updateRequest.input('usr_id', sql.NVarChar, usr_id);

      await updateRequest.query(`
        UPDATE master.dbo.TB_CO_USR_M
        SET 
          usr_pwd = @hashedPwd,
          update_dtm = SYSDATETIME(),
          update_usr_id = @usr_id
        WHERE usr_id = @usr_id
      `);

      await transaction.commit();
      return NextResponse.json({ success: true, message: '비밀번호가 안전하게 변경되었습니다.' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error: any) {
    console.error('Password Change Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
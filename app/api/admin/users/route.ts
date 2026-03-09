import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

/**
 * 1. 사용자 전체 목록 조회 (GET)
 */
export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        usr_sid, usr_id, 
        -- usr_pwd,
        usr_email, usr_nm_ko, usr_nm_en,
        status, dept_cd, dept_nm, position_cd, position_nm,
        employ_no, mobile_no, create_dtm, create_usr_id, 
        update_dtm, update_usr_id
      FROM TB_CO_USR_M
      ORDER BY create_dtm DESC
    `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Admin User Fetch Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
}

/**
 * 2. 사용자 일괄 저장 (POST - Insert & Update)
 */
export async function POST(req: NextRequest) {
  try {
    const { users, deletedIds, adminId } = await req.json();
    const pool = await getDbPool();
    
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. 삭제 요청 처리
      if (deletedIds && deletedIds.length > 0) {
        const deleteRequest = new sql.Request(transaction);
        await deleteRequest.query(`
          DELETE FROM TB_CO_USR_M 
          WHERE usr_sid IN (${deletedIds.join(',')})
        `);
      }

      for (const u of users) {
        const request = new sql.Request(transaction);
        
        // 공통 파라미터 바인딩
        request.input('usr_id', sql.NVarChar, u.usr_id);
        request.input('usr_email', sql.NVarChar, u.usr_email);
        request.input('usr_nm_ko', sql.NVarChar, u.usr_nm_ko);
        request.input('usr_nm_en', sql.NVarChar, u.usr_nm_en || null);
        request.input('status', sql.NVarChar, u.status || 'ACTIVE');
        request.input('dept_cd', sql.NVarChar, u.dept_cd || null);
        request.input('dept_nm', sql.NVarChar, u.dept_nm || null);
        request.input('position_cd', sql.NVarChar, u.position_cd || null);
        request.input('position_nm', sql.NVarChar, u.position_nm || null);
        request.input('employ_no', sql.NVarChar, u.employ_no || null);
        request.input('mobile_no', sql.NVarChar, u.mobile_no || null);
        request.input('adminId', sql.NVarChar, adminId);

        if (u.usr_sid) {
          // A. 기존 사용자: UPDATE
          request.input('usr_sid', sql.Int, u.usr_sid);
          
          await request.query(`
            UPDATE TB_CO_USR_M
            SET 
              usr_email = @usr_email,
              usr_nm_ko = @usr_nm_ko,
              usr_nm_en = @usr_nm_en,
              status = @status,
              dept_cd = @dept_cd,
              dept_nm = @dept_nm,
              position_cd = @position_cd,
              position_nm = @position_nm,
              employ_no = @employ_no,
              mobile_no = @mobile_no,
              update_dtm = SYSDATETIME(),
              update_usr_id = @adminId
            WHERE usr_sid = @usr_sid
          `);
        } else {
          // B. 신규 사용자: INSERT (패스워드 암호화 적용)
          const saltRounds = 12;
          const hashedPwd = await bcrypt.hash(u.usr_pwd || 'InitialPassword123!', saltRounds);
          request.input('usr_pwd', sql.NVarChar, hashedPwd);

          await request.query(`
            INSERT INTO TB_CO_USR_M (
              usr_id, usr_pwd, usr_email, usr_nm_ko, usr_nm_en,
              status, dept_cd, dept_nm, position_cd, position_nm,
              employ_no, mobile_no, create_dtm, create_usr_id, update_dtm, update_usr_id
            ) VALUES (
              @usr_id, @usr_pwd, @usr_email, @usr_nm_ko, @usr_nm_en,
              @status, @dept_cd, @dept_nm, @position_cd, @position_nm,
              @employ_no, @mobile_no, SYSDATETIME(), @adminId, SYSDATETIME(), @adminId
            )
          `);
        }
      }

      await transaction.commit();
      return NextResponse.json({ success: true, message: '모든 변경사항이 저장되었습니다.' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Admin User Save Error:', error);
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
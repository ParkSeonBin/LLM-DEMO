// app/api/files/route.ts
import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .query(`
        SELECT 
          id, 
          file_name, 
          stored_path, 
          file_type, 
          file_size, 
          regNm, 
          FORMAT(regDt, 'yyyy-MM-dd HH:mm:ss') as regDt
        FROM dbo.TB_CO_FILE_DTL
        ORDER BY regDt DESC
      `);

    return NextResponse.json({ success: true, list: result.recordset });
  } catch (error) {
    console.error('❌ DB Fetch Error:', error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
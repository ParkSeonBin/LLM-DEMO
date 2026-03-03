import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { id, storedPath } = await req.json();

    if (!id || !storedPath) {
      return NextResponse.json({ error: "필수 데이터가 부족합니다." }, { status: 400 });
    }

    // 1. DB에서 데이터 삭제
    const pool = await getDbPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM dbo.TB_CO_FILE_DTL WHERE id = @id`);

    // 2. 실제 파일 삭제 (storedPath가 /uploads/... 형태라고 가정)
    const filePath = path.join(process.cwd(), 'public', storedPath);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('파일이 로컬에 존재하지 않거나 삭제 실패:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Delete Error:', error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
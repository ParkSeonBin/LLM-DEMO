import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { id, oldStoredPath, newFileName, newStoredPath } = await req.json();

    if (!id || !oldStoredPath || !newFileName || !newStoredPath) {
      return NextResponse.json({ error: "데이터가 부족합니다." }, { status: 400 });
    }

    // 1. 실제 파일 이름 변경 (물리적 위치 변경)
    const oldFilePath = path.join(process.cwd(), 'public', oldStoredPath);
    const newFilePath = path.join(process.cwd(), 'public', newStoredPath);

    try {
      // 파일이 실제로 존재할 때만 이름 변경 시도
      await fs.access(oldFilePath);
      await fs.rename(oldFilePath, newFilePath);
      console.log(`✅ 물리적 파일명 변경 완료: ${oldStoredPath} -> ${newStoredPath}`);
    } catch (err) {
      console.warn('⚠️ 물리적 파일명 변경 불가 (파일이 없거나 권한 문제):', err);
      // 파일이 없어도 DB는 업데이트하고 싶다면 이 catch 블록에서 에러를 던지지 않습니다.
    }

    // 2. DB 정보 업데이트
    const pool = await getDbPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('newFileName', sql.NVarChar(255), newFileName)
      .input('newStoredPath', sql.NVarChar(sql.MAX), newStoredPath)
      .query(`
        UPDATE dbo.TB_CO_FILE_DTL
        SET file_name = @newFileName,
            stored_path = @newStoredPath
        WHERE id = @id
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ DB Update Error:', error);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}
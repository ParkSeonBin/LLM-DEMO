// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getDbPool } from '@/lib/db';
import sql from 'mssql';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const regNm = formData.get('regNm') as string || 'System'; // 등록자명 추가

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 1. 파일 시스템 저장 로직
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, file.name);
    await fs.writeFile(filePath, buffer);
    const storedPath = `/uploads/${file.name}`;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    // 2. MS SQL DB Insert 로직
    try {
      const pool = await getDbPool();
      const result = await pool.request()
        .input('file_name', sql.NVarChar(255), file.name)
        .input('stored_path', sql.NVarChar(sql.MAX), storedPath)
        .input('file_type', sql.NVarChar(50), fileExtension)
        .input('file_size', sql.BigInt, file.size)
        .input('regNm', sql.NVarChar(100), regNm)
        .query(`
          INSERT INTO dbo.TB_CO_FILE_DTL (file_name, stored_path, file_type, file_size, regNm, regDt)
          OUTPUT INSERTED.id
          VALUES (@file_name, @stored_path, @file_type, @file_size, @regNm, SYSDATETIME())
        `);

      const insertedId = result.recordset[0].id;

      return NextResponse.json({ 
        success: true, 
        id: insertedId,
        storedPath, 
        fileName: file.name 
      });

    } catch (dbErr) {
      console.error('❌ Database Insert Error:', dbErr);
      return NextResponse.json({ error: "DB 저장 중 오류 발생" }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Server Error:', error);
    return NextResponse.json({ error: "서버 처리 중 오류 발생" }, { status: 500 });
  }
}
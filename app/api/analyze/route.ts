import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as XLSX from 'xlsx';

// OpenAI 설정
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

// ChromaDB 클라이언트 (Docker 등에서 실행 중이어야 함)
const chromaClient = new ChromaClient({ path: "http://localhost:8000" });

// 로컬 임베딩 모델 (Singleton 패턴)
let extractor: any = null;
async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
  }
  return extractor;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    console.log(`[Trace] 파일 처리 시작: ${fileName}`);

    // --- [Step 1] 파일 타입별 텍스트 추출 ---

    if (fileName.endsWith('.pdf')) {
      console.log("[Trace] PDF 텍스트 추출 시도 (pdf-extraction)...");
      
      // [수정] pdf-parse 대신 pdf-extraction 사용
      const pdf = require('pdf-extraction'); 
      
      // pdf-extraction은 가끔 데이터 구조에 따라 결과가 다를 수 있어 옵션을 줄 수 있습니다.
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
      
      console.log("[Trace] PDF 추출 성공 (글자수):", extractedText.length);
    }
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // 2. Excel 처리
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        extractedText += XLSX.utils.sheet_to_csv(worksheet) + "\n";
      });
    } 
    else if (fileName.endsWith('.txt')) {
      // 3. 텍스트 파일 처리
      extractedText = new TextDecoder().decode(buffer);
    } 
    else {
      return NextResponse.json({ error: "지원하지 않는 파일 형식입니다." }, { status: 400 });
    }

    if (!extractedText.trim()) {
      throw new Error("파일에서 텍스트를 추출할 수 없습니다.");
    }

    // --- [Step 2] 텍스트 청킹 (Splitting) ---
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(extractedText);

    // --- [Step 3] 로컬 임베딩 생성 (무료) ---
    const model = await getExtractor();
    const embeddings = [];
    for (const chunk of chunks) {
      const output = await model(chunk, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }

    // --- [Step 4] ChromaDB 저장 ---
    const collection = await chromaClient.getOrCreateCollection({
      name: "document_collection",
    });

    await collection.add({
      ids: chunks.map((_, i) => `${Date.now()}_${fileName}_${i}`),
      embeddings: embeddings as any,
      metadatas: chunks.map(() => ({ source: fileName, type: file.type })),
      documents: chunks,
    });

    console.log(`[Trace] 분석 및 저장 완료: ${chunks.length} chunks`);

    return NextResponse.json({ 
      success: true, 
      data: { 
        message: "분석 및 벡터 DB 저장 완료",
        chunkCount: chunks.length 
      } 
    });

  } catch (error: any) {
    console.error('[Trace] 에러 발생:', error);
    return NextResponse.json({ error: error.message || "분석 실패" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';

export async function GET() {
  try {
    // path: "http://localhost:8000" 대신 host와 port를 나누어 작성합니다.
    const client = new ChromaClient({ 
      host: "127.0.0.1", 
      port: 8000 
    });
    
    // 컬렉션 이름이 'my_docs'가 맞는지 확인하세요. 
    // 아까 /api/analyze에서 만든 이름과 동일해야 합니다.
    const collection = await client.getCollection({ name: "document_collection" });
    
    const count = await collection.count();
    const peek = await collection.peek({ limit: 2 });

    return NextResponse.json({ 
      totalChunks: count, 
      sampleData: peek 
    });
  } catch (error: any) {
    console.error("DB 체크 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
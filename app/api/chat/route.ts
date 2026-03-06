import { NextRequest, NextResponse } from "next/server";
import { AgentService } from './services/AgentService';
import { ChromaService } from './services/implementations/ChromaService';
import { TavilyWebSearchService } from './services/implementations/TavilyWebSearchService';
import { EmbeddingService } from './services/implementations/EmbeddingService';

/**
 * 의존성 주입을 위한 서비스 팩토리
 * 실제 프로덕션에서는 DI 컨테이너(예: InversifyJS, TSyringe)를 사용할 수 있습니다.
 */
function createAgentService(): AgentService {
  // 1. 임베딩 서비스 (Singleton)
  const embeddingService = EmbeddingService.getInstance();

  // 2. ChromaDB 검색 서비스 (임베딩 서비스에 의존)
  const chromaService = new ChromaService(
    embeddingService,
    "127.0.0.1",
    8000,
    "document_collection"
  );

  // 3. 웹 검색 서비스
  const webSearchService = new TavilyWebSearchService(3);

  // 4. 에이전트 서비스 (모든 서비스를 주입)
  const agentService = new AgentService(
    chromaService,
    webSearchService,
    process.env.OPEN_AI_API_KEY || "",
    "gpt-4o",
    0
  );

  return agentService;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const agentService = createAgentService();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 'onChunk'가 호출될 때마다 즉시 전송
          await agentService.executeStream(message, (chunk: string) => {
            if (chunk) {
              controller.enqueue(encoder.encode(chunk));
            }
          });
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform", // no-transform 추가 (압축 방지)
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Nginx 사용 시 버퍼링 방지 필수 설정
      },
    });
  } catch (error: any) { /* ... */ }
}
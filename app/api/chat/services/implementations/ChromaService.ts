import { IChromaService } from '../interfaces/IChromaService';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { ChromaClient } from 'chromadb';

/**
 * ChromaDB 검색 서비스 구현체
 * 의존성: IEmbeddingService (임베딩 생성)
 */
export class ChromaService implements IChromaService {
  private client: ChromaClient;
  private collectionName: string;
  private embeddingService: IEmbeddingService;

  constructor(
    embeddingService: IEmbeddingService,
    host: string = "127.0.0.1",
    port: number = 8000,
    collectionName: string = "document_collection"
  ) {
    this.client = new ChromaClient({ host, port });
    this.collectionName = collectionName;
    this.embeddingService = embeddingService;
  }

  async search(query: string, nResults: number = 10): Promise<string[]> {
    try {
      // 컬렉션 가져오기 (가짜 임베딩 함수로 에러 방지)
      const collection = await this.client.getCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => texts.map(() => Array(384).fill(0)),
        } as any
      });

      // 쿼리 임베딩 생성
      const queryVector = await this.embeddingService.embed(query);

      // 검색 실행
      const results = await collection.query({
        queryEmbeddings: [queryVector as any],
        nResults,
      });

      // 검색 결과 로그 (디버깅용)
      // console.log("검색된 문서 조각:", results.documents[0]);

      const docs = results.documents[0];
      if (!docs || docs.length === 0) {
        return ["문서에서 관련 수치를 찾지 못했습니다."];
      }

      return docs;
    } catch (error) {
      console.error("ChromaDB 검색 에러:", error);
      throw new Error("데이터 검색 중 내부 오류가 발생했습니다.");
    }
  }
}

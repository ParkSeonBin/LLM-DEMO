import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { pipeline } from '@xenova/transformers';

/**
 * 로컬 임베딩 서비스 구현체
 * Singleton 패턴으로 모델 인스턴스를 재사용합니다.
 */
export class EmbeddingService implements IEmbeddingService {
  private static instance: EmbeddingService | null = null;
  private extractor: any = null;
  private modelName: string = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

  private constructor() {
    // Singleton: private constructor
  }

  /**
   * Singleton 인스턴스 반환
   */
  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * 임베딩 모델 초기화 (lazy loading)
   */
  private async initializeModel() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
    return this.extractor;
  }

  async embed(text: string): Promise<number[]> {
    const model = await this.initializeModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const model = await this.initializeModel();
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const output = await model(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }
    
    return embeddings;
  }
}

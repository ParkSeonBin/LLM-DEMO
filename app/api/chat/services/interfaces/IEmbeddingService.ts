/**
 * 임베딩 서비스 인터페이스
 * 텍스트를 벡터로 변환하는 기능을 추상화합니다.
 */
export interface IEmbeddingService {
  /**
   * 텍스트를 임베딩 벡터로 변환합니다.
   * @param text 임베딩할 텍스트
   * @returns 임베딩 벡터 배열
   */
  embed(text: string): Promise<number[]>;
  
  /**
   * 여러 텍스트를 일괄 임베딩 벡터로 변환합니다.
   * @param texts 임베딩할 텍스트 배열
   * @returns 임베딩 벡터 배열의 배열
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

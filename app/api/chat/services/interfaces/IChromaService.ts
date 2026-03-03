/**
 * ChromaDB 검색 서비스 인터페이스
 * 벡터 데이터베이스 검색 기능을 추상화합니다.
 */
export interface IChromaService {
  /**
   * 쿼리 텍스트를 기반으로 관련 문서를 검색합니다.
   * @param query 검색 쿼리 텍스트
   * @param nResults 반환할 결과 수 (기본값: 10)
   * @returns 검색된 문서 배열
   */
  search(query: string, nResults?: number): Promise<string[]>;
}

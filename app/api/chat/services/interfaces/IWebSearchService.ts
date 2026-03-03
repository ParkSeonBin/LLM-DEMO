import { Tool } from "@langchain/core/tools";

/**
 * 웹 검색 서비스 인터페이스
 * 인터넷 검색 기능을 추상화합니다.
 */
export interface IWebSearchService {
  /**
   * 검색 쿼리를 실행하고 결과를 반환합니다.
   * @param query 검색 쿼리 텍스트
   * @param maxResults 최대 결과 수
   * @returns 검색 결과
   */
  search(query: string, maxResults?: number): Promise<any>;
  
  /**
   * LangChain Tool 인스턴스를 반환합니다.
   * @returns LangChain Tool
   */
  getTool(): Tool;
}

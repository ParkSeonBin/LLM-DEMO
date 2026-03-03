import { IWebSearchService } from '../interfaces/IWebSearchService';
import { TavilySearch } from '@langchain/tavily';
import { Tool } from '@langchain/core/tools';

/**
 * Tavily 웹 검색 서비스 구현체
 */
export class TavilyWebSearchService implements IWebSearchService {
  private tavilySearch: TavilySearch;

  constructor(maxResults: number = 3) {
    this.tavilySearch = new TavilySearch({ maxResults });
  }

  async search(query: string, maxResults?: number): Promise<any> {
    if (maxResults && maxResults !== this.tavilySearch.maxResults) {
      // 필요시 새로운 인스턴스 생성
      this.tavilySearch = new TavilySearch({ maxResults });
    }
    return this.tavilySearch;
  }

  /**
   * LangChain Tool로 사용하기 위한 TavilySearch 인스턴스 반환
   * TavilySearch는 Tool 인터페이스를 구현하므로 직접 반환 가능
   */
  getTool(): Tool {
    return this.tavilySearch as Tool;
  }
}

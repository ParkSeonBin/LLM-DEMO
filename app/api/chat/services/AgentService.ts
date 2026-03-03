import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { IChromaService } from './interfaces/IChromaService';
import { IWebSearchService } from './interfaces/IWebSearchService';

/**
 * 에이전트 서비스
 * 의존성 주입을 통해 서비스들을 받아 에이전트를 생성하고 실행합니다.
 */
export class AgentService {
  private chromaService: IChromaService;
  private webSearchService: IWebSearchService;
  private model: ChatOpenAI;

  constructor(
    chromaService: IChromaService,
    webSearchService: IWebSearchService,
    openAIApiKey: string,
    modelName: string = "gpt-4o",
    temperature: number = 0
  ) {
    this.chromaService = chromaService;
    this.webSearchService = webSearchService;
    
    this.model = new ChatOpenAI({
      openAIApiKey,
      modelName,
      temperature,
    });
  }

  /**
   * 에이전트를 생성하고 실행합니다.
   * @param message 사용자 메시지
   * @param recursionLimit 최대 재귀 횟수 (기본값: 10)
   * @returns 에이전트 응답
   */
  async execute(message: string, recursionLimit: number = 10): Promise<string> {
    // 도구 생성
    const tools = this.createTools();

    // ReAct 에이전트 생성
    const agent = createReactAgent({
      llm: this.model,
      tools: tools,
      stateModifier: this.getStateModifier(),
    });

    // 에이전트 실행
    const result = await agent.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      {
        recursionLimit,
      }
    );

    // 결과 추출 (마지막 메시지)
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content as string;
  }

  /**
   * 에이전트가 사용할 도구들을 생성합니다.
   */
  private createTools() {
    // 로컬 DB 검색 도구
    const localRetrieverTool = new DynamicTool({
      name: "search_local_financial_docs",
      description: "삼성전자 사업보고서 및 재무제표 데이터를 검색합니다.",
      func: async (query: string) => {
        const results = await this.chromaService.search(query, 10);
        return results.join("\n\n");
      },
    });

    // 웹 검색 도구 (인터페이스를 통해 Tool 반환)
    const webSearchTool = this.webSearchService.getTool();

    return [localRetrieverTool, webSearchTool];
  }

  /**
   * 에이전트의 상태 수정자 (프롬프트)를 반환합니다.
   */
  private getStateModifier(): string {
    return `
      당신은 유능한 금융 분석 전문가입니다. 
      답변 시 다음 우선순위를 반드시 지키세요:
      1. 사용자가 업로드한 문서(재무제표 등)에 관한 질문을 하면 'search_local_financial_docs' 도구를 먼저 사용하여 답변하세요.
      2. 로컬 문서에 정보가 없거나, 현재 주가/최신 뉴스 등 실시간 정보가 필요하다면 'tavily_search_results_json' 도구를 사용하세요.
      3. 수치 데이터를 다룰 때는 매우 정확해야 하며, 출처(문서 인용 혹은 웹사이트)를 명시하세요.
      4. 한국어로 답변하세요.
    `;
  }
}

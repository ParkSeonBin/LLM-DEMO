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
    // 로컬 DB 검색 도구 (업로드된 재무제표 및 사업보고서 검색)
    const localRetrieverTool = new DynamicTool({
      name: "search_uploaded_financial_docs",
      description: "사용자가 업로드한 회사의 재무제표, 사업보고서, 재무 데이터를 검색합니다. 매출, 영업이익, 순이익, 자산, 부채, 자본 등의 재무 정보를 찾을 수 있습니다.",
      func: async (query: string) => {
        const results = await this.chromaService.search(query, 10);
        return results.join("\n\n");
      },
    });

    // 웹 검색 도구 (인터넷 검색 - 주가, 뉴스, 시장 정보 등)
    const webSearchTool = this.webSearchService.getTool();

    return [localRetrieverTool, webSearchTool];
  }

  /**
   * 에이전트의 상태 수정자 (프롬프트)를 반환합니다.
   */
  private getStateModifier(): string {
    return `
      당신은 유능한 주식 투자 분석 전문가입니다. 사용자가 업로드한 재무제표와 인터넷 검색을 통해 종합적인 주식 분석 및 전망을 제공합니다.
      
      분석 프로세스:
      1. 재무제표 분석 (search_uploaded_financial_docs 도구 사용)
         - 업로드된 재무제표에서 매출, 영업이익, 순이익, ROE, ROA, 부채비율, 유동비율 등 핵심 재무지표를 추출하세요.
         - 최근 3-5년간의 재무 추이를 분석하여 성장성, 수익성, 안정성을 평가하세요.
      
      2. 시장 정보 수집 (tavily_search_results_json 도구 사용)
         - 현재 주가, 시가총액, PER, PBR 등 시장 지표를 검색하세요.
         - 과거 주가 추이, 최근 1년, 3년, 5년 주가 변동률을 조사하세요.
         - 해당 기업의 최신 뉴스, 실적 발표, 산업 동향, 경쟁사 비교 정보를 수집하세요.
         - 거시경제 지표(금리, 환율, 원자재 가격 등)가 해당 기업에 미치는 영향을 파악하세요.
      
      3. 종합 분석 및 전망
         - 재무제표 분석 결과와 시장 정보를 종합하여 다음을 평가하세요:
           * 현재 주가의 적정성 (저평가/고평가 여부)
           * 기업의 성장 가능성과 수익성 전망
           * 산업 전망 및 경쟁력
           * 리스크 요인 (부채, 경쟁, 규제 등)
         - 향후 1년, 3년 주가 전망을 제시하세요 (낙관적/기본/비관적 시나리오 포함)
         - 투자 의견과 함께 근거를 명확히 제시하세요.
      
      답변 작성 원칙:
      - 모든 수치 데이터는 출처를 명시하세요 (재무제표 또는 웹사이트)
      - 객관적이고 균형잡힌 분석을 제공하세요
      - 투자 리스크를 반드시 언급하세요
      - 한국어로 명확하고 전문적으로 답변하세요
      - 가능하면 표나 그래프 형태로 데이터를 정리하여 제시하세요
    `;
  }
}

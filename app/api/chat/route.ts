import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { ChromaClient } from "chromadb";
import { pipeline } from "@xenova/transformers";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // 1. OpenAI 모델 설정 (표준 OpenAI 사용)
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPEN_AI_API_KEY,
      modelName: "gpt-4o",
      temperature: 0,
    });

    // 2. [추가] ChromaDB 검색 도구 정의
    // 에이전트가 로컬 DB를 검색할 수 있게 해주는 "커스텀 도구"입니다.
    const localRetrieverTool = new DynamicTool({
      name: "search_local_financial_docs",
      description: "삼성전자 사업보고서 및 재무제표 데이터를 검색합니다.",
      func: async (query: string) => {
        try {
          const client = new ChromaClient({ host: "127.0.0.1", port: 8000 });
          
          // [중요] 가짜 임베딩 객체를 주입하여 에러를 방지합니다.
          const collection = await client.getCollection({ 
            name: "document_collection",
            embeddingFunction: {
              generate: async (texts: string[]) => texts.map(() => Array(384).fill(0)), 
              // 384는 사용 중인 MiniLM 모델의 차원 수입니다.
            } as any
          });

          // 1. 쿼리 임베딩 생성 (수동)
          const embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
          const output = await embedder(query, { pooling: 'mean', normalize: true });
          const queryVector = Array.from(output.data);

          // 2. 검색 실행
          const results = await collection.query({
            queryEmbeddings: [queryVector as any],
            nResults: 10,
          });

          // 3. 검색 결과 로그 확인 (디버깅용)
          console.log("검색된 문서 조각:", results.documents[0]);

          const docs = results.documents[0];
          if (!docs || docs.length === 0) return "문서에서 관련 수치를 찾지 못했습니다.";

          return docs.join("\n\n");
        } catch (e) {
          console.error("검색 에러 상세:", e);
          return "데이터 검색 중 내부 오류가 발생했습니다.";
        }
      },
    });

    // 3. 도구 세트 설정 (로컬 DB 검색 + 인터넷 검색)
    const tools = [
      localRetrieverTool, 
      new TavilySearch({ maxResults: 3 })
    ];

    // 4. ReAct 에이전트 생성
    const agent = createReactAgent({
      llm: model,
      tools: tools,
      stateModifier: `
          당신은 유능한 금융 분석 전문가입니다. 
          답변 시 다음 우선순위를 반드시 지키세요:
          1. 사용자가 업로드한 문서(재무제표 등)에 관한 질문을 하면 'search_local_financial_docs' 도구를 먼저 사용하여 답변하세요.
          2. 로컬 문서에 정보가 없거나, 현재 주가/최신 뉴스 등 실시간 정보가 필요하다면 'tavily_search_results_json' 도구를 사용하세요.
          3. 수치 데이터를 다룰 때는 매우 정확해야 하며, 출처(문서 인용 혹은 웹사이트)를 명시하세요.
          4. 한국어로 답변하세요.
        `,
    });

    // 5. 에이전트 실행
    const result = await agent.invoke({
      messages: [new HumanMessage(message)],
    }, {
      // [추가] 최대 루프 횟수를 10회로 제한 (기본값은 보통 25회)
      // 에이전트가 10번 넘게 도구를 쓰거나 고민하면 강제로 중단하고 답변을 생성합니다.
      recursionLimit: 10, 
    });

    // 결과 추출 (마지막 메시지)
    const lastMessage = result.messages[result.messages.length - 1];

    return NextResponse.json({ 
      success: true, 
      answer: lastMessage.content 
    });

  } catch (error: any) {
    console.error("❌ [AI API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "에이전트 실행 중 오류 발생" },
      { status: 500 }
    );
  }
}
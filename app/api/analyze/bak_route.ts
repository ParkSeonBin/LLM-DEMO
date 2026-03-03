import { NextResponse } from 'next/server';
// [수정] Schema 타입을 명시적으로 import
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY || '');

// [핵심] 스키마 정의부에 명시적인 타입 지정
// [수정] 스키마 정의부에 명시적인 타입 지정 및 구조 수정
const financialSchema: Schema = {
  description: "기업의 재무제표 데이터",
  type: SchemaType.OBJECT,
  properties: {
    companyName: { type: SchemaType.STRING, description: "기업명" },
    fiscalYear: { type: SchemaType.STRING, description: "당기 연도" },
    currency: { type: SchemaType.STRING, description: "통화 단위" },
    
    // 재무상태표
    balanceSheet: {
      type: SchemaType.OBJECT,
      description: "재무상태표 (2단계 계층 구조)",
      properties: {
        assets: {
          type: SchemaType.ARRAY,
          description: "자산 항목",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              classification: { type: SchemaType.STRING, description: "1단계 분류 (예: 유동자산)" },
              subItems: {
                type: SchemaType.ARRAY,
                description: "2단계 세부항목",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    itemName: { type: SchemaType.STRING, description: "2단계 세부항목 (예: 현금)" },
                    currentValue: { type: SchemaType.NUMBER, description: "당기 금액" },
                    previousValue: { type: SchemaType.NUMBER, description: "전기 금액" }
                  },
                  required: ["itemName", "currentValue"]
                }
              }
            },
            required: ["classification", "subItems"]
          }
        },
        // [수정] assets와 동일한 구조로 명시적 정의
        liabilities: { 
          type: SchemaType.ARRAY, 
          description: "부채 항목",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              classification: { type: SchemaType.STRING, description: "1단계 분류 (예: 유동부채)" },
              subItems: {
                type: SchemaType.ARRAY,
                description: "2단계 세부항목",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    itemName: { type: SchemaType.STRING, description: "2단계 세부항목" },
                    currentValue: { type: SchemaType.NUMBER, description: "당기 금액" },
                    previousValue: { type: SchemaType.NUMBER, description: "전기 금액" }
                  },
                  required: ["itemName", "currentValue"]
                }
              }
            },
            required: ["classification", "subItems"]
          }
        },
        // [수정] assets와 동일한 구조로 명시적 정의
        equity: { 
          type: SchemaType.ARRAY, 
          description: "자본 항목",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              classification: { type: SchemaType.STRING, description: "1단계 분류 (예: 자본금)" },
              subItems: {
                type: SchemaType.ARRAY,
                description: "2단계 세부항목",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    itemName: { type: SchemaType.STRING, description: "2단계 세부항목" },
                    currentValue: { type: SchemaType.NUMBER, description: "당기 금액" },
                    previousValue: { type: SchemaType.NUMBER, description: "전기 금액" }
                  },
                  required: ["itemName", "currentValue"]
                }
              }
            },
            required: ["classification", "subItems"]
          }
        }
      },
      required: ["assets", "liabilities", "equity"]
    },

    // 손익계산서
    incomeStatement: {
      type: SchemaType.ARRAY,
      description: "손익계산서 (1단계 항목 구조)",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          itemName: { type: SchemaType.STRING, description: "1단계 항목 (예: 매출액)" },
          currentValue: { type: SchemaType.NUMBER, description: "당기 금액" },
          previousValue: { type: SchemaType.NUMBER, description: "전기 금액" }
        },
        required: ["itemName", "currentValue"]
      }
    }
  },
  required: ["balanceSheet", "incomeStatement"]
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Gemini 1.5 Pro 설정
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: financialSchema, // 스키마 적용
      },
    });

    // 시스템 프롬프트 작성
    const systemInstruction = `
      당신은 기업의 재무제표를 분석하는 전문가입니다.
      제공된 PDF(이미지)에서 데이터를 추출하여 정해진 JSON 스키마에 맞춰 출력하세요.
      
      [분석 규칙]
      1. 재무상태표는 '자산', '부채', '자본'으로 분류하고, 하위에 2단계 세부 계정을 나열하세요.
      2. 손익계산서는 1단계 항목(매출액, 매출원가 등)과 금액만 나열하세요.
      3. 전기와 당기 데이터를 구분하여 기록하세요.
      4. 이미지 내의 표 구조를 완벽하게 이해하여 누락 없이 추출하세요.
      5. "당기순손실"이나 "영업손실" 항목은 데이터 저장 시 부호를 반전(양수)하여 저장하지 말고 그대로 데이터 모델에 맞게 기록하세요. (정규화는 이후 단계에서 처리)
    `;

    console.log(`[Trace] 분석 시작: ${file.name}`);
    
    const result = await model.generateContent([
      { text: systemInstruction },
      {
        inlineData: {
          mimeType: file.type,
          data: Buffer.from(uint8Array).toString('base64'),
        },
      },
    ]);

    const response = await result.response;
    const jsonText = response.text();
    const structuredData = JSON.parse(jsonText);

    console.log("[Trace] 정형화된 JSON 데이터:", JSON.stringify(structuredData, null, 2));

    // TODO: 여기서 structuredData를 가지고 정규화_규칙을 적용하고 DB에 저장하는 로직 추가
    // 예: const normalizedData = normalizeFinancialData(structuredData);

    return NextResponse.json({ success: true, data: structuredData });

  } catch (error) {
    console.error('[Trace] 에러 발생:', error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
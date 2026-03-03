import { FileExtractionStrategy } from './FileExtractionStrategy';
import { PdfExtractionStrategy } from './PdfExtractionStrategy';
import { ExcelExtractionStrategy } from './ExcelExtractionStrategy';
import { TextExtractionStrategy } from './TextExtractionStrategy';

/**
 * 파일 추출 전략 팩토리
 * Strategy Pattern의 Context 역할
 * 적절한 전략을 선택하여 반환합니다.
 */
export class FileExtractionStrategyFactory {
  private strategies: FileExtractionStrategy[];

  constructor() {
    // 사용 가능한 모든 전략을 등록
    this.strategies = [
      new PdfExtractionStrategy(),
      new ExcelExtractionStrategy(),
      new TextExtractionStrategy(),
    ];
  }

  /**
   * 파일명에 따라 적절한 추출 전략을 반환합니다.
   * @param fileName 파일 이름
   * @returns 적절한 FileExtractionStrategy 인스턴스
   * @throws Error 지원하지 않는 파일 형식인 경우
   */
  getStrategy(fileName: string): FileExtractionStrategy {
    const strategy = this.strategies.find(s => s.canHandle(fileName));
    
    if (!strategy) {
      throw new Error("지원하지 않는 파일 형식입니다.");
    }
    
    return strategy;
  }

  /**
   * 지원하는 모든 파일 확장자를 반환합니다.
   * @returns 지원하는 확장자 배열
   */
  getSupportedExtensions(): string[] {
    const extensions: string[] = [];
    this.strategies.forEach(strategy => {
      extensions.push(...strategy.getSupportedExtensions());
    });
    return extensions;
  }
}

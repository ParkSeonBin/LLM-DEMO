/**
 * 파일 추출 전략 인터페이스
 * Strategy Pattern의 Strategy 인터페이스 역할
 */
export interface FileExtractionStrategy {
  /**
   * 파일에서 텍스트를 추출합니다.
   * @param buffer 파일의 버퍼 데이터
   * @param fileName 파일 이름 (확장자 확인용)
   * @returns 추출된 텍스트
   */
  extract(buffer: Buffer, fileName: string): Promise<string>;
  
  /**
   * 이 전략이 처리할 수 있는 파일 확장자를 반환합니다.
   * @returns 지원하는 확장자 배열 (예: ['.pdf', '.PDF'])
   */
  getSupportedExtensions(): string[];
  
  /**
   * 주어진 파일명이 이 전략으로 처리 가능한지 확인합니다.
   * @param fileName 파일 이름
   * @returns 처리 가능 여부
   */
  canHandle(fileName: string): boolean;
}

import { FileExtractionStrategy } from './FileExtractionStrategy';

/**
 * 텍스트 파일 추출 전략
 * Strategy Pattern의 ConcreteStrategy 구현
 */
export class TextExtractionStrategy implements FileExtractionStrategy {
  getSupportedExtensions(): string[] {
    return ['.txt'];
  }

  canHandle(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return this.getSupportedExtensions().some(ext => lowerFileName.endsWith(ext));
  }

  async extract(buffer: Buffer, fileName: string): Promise<string> {
    console.log("[Trace] 텍스트 파일 추출 시도...");
    
    const extractedText = new TextDecoder().decode(buffer);
    
    console.log("[Trace] 텍스트 파일 추출 성공 (글자수):", extractedText.length);
    
    return extractedText;
  }
}

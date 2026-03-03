import { FileExtractionStrategy } from './FileExtractionStrategy';

/**
 * PDF 파일 추출 전략
 * Strategy Pattern의 ConcreteStrategy 구현
 */
export class PdfExtractionStrategy implements FileExtractionStrategy {
  getSupportedExtensions(): string[] {
    return ['.pdf'];
  }

  canHandle(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return this.getSupportedExtensions().some(ext => lowerFileName.endsWith(ext));
  }

  async extract(buffer: Buffer, fileName: string): Promise<string> {
    console.log("[Trace] PDF 텍스트 추출 시도 (pdf-extraction)...");
    
    // pdf-extraction 사용
    const pdf = require('pdf-extraction');
    
    // pdf-extraction은 가끔 데이터 구조에 따라 결과가 다를 수 있어 옵션을 줄 수 있습니다.
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;
    
    console.log("[Trace] PDF 추출 성공 (글자수):", extractedText.length);
    
    return extractedText;
  }
}

import { FileExtractionStrategy } from './FileExtractionStrategy';
import * as XLSX from 'xlsx';

/**
 * Excel 파일 추출 전략
 * Strategy Pattern의 ConcreteStrategy 구현
 */
export class ExcelExtractionStrategy implements FileExtractionStrategy {
  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }

  canHandle(fileName: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    return this.getSupportedExtensions().some(ext => lowerFileName.endsWith(ext));
  }

  async extract(buffer: Buffer, fileName: string): Promise<string> {
    console.log("[Trace] Excel 텍스트 추출 시도...");
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    let extractedText = "";
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      extractedText += XLSX.utils.sheet_to_csv(worksheet) + "\n";
    });
    
    console.log("[Trace] Excel 추출 성공 (글자수):", extractedText.length);
    
    return extractedText;
  }
}


import { toast } from "sonner";
import OllamaService from "./ollamaService";

export interface CodeExecutionResult {
  output: string;
  success: boolean;
}

// Yerel yürütme için kullanılan kod
export const executeLocalCode = async (code: string): Promise<CodeExecutionResult> => {
  try {
    const executeCode = new Function(code);
    
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
      originalConsoleLog(...args);
    };
    
    const result = executeCode();
    
    console.log = originalConsoleLog;
    
    const output = logs.length > 0 ? logs.join('\n') : String(result || '');
    return { output, success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { output: `Hata: ${error.message}`, success: false };
    } else {
      return { output: "Bilinmeyen bir hata oluştu", success: false };
    }
  }
};

// Ana kod yürütme fonksiyonu
export const executeCode = async (code: string, language: string, useOllama: boolean = false): Promise<CodeExecutionResult> => {
  if (!code.trim()) {
    toast.error("Lütfen önce biraz kod yazın");
    return { output: "", success: false };
  }
  
  try {
    if (useOllama) {
      // Ollama kullanarak kodu çalıştır
      const ollamaService = new OllamaService();
      toast.loading("Ollama ile kod çalıştırılıyor...");
      
      const result = await ollamaService.executeCode(code, language);
      toast.success("Kod başarıyla çalıştırıldı");
      
      return {
        output: result,
        success: true
      };
    } else {
      // Yerel olarak JavaScript kodunu çalıştır (sadece JS için)
      if (language !== "javascript" && language !== "js") {
        toast.error(`Yerel yürütme sadece JavaScript için destekleniyor. ${language.toUpperCase()} için Ollama modunu kullanın.`);
        return { 
          output: `Yerel yürütme için ${language.toUpperCase()} dili desteklenmiyor. Ollama modunu kullanarak çalıştırmayı deneyin.`, 
          success: false 
        };
      }
      
      toast.loading("Kod çalıştırılıyor...");
      
      // Simüle edilmiş gecikme (gerçek bir uygulamada gerekli değil)
      const localResult = await new Promise<CodeExecutionResult>((resolve) => {
        setTimeout(async () => {
          const result = await executeLocalCode(code);
          if (result.success) {
            toast.success("Kod başarıyla çalıştırıldı");
          } else {
            toast.error(result.output.substring(0, 100));
          }
          resolve(result);
        }, 500);
      });
      
      return localResult;
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.error(`Hata: ${error.message}`);
      return { output: `Hata: ${error.message}`, success: false };
    } else {
      toast.error("Bilinmeyen bir hata oluştu");
      return { output: "Bilinmeyen bir hata oluştu", success: false };
    }
  }
};


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

// Şablon tabanlı kod oluşturma
export const generateFromTemplate = async (templateName: string, customDetails: string = ""): Promise<CodeExecutionResult> => {
  try {
    const ollamaService = new OllamaService();
    toast.loading("Şablondan kod oluşturuluyor...");
    
    const result = await ollamaService.generateFromTemplate(templateName, customDetails);
    toast.success("Kod başarıyla oluşturuldu");
    
    return {
      output: result,
      success: true
    };
  } catch (error) {
    let errorMessage = "Şablondan kod oluşturulurken bir hata oluştu";
    
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    toast.error(errorMessage);
    return { output: errorMessage, success: false };
  }
};

// Test kodu oluşturma
export const generateTestCode = async (code: string, language: string): Promise<CodeExecutionResult> => {
  try {
    const ollamaService = new OllamaService();
    toast.loading("Test kodu oluşturuluyor...");
    
    const result = await ollamaService.generateTests(code, language);
    toast.success("Test kodu başarıyla oluşturuldu");
    
    return {
      output: result,
      success: true
    };
  } catch (error) {
    let errorMessage = "Test kodu oluşturulurken bir hata oluştu";
    
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    toast.error(errorMessage);
    return { output: errorMessage, success: false };
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

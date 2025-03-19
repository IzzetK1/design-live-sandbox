
import { toast } from "sonner";

export interface CodeExecutionResult {
  output: string;
  success: boolean;
}

export const executeCode = async (code: string, language: string): Promise<CodeExecutionResult> => {
  if (!code.trim()) {
    toast.error("Lütfen önce biraz kod yazın");
    return { output: "", success: false };
  }
  
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result;
        let output = "";
        let success = true;
        
        try {
          const executeCode = new Function(code);
          
          const originalConsoleLog = console.log;
          const logs: string[] = [];
          
          console.log = (...args) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
            originalConsoleLog(...args);
          };
          
          result = executeCode();
          
          console.log = originalConsoleLog;
          
          output = logs.length > 0 ? logs.join('\n') : String(result || '');
          toast.success("Kod başarıyla çalıştırıldı");
        } catch (error) {
          success = false;
          if (error instanceof Error) {
            output = `Hata: ${error.message}`;
            toast.error(`Hata: ${error.message}`);
          } else {
            output = `Bilinmeyen bir hata oluştu`;
            toast.error("Bilinmeyen bir hata oluştu");
          }
        }
        
        resolve({ output, success });
      }, 1000);
    });
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

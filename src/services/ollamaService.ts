
// This service interacts with the Ollama API

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export class OllamaService {
  private baseUrl: string = "http://localhost:11434/api";

  constructor(private baseUrlOverride?: string) {
    if (baseUrlOverride) {
      this.baseUrl = baseUrlOverride;
    }
  }

  // Metod: Mevcut tüm modelleri getir
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models ? data.models.map((model: any) => model.name) : [];
    } catch (error) {
      console.error("[Ollama Service] Error fetching models:", error);
      throw error;
    }
  }

  // Metod: Tamamlama oluştur (streaming olmadan)
  async generateCompletion(prompt: string, model: string, options?: OllamaRequest["options"]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          options,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("[Ollama Service] Error generating completion:", error);
      throw error;
    }
  }

  // Metod: Streaming yanıt oluştur
  async* generateCompletionStream(prompt: string, model: string, options?: OllamaRequest["options"]): AsyncGenerator<string> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          options,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream reader could not be created");
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Tam JSON nesneleri için bufferi işle
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          try {
            if (line.trim()) {
              const chunk = JSON.parse(line);
              yield chunk.response;
            }
          } catch (e) {
            console.error("Error parsing JSON chunk:", e);
          }
        }
      }

      // Kalan bufferi temizle
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          yield chunk.response;
        } catch (e) {
          console.error("Error parsing final JSON chunk:", e);
        }
      }
    } catch (error) {
      console.error("[Ollama Service] Stream error:", error);
      throw error;
    }
  }

  // Metod: Kod çalıştırmak için Ollama'ya sorgu gönder
  async executeCode(code: string, language: string, prompt: string = ""): Promise<string> {
    try {
      // Kod yürütme için model bilgisine dayalı bir sorgu oluştur
      const codePrompt = prompt || `Aşağıdaki ${language} kodunu çalıştır ve sonucu ver. Kod çalıştırılabilir değilse, hatayı açıkla:

\`\`\`${language}
${code}
\`\`\`

Lütfen sadece yürütme sonucunu ve/veya hata mesajlarını döndür. Ekstra açıklama yapma.`;

      // Farklı diller için ideal model seçimi
      const modelForLanguage = language === "javascript" ? "llama3" : "codellama";
      
      // Kod yürütme sorgusu için tamamlama oluştur
      const result = await this.generateCompletion(codePrompt, modelForLanguage, {
        temperature: 0.1 // Daha deterministik yanıtlar için düşük sıcaklık
      });
      
      return result;
    } catch (error) {
      console.error("[Ollama Service] Error executing code:", error);
      if (error instanceof Error) {
        return `Hata: ${error.message}`;
      }
      return "Bilinmeyen bir hata oluştu";
    }
  }
}

export default OllamaService;

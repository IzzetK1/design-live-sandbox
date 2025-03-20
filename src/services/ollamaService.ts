
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

export interface ProjectTemplate {
  name: string;
  description: string;
  type: 'component' | 'module' | 'application';
  complexity: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
  prompt: string;
}

export class OllamaService {
  private baseUrl: string = "http://localhost:11434/api";
  private templates: ProjectTemplate[] = [
    {
      name: "ERP Müşteri Modülü",
      description: "Müşteri bilgilerini yönetmek için temel CRUD işlemleri içeren modül",
      type: "module",
      complexity: "intermediate",
      tags: ["erp", "crm", "müşteri"],
      prompt: "Aşağıdaki özelliklere sahip bir müşteri yönetim modülü oluştur: \n- Müşteri listesi görüntüleme\n- Müşteri ekleme/düzenleme/silme formları\n- Müşteri detayları sayfası\n- Filtreleme ve arama özellikleri\nReact ve Typescript kullanarak, modüler ve yeniden kullanılabilir bileşenlerle oluştur."
    },
    {
      name: "ERP Stok Yönetimi",
      description: "Ürün ve stok takibi için temel CRUD işlemleri içeren modül",
      type: "module",
      complexity: "intermediate",
      tags: ["erp", "stok", "ürün"],
      prompt: "Aşağıdaki özelliklere sahip bir stok yönetim modülü oluştur: \n- Ürün listesi görüntüleme\n- Ürün ekleme/düzenleme/silme\n- Stok giriş/çıkış işlemleri\n- Stok raporu\nReact, Typescript ve Tailwind CSS kullanarak, modüler ve yeniden kullanılabilir bileşenlerle oluştur."
    },
    {
      name: "Temel Tablo Bileşeni",
      description: "Sıralama, filtreleme ve sayfalama özellikleri olan yeniden kullanılabilir tablo",
      type: "component",
      complexity: "basic",
      tags: ["ui", "tablo", "bileşen"],
      prompt: "Aşağıdaki özelliklere sahip yeniden kullanılabilir bir tablo bileşeni oluştur: \n- Dinamik sütunlar\n- Sıralama\n- Filtreleme\n- Sayfalama\n- Seçim işlevselliği\nReact, Typescript ve Tailwind CSS kullanarak modüler ve yeniden kullanılabilir bir bileşen olarak oluştur."
    },
    {
      name: "Form Oluşturucu",
      description: "Dinamik form oluşturma ve doğrulama için yeniden kullanılabilir bileşen",
      type: "component",
      complexity: "advanced",
      tags: ["ui", "form", "doğrulama"],
      prompt: "Aşağıdaki özelliklere sahip dinamik form oluşturucu bileşeni geliştir:\n- JSON şemasından form oluşturma\n- Farklı input tipleri desteği (metin, sayı, tarih, seçim, çoklu seçim)\n- Form doğrulama\n- Dinamik alan gösterme/gizleme\nReact, Typescript, Zod ve React Hook Form kullanarak modüler ve yeniden kullanılabilir bir bileşen olarak oluştur."
    }
  ];

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

  // Metod: Şablon tabanlı kod oluşturma
  async generateFromTemplate(templateName: string, customDetails: string = ""): Promise<string> {
    try {
      const template = this.templates.find(t => t.name === templateName);
      
      if (!template) {
        throw new Error(`Şablon bulunamadı: ${templateName}`);
      }
      
      const finalPrompt = customDetails 
        ? `${template.prompt}\n\nEk detaylar:\n${customDetails}`
        : template.prompt;
      
      // Daha karmaşık şablonlar için codellama kullan, basit şablonlar için llama3
      const modelName = template.complexity === 'basic' ? 'llama3' : 'codellama';
      
      const options = {
        temperature: template.complexity === 'advanced' ? 0.7 : 0.3,
        top_p: 0.8
      };
      
      return await this.generateCompletion(finalPrompt, modelName, options);
    } catch (error) {
      console.error("[Ollama Service] Error generating from template:", error);
      if (error instanceof Error) {
        return `Şablon oluşturma hatası: ${error.message}`;
      }
      return "Şablon oluşturulurken bilinmeyen bir hata oluştu";
    }
  }

  // Metod: Mevcut tüm şablonları al
  getTemplates(): ProjectTemplate[] {
    return this.templates;
  }

  // Metod: Yeni bir şablon ekle
  addTemplate(template: ProjectTemplate): void {
    this.templates.push(template);
  }

  // Metod: Projenin kodu için test üret
  async generateTests(code: string, language: string): Promise<string> {
    try {
      const testPrompt = `Aşağıdaki ${language} kodunu incele ve bu kod için unit test yazalım. Test kodu kapsamlı olmalı ve farklı durumları test etmeli (normal çalışma, sınır durumları, hata durumları):

\`\`\`${language}
${code}
\`\`\`

Jest ve React Testing Library kullanarak test kodunu yazalım. Lütfen sadece test kodunu ver, açıklama ekleme.`;

      // Test üretimi için codellama modeli daha uygundur
      return await this.generateCompletion(testPrompt, "codellama", {
        temperature: 0.3 // Orta seviye yaratıcılık
      });
    } catch (error) {
      console.error("[Ollama Service] Error generating tests:", error);
      if (error instanceof Error) {
        return `Test oluşturma hatası: ${error.message}`;
      }
      return "Test oluşturulurken bilinmeyen bir hata oluştu";
    }
  }
}

export default OllamaService;

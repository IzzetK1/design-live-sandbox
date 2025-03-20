
import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Send, Loader2, Copy, Check, Code, FileCode, Command, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

type CodeSnippetType = {
  language: string;
  code: string;
  description: string;
};

const PREDEFINED_PROMPTS = [
  {
    title: "Kodu açıkla",
    prompt: "Bu kodu satır satır açıkla ve ne yaptığını anlat."
  },
  {
    title: "Hata bul",
    prompt: "Bu kodda olabilecek hataları veya sorunları bul ve nasıl düzeltileceğini açıkla."
  },
  {
    title: "Kodu optimize et",
    prompt: "Bu kodu performans ve okunabilirlik açısından optimize etmenin yollarını öner."
  },
  {
    title: "Test kodu oluştur",
    prompt: "Bu kod için kapsamlı test senaryoları yazalım."
  },
  {
    title: "Örnekle genişlet",
    prompt: "Bu kodu daha kapsamlı hale getirmek için örnekler ve ek işlevsellik ekle."
  }
];

const CODE_SNIPPETS: CodeSnippetType[] = [
  {
    language: "javascript",
    code: `function fetchUsers() {
  return fetch('https://api.example.com/users')
    .then(response => response.json())
    .then(data => data)
    .catch(error => console.error('Error:', error));
}`,
    description: "Basit Fetch API Kullanımı"
  },
  {
    language: "javascript",
    code: `const processData = async (input) => {
  try {
    const result = input.map(item => {
      return { ...item, processed: true };
    });
    return result;
  } catch (error) {
    console.error('Processing error:', error);
    return [];
  }
};`,
    description: "Veri İşleme Fonksiyonu"
  },
  {
    language: "typescript",
    code: `interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const filterActiveUsers = (users: User[]): User[] => {
  return users.filter(user => user.isActive);
};`,
    description: "TypeScript ile Filtreleme"
  },
  {
    language: "react",
    code: `import React, { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}`,
    description: "React Hooks ile Kullanıcı Listesi"
  }
];

const OllamaAssistant: React.FC = () => {
  const { askOllama, code, language, isOllamaConnected, selectedModel, ollamaModels, setSelectedModel } = useEditor();
  
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      content: 'Merhaba! Ben Ollama üzerinde çalışan kod asistanınızım. Kod yazma, hata ayıklama veya programlama hakkında sorular sorabilisiniz.',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOllamaConnected) {
      toast.error("Ollama'ya bağlı değilsiniz. Lütfen önce ayarlardan bağlantı kurun.");
      return;
    }
    
    if (!prompt.trim()) return;
    
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: prompt,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    
    // Yardımcı kontekst bilgisi
    let context = '';
    if (code && code.trim()) {
      context = `Aşağıdaki ${language} kodunu inceleyerek yanıt ver:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    
    try {
      // Asistanın yanıtını al
      const response = await askOllama(context + prompt);
      
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting response:", error);
      
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: "Üzgünüm, yanıt alırken bir hata oluştu. Lütfen tekrar deneyin.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const usePredefinedPrompt = (promptText: string) => {
    if (code && code.trim()) {
      setPrompt(promptText);
    } else {
      toast.warning("Önce editörde bir kod olmalı");
    }
  };
  
  const insertCodeSnippet = (snippet: CodeSnippetType) => {
    const snippetMessage: MessageType = {
      id: Date.now().toString(),
      content: `Aşağıdaki ${snippet.language} kodu hakkında bilgi almak istiyorum:\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, snippetMessage]);
    setIsLoading(true);
    
    // Asistan yanıtını al
    askOllama(`Aşağıdaki ${snippet.language} kodu hakkında kısa bir açıklama yap ve nasıl çalıştığını anlat:\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``)
      .then(response => {
        const assistantMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      })
      .catch(error => {
        console.error("Error getting response:", error);
        
        const errorMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          content: "Üzgünüm, kod analizi yaparken bir hata oluştu. Lütfen tekrar deneyin.",
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: 'Merhaba! Ben Ollama üzerinde çalışan kod asistanınızım. Kod yazma, hata ayıklama veya programlama hakkında sorular sorabilisiniz.',
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between bg-background/80">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Ollama Kod Asistanı</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={!isOllamaConnected}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Model seçin" />
            </SelectTrigger>
            <SelectContent>
              {ollamaModels.map(model => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center text-xs">
            <span className={cn(
              "w-2 h-2 rounded-full mr-2", 
              isOllamaConnected ? "bg-green-500" : "bg-orange-500"
            )}></span>
            {isOllamaConnected ? "Bağlı" : "Bağlantı Yok"}
          </div>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <TabsList className="px-3 pt-2">
          <TabsTrigger value="chat" className="text-xs">Sohbet</TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs">Hazır Sorular</TabsTrigger>
          <TabsTrigger value="snippets" className="text-xs">Kod Parçaları</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Ayarlar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={cn(
                    "max-w-[85%]",
                    message.role === 'user' ? "ml-auto bg-primary text-primary-foreground" : "mr-auto"
                  )}
                >
                  <CardContent className="p-3 relative">
                    <div className="prose-sm dark:prose-invert whitespace-pre-wrap break-words">
                      {message.content.split('```').map((part, i) => {
                        if (i % 2 === 0) {
                          return <p key={i}>{part}</p>;
                        } else {
                          // Kod bloğu
                          const codeLines = part.split('\n');
                          const language = codeLines[0] || '';
                          const actualCode = codeLines.slice(1).join('\n');
                          
                          return (
                            <div key={i} className="relative my-2 rounded bg-muted p-2 text-sm font-mono">
                              <div className="absolute right-2 top-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(actualCode, `${message.id}-${i}`)}
                                >
                                  {copiedId === `${message.id}-${i}` ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                              <div className="opacity-70 text-xs mb-1">{language}</div>
                              <pre className="overflow-x-auto">{actualCode}</pre>
                            </div>
                          );
                        }
                      })}
                    </div>
                    <div className="text-xs opacity-70 mt-2 text-right">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {isLoading && (
                <div className="flex justify-center items-center py-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isOllamaConnected ? "Kod asistanına bir soru sorun..." : "Ollama'ya bağlanın..."}
                disabled={!isOllamaConnected || isLoading}
                className="min-h-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!isOllamaConnected || isLoading || !prompt.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gönder</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="prompts" className="p-0 m-0 flex-grow">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Hazır Sorular</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kod asistanına sormak için hazır sorular. Bunları kullanmak için tıklayın.
            </p>
            
            <div className="space-y-2">
              {PREDEFINED_PROMPTS.map((predefined, index) => (
                <Card key={index} className="cursor-pointer hover:bg-accent/50" onClick={() => usePredefinedPrompt(predefined.prompt)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Command className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">{predefined.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{predefined.prompt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Özel Soru Ekle</h3>
              <div className="space-y-2">
                <Input placeholder="Soru başlığı" className="w-full" />
                <Textarea placeholder="Soru metni" className="w-full" />
                <Button className="w-full">
                  <Command className="h-4 w-4 mr-2" />
                  Soru Ekle
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="snippets" className="p-0 m-0 flex-grow">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Örnek Kod Parçacıkları</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bu kod parçacıklarını sohbete eklemek için tıklayın ve asistandan açıklama isteyin.
            </p>
            
            <div className="space-y-3">
              {CODE_SNIPPETS.map((snippet, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => insertCodeSnippet(snippet)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{snippet.description}</h4>
                      <Badge variant="outline" className="text-xs">
                        {snippet.language}
                      </Badge>
                    </div>
                    <div className="bg-muted rounded p-2 text-xs font-mono overflow-hidden text-muted-foreground">
                      <pre className="line-clamp-3">{snippet.code}</pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="p-0 m-0 flex-grow">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Asistan Ayarları</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium mb-2">Dil Modeli</h4>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={!isOllamaConnected}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ollamaModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h4 className="text-xs font-medium mb-2">Sohbeti Temizle</h4>
                <Button 
                  variant="outline" 
                  onClick={clearChat}
                  className="w-full"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Tüm Mesajları Temizle
                </Button>
              </div>
              
              <div>
                <h4 className="text-xs font-medium mb-2">Hakkında</h4>
                <Card>
                  <CardContent className="p-3 text-xs">
                    <p className="text-muted-foreground">
                      Bu asistan, Ollama API'si üzerinden yerel olarak çalışan bir dil modeli 
                      kullanarak kod yazma, hata ayıklama ve programlama sorularına yanıt verir.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OllamaAssistant;

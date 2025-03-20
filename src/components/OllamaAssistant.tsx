
import React, { useState, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Send, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type MessageType = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const OllamaAssistant: React.FC = () => {
  const { askOllama, code, language, isOllamaConnected } = useEditor();
  
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
      setTimeout(scrollToBottom, 100);
    }
  };
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-3 border-b flex items-center justify-between bg-background/80">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Ollama Kod Asistanı</h3>
        </div>
        <div className="flex items-center text-xs">
          <span className={cn(
            "w-2 h-2 rounded-full mr-2", 
            isOllamaConnected ? "bg-green-500" : "bg-orange-500"
          )}></span>
          {isOllamaConnected ? "Bağlı" : "Bağlantı Yok"}
        </div>
      </div>
      
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
        </div>
      </form>
    </div>
  );
};

export default OllamaAssistant;


import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import OllamaAssistant from './OllamaAssistant';
import { Button } from '@/components/ui/button';
import { Bot, Terminal, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import TemplateSelector from './TemplateSelector';

export default function ResultPanel() {
  const { output, isProcessing } = useEditor();
  const [view, setView] = useState<'output' | 'assistant' | 'templates'>('output');
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b">
        <Button
          variant="ghost" 
          size="sm"
          className={cn(
            "rounded-none border-b-2 border-transparent",
            view === 'output' && "border-primary"
          )}
          onClick={() => setView('output')}
        >
          <Terminal className="h-4 w-4 mr-2" />
          Çıktı
        </Button>
        <Button
          variant="ghost" 
          size="sm"
          className={cn(
            "rounded-none border-b-2 border-transparent",
            view === 'assistant' && "border-primary"
          )}
          onClick={() => setView('assistant')}
        >
          <Bot className="h-4 w-4 mr-2" />
          Kod Asistanı
        </Button>
        <Button
          variant="ghost" 
          size="sm"
          className={cn(
            "rounded-none border-b-2 border-transparent",
            view === 'templates' && "border-primary"
          )}
          onClick={() => setView('templates')}
        >
          <Code className="h-4 w-4 mr-2" />
          Şablonlar
        </Button>
      </div>
      
      {view === 'output' ? (
        <div className="flex-grow overflow-auto font-mono p-4 bg-muted/50 text-sm whitespace-pre-wrap">
          {isProcessing ? (
            <div className="animate-pulse">Çalıştırılıyor...</div>
          ) : output ? (
            output
          ) : (
            <div className="text-muted-foreground">
              Çıktı burada görüntülenecek. Kodu çalıştırmak için "Çalıştır" düğmesine basın.
            </div>
          )}
        </div>
      ) : view === 'assistant' ? (
        <OllamaAssistant />
      ) : (
        <TemplateSelector />
      )}
    </div>
  );
}


import React, { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResultPanelProps {
  width: number;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ width }) => {
  const { code, output, isProcessing, language } = useEditor();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  // Update iframe content
  useEffect(() => {
    if (language === 'html' && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
      }
    }
  }, [code, language]);

  // Auto-scroll to bottom of output when it changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div 
      className={cn(
        "h-full overflow-hidden bg-background transition-all duration-300 ease-in-out",
        isProcessing && "opacity-80"
      )}
      style={{ width: `${100 - width}%` }}
    >
      <Tabs defaultValue="preview" className="w-full h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <TabsList className="grid grid-cols-2 w-[200px]">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>
          
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Processing...</span>
            </div>
          )}
        </div>

        <TabsContent value="preview" className="h-[calc(100%-41px)] w-full p-0 m-0">
          <div className="w-full h-full relative bg-white">
            {language === 'html' ? (
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === 'javascript' 
                      ? "JavaScript output will appear in the Console tab" 
                      : "Switch to HTML mode to see a preview"}
                  </p>
                  <button 
                    className="text-xs text-primary hover:underline"
                    onClick={() => document.querySelector('[data-value="console"]')?.dispatchEvent(
                      new MouseEvent('click', { bubbles: true })
                    )}
                  >
                    Go to Console →
                  </button>
                </div>
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
                <div className="loading-shimmer h-8 w-32 rounded-md" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="console" className="h-[calc(100%-41px)] w-full p-0 m-0">
          <pre
            ref={outputRef}
            className={cn(
              "w-full h-full p-4 overflow-auto font-mono text-sm",
              "bg-editor text-editor-foreground",
              isProcessing && "opacity-50"
            )}
          >
            {output || 'Code output will appear here after running...'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultPanel;

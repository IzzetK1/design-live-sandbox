
import React, { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCcw, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResultPanel: React.FC = () => {
  const { code, output, isProcessing, language, runCode } = useEditor();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const [viewportSize, setViewportSize] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Update iframe content
  useEffect(() => {
    if ((language === 'html' || language === 'jsx' || language === 'tsx' || language === 'javascript') && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        
        // Add full HTML structure if the code doesn't include it
        if (!code.includes('<!DOCTYPE html>') && !code.includes('<html')) {
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              ${code}
            </body>
            </html>
          `);
        } else {
          iframeDoc.write(code);
        }
        
        iframeDoc.close();
        
        // Execute JavaScript if needed
        if (language === 'javascript') {
          try {
            const scriptElement = iframeDoc.createElement('script');
            scriptElement.textContent = code;
            iframeDoc.body.appendChild(scriptElement);
          } catch (error) {
            console.error('Error executing JavaScript:', error);
          }
        }
      }
    }
  }, [code, language]);

  // Auto-scroll to bottom of output when it changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const getViewportWidth = () => {
    switch (viewportSize) {
      case 'mobile': return 'w-[375px]';
      case 'tablet': return 'w-[768px]';
      case 'desktop': return 'w-full';
      default: return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <Tabs defaultValue="preview" className="w-full h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <TabsList className="grid grid-cols-2 w-[200px]">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">Processing...</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={runCode}
              disabled={isProcessing}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="h-[calc(100%-41px)] w-full p-0 m-0">
          <div className="border-b px-4 py-1.5 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Preview
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", viewportSize === 'mobile' && "text-primary")}
                onClick={() => setViewportSize('mobile')}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", viewportSize === 'tablet' && "text-primary")}
                onClick={() => setViewportSize('tablet')}
              >
                <Tablet className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", viewportSize === 'desktop' && "text-primary")}
                onClick={() => setViewportSize('desktop')}
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <div className="w-full h-[calc(100%-36px)] relative flex items-center justify-center bg-white">
            <div className={cn("h-full transition-all duration-300 ease-in-out overflow-auto", getViewportWidth())}>
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="loading-shimmer h-8 w-32 rounded-md" />
                </div>
              )}
            </div>
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
            {output || 'Kod çıktısı burada görünecek...'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultPanel;


import React, { useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import * as monaco from 'monaco-editor';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CodePanel: React.FC = () => {
  const { 
    code, 
    setCode, 
    language,
    activeFile,
    openFiles,
    closeFile,
    setActiveFile,
  } = useEditor();
  
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Create or update Monaco editor
  useEffect(() => {
    if (editorRef.current) {
      if (!monacoRef.current) {
        monacoRef.current = monaco.editor.create(editorRef.current, {
          value: code,
          language: getMonacoLanguage(language),
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: {
            enabled: false
          },
          scrollBeyondLastLine: false,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          tabSize: 2,
        });

        monacoRef.current.onDidChangeModelContent(() => {
          const value = monacoRef.current?.getValue() || '';
          setCode(value);
        });
      } else {
        const model = monacoRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, getMonacoLanguage(language));
        }
        monacoRef.current.setValue(code);
      }
    }

    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, [code, language, editorRef.current]);

  // Map our language codes to Monaco's language codes
  const getMonacoLanguage = (lang: string): string => {
    const mapping: Record<string, string> = {
      'javascript': 'javascript',
      'html': 'html',
      'css': 'css',
      'typescript': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript'
    };
    return mapping[lang] || 'plaintext';
  };

  // Get file extension for tab display
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop();
  };

  // Get appropriate icon for file type
  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    // Return appropriate icon based on file extension
    // For simplicity, not implemented here
    return null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {openFiles.length > 0 ? (
        <Tabs 
          value={activeFile} 
          onValueChange={setActiveFile}
          className="w-full h-full flex flex-col"
        >
          <div className="border-b flex">
            <TabsList className="h-9 bg-transparent p-0 overflow-x-auto">
              {openFiles.map(file => (
                <TabsTrigger
                  key={file}
                  value={file}
                  className="px-3 h-9 data-[state=active]:bg-background relative group"
                >
                  <div className="flex items-center gap-1.5">
                    {getFileIcon(file)}
                    <span className="truncate max-w-32">{file.split('/').pop()}</span>
                  </div>
                  <button
                    className="h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 bg-muted text-muted-foreground hover:bg-background flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file);
                    }}
                  >
                    ×
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {openFiles.map(file => (
            <TabsContent key={file} value={file} className="flex-grow p-0 m-0">
              <div
                ref={activeFile === file ? editorRef : undefined}
                className={cn(
                  "w-full h-full bg-editor text-editor-foreground",
                  "font-mono text-sm leading-relaxed"
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="max-w-xs">
            <h3 className="text-lg font-medium mb-2">No files open</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new file or open an existing one from the file explorer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodePanel;

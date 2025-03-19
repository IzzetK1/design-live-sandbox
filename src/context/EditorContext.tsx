
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { useFileSystem, FileStructure } from '../hooks/useFileSystem';
import { executeCode } from '../services/codeExecutionService';
import { useTheme, ThemeMode } from '../hooks/useTheme';

interface EditorContextProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  output: string;
  isProcessing: boolean;
  runCode: () => void;
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  theme: ThemeMode;
  toggleTheme: () => void;
  saveCode: () => void;
  loadCode: () => void;
  activeFile: string;
  setActiveFile: (file: string) => void;
  openFiles: string[];
  closeFile: (file: string) => void;
  projectFiles: FileStructure[];
  createNewFile: () => void;
  createNewFolder: () => void;
  expandedFolders: string[];
  toggleFolderExpand: (folderPath: string) => void;
  isFileExplorerOpen: boolean;
  toggleFileExplorer: () => void;
  projectName: string;
  updateProjectName: (name: string) => void;
}

const defaultCode = `
<!DOCTYPE html>
<html>
<head>
  <title>Hello World</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    h1 { color: #333; }
    .container {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 2rem;
      margin: 2rem 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    button {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <div class="container">
    <p>This is a live preview of your HTML code. Try editing it to see changes in real-time.</p>
    <button onclick="showMessage()">Click me</button>
  </div>
  
  <script>
    function showMessage() {
      alert('Button clicked!');
      console.log('Button was clicked at: ' + new Date().toLocaleTimeString());
    }
    
    console.log('Page loaded successfully!');
  </script>
</body>
</html>
`;

const EditorContext = createContext<EditorContextProps | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(defaultCode);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [language, setLanguage] = useState<string>('html');
  
  const { theme, toggleTheme } = useTheme();
  
  const handleFileContentChange = (content: string, lang: string) => {
    setCode(content);
    setLanguage(lang);
  };
  
  const fileSystem = useFileSystem(handleFileContentChange);
  
  useEffect(() => {
    const savedCode = localStorage.getItem('code');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedCode) setCode(savedCode);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const saveCode = () => {
    localStorage.setItem('code', code);
    localStorage.setItem('language', language);
    
    // If we have an active file, save the content to that file
    if (fileSystem.activeFile) {
      fileSystem.saveFileContent(fileSystem.activeFile, code);
    }
    
    toast.success("Kod başarıyla kaydedildi");
  };

  const loadCode = () => {
    const savedCode = localStorage.getItem('code');
    if (savedCode) {
      setCode(savedCode);
      toast.success("Kod başarıyla yüklendi");
    } else {
      toast.error("Kaydedilmiş kod bulunamadı");
    }
  };

  const runCode = async () => {
    setIsProcessing(true);
    const result = await executeCode(code, language);
    setOutput(result.output);
    setIsProcessing(false);
  };

  return (
    <EditorContext.Provider
      value={{
        code,
        setCode,
        output,
        isProcessing,
        runCode,
        apiKey,
        setApiKey,
        language,
        setLanguage,
        theme,
        toggleTheme,
        saveCode,
        loadCode,
        ...fileSystem
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

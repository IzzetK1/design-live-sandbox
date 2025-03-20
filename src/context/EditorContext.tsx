import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { useFileSystem, FileStructure } from '../hooks/useFileSystem';
import { executeCode, generateFromTemplate, generateTestCode } from '../services/codeExecutionService';
import { useTheme, ThemeMode } from '../hooks/useTheme';
import OllamaService, { ProjectTemplate } from '../services/ollamaService';

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
  useOllama: boolean;
  toggleOllamaMode: () => void;
  ollamaModels: string[];
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  isOllamaConnected: boolean;
  connectToOllama: () => Promise<void>;
  ollamaBaseUrl: string;
  setOllamaBaseUrl: React.Dispatch<React.SetStateAction<string>>;
  askOllama: (prompt: string) => Promise<string>;
  generateFromTemplate: (templateName: string, customDetails?: string) => Promise<string>;
  generateTestCode: (code: string) => Promise<string>;
  availableTemplates: ProjectTemplate[];
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
  
  const [useOllama, setUseOllama] = useState<boolean>(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3');
  const [isOllamaConnected, setIsOllamaConnected] = useState<boolean>(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434/api');
  const [availableTemplates, setAvailableTemplates] = useState<ProjectTemplate[]>([]);
  
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
    const savedUseOllama = localStorage.getItem('useOllama');
    const savedSelectedModel = localStorage.getItem('selectedModel');
    const savedOllamaBaseUrl = localStorage.getItem('ollamaBaseUrl');
    
    if (savedCode) setCode(savedCode);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedUseOllama) setUseOllama(savedUseOllama === 'true');
    if (savedSelectedModel) setSelectedModel(savedSelectedModel);
    if (savedOllamaBaseUrl) setOllamaBaseUrl(savedOllamaBaseUrl);
    
    if (savedUseOllama === 'true') {
      connectToOllama();
    }
  }, []);

  const saveCode = () => {
    localStorage.setItem('code', code);
    localStorage.setItem('language', language);
    
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
    setOutput('');
    try {
      const result = await executeCode(code, language, useOllama);
      setOutput(result.output);
    } catch (error) {
      if (error instanceof Error) {
        setOutput(`Hata: ${error.message}`);
      } else {
        setOutput("Bilinmeyen bir hata oluştu");
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleOllamaMode = () => {
    const newMode = !useOllama;
    setUseOllama(newMode);
    localStorage.setItem('useOllama', String(newMode));
    
    if (newMode && !isOllamaConnected) {
      connectToOllama();
    }
  };
  
  const connectToOllama = async () => {
    try {
      setIsOllamaConnected(false);
      const ollamaService = new OllamaService(ollamaBaseUrl);
      
      toast.loading("Ollama'ya bağlanılıyor...");
      const models = await ollamaService.getModels();
      
      if (models.length > 0) {
        setOllamaModels(models);
        
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
          localStorage.setItem('selectedModel', models[0]);
        }
        
        setIsOllamaConnected(true);
        localStorage.setItem('ollamaBaseUrl', ollamaBaseUrl);
        toast.success("Ollama'ya başarıyla bağlandı");
        
        const templates = ollamaService.getTemplates();
        setAvailableTemplates(templates);
      } else {
        toast.error("Ollama'da hiç model bulunamadı");
      }
    } catch (error) {
      let errorMessage = "Ollama'ya bağlanırken bir hata oluştu";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      console.error("Ollama connection error:", error);
    }
  };
  
  const askOllama = async (prompt: string): Promise<string> => {
    if (!isOllamaConnected) {
      toast.error("Önce Ollama'ya bağlanmalısınız");
      return "Önce Ollama'ya bağlanmalısınız";
    }
    
    try {
      toast.loading("Ollama'ya soruldu, yanıt bekleniyor...");
      const ollamaService = new OllamaService(ollamaBaseUrl);
      const response = await ollamaService.generateCompletion(prompt, selectedModel);
      toast.success("Ollama yanıt verdi");
      return response;
    } catch (error) {
      let errorMessage = "Ollama'dan yanıt alınırken bir hata oluştu";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      return errorMessage;
    }
  };
  
  const handleGenerateFromTemplate = async (templateName: string, customDetails: string = ""): Promise<string> => {
    if (!isOllamaConnected) {
      toast.error("Önce Ollama'ya bağlanmalısınız");
      return "Önce Ollama'ya bağlanmalısınız";
    }
    
    setIsProcessing(true);
    try {
      const result = await generateFromTemplate(templateName, customDetails);
      setOutput(result.output);
      return result.output;
    } catch (error) {
      let errorMessage = "Şablondan kod oluşturulurken bir hata oluştu";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      setOutput(errorMessage);
      return errorMessage;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleGenerateTestCode = async (codeToTest: string): Promise<string> => {
    if (!isOllamaConnected) {
      toast.error("Önce Ollama'ya bağlanmalısınız");
      return "Önce Ollama'ya bağlanmalısınız";
    }
    
    setIsProcessing(true);
    try {
      const result = await generateTestCode(codeToTest, language);
      setOutput(result.output);
      return result.output;
    } catch (error) {
      let errorMessage = "Test kodu oluşturulurken bir hata oluştu";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      setOutput(errorMessage);
      return errorMessage;
    } finally {
      setIsProcessing(false);
    }
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
        useOllama,
        toggleOllamaMode,
        ollamaModels,
        selectedModel,
        setSelectedModel,
        isOllamaConnected,
        connectToOllama,
        ollamaBaseUrl,
        setOllamaBaseUrl,
        askOllama,
        generateFromTemplate: handleGenerateFromTemplate,
        generateTestCode: handleGenerateTestCode,
        availableTemplates,
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

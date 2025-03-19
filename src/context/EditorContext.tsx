import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
}

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
  theme: 'light' | 'dark';
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

const defaultProjectFiles: FileStructure[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'App.js', type: 'file', content: 'function App() { return <div>Hello World</div>; }' },
          { name: 'Button.js', type: 'file', content: 'function Button() { return <button>Click me</button>; }' },
        ]
      },
      { name: 'index.js', type: 'file', content: 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./components/App";\n\nReactDOM.render(<App />, document.getElementById("root"));' },
      { name: 'styles.css', type: 'file', content: 'body { font-family: sans-serif; margin: 0; padding: 0; }' },
    ]
  },
  { name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>' },
  { name: 'package.json', type: 'file', content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^17.0.2",\n    "react-dom": "^17.0.2"\n  }\n}' },
];

const EditorContext = createContext<EditorContextProps | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(defaultCode);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [language, setLanguage] = useState<string>('html');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeFile, setActiveFile] = useState<string>('');
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [projectFiles, setProjectFiles] = useState<FileStructure[]>(defaultProjectFiles);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src', 'src/components']);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState<boolean>(true);
  const [projectName, setProjectName] = useState<string>('Untitled');
  
  const handleFileSelect = (filePath: string) => {
    setActiveFile(filePath);
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }
    
    const findFileContent = (files: FileStructure[], path: string): string | undefined => {
      const pathParts = path.split('/');
      const fileName = pathParts.pop();
      
      if (pathParts.length === 0) {
        const file = files.find(f => f.name === fileName && f.type === 'file');
        return file?.content;
      }
      
      const folderName = pathParts[0];
      const folder = files.find(f => f.name === folderName && f.type === 'folder');
      
      if (!folder || !folder.children) return undefined;
      
      return findFileContent(folder.children, pathParts.slice(1).join('/') + '/' + fileName);
    };
    
    const fileContent = findFileContent(projectFiles, filePath);
    if (fileContent) {
      setCode(fileContent);
      
      const extension = filePath.split('.').pop()?.toLowerCase();
      if (extension) {
        const extensionToLanguage: Record<string, string> = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'html': 'html',
          'css': 'css',
          'json': 'json',
          'md': 'markdown'
        };
        
        if (extensionToLanguage[extension]) {
          setLanguage(extensionToLanguage[extension]);
        }
      }
    }
  };
  
  const closeFile = (filePath: string) => {
    setOpenFiles(openFiles.filter(file => file !== filePath));
    if (activeFile === filePath) {
      setActiveFile(openFiles[openFiles.indexOf(filePath) - 1] || openFiles[0] || '');
    }
  };
  
  const createNewFile = () => {
    const newFileName = 'newFile.js';
    setProjectFiles([...projectFiles, {
      name: newFileName,
      type: 'file',
      content: '// New file content'
    }]);
    
    setActiveFile(newFileName);
    if (!openFiles.includes(newFileName)) {
      setOpenFiles([...openFiles, newFileName]);
    }
    
    setCode('// New file content');
    toast.success("Yeni dosya oluşturuldu");
  };
  
  const createNewFolder = () => {
    setProjectFiles([...projectFiles, {
      name: 'newFolder',
      type: 'folder',
      children: []
    }]);
    
    toast.success("Yeni klasör oluşturuldu");
  };
  
  const toggleFolderExpand = (folderPath: string) => {
    if (expandedFolders.includes(folderPath)) {
      setExpandedFolders(expandedFolders.filter(folder => folder !== folderPath));
    } else {
      setExpandedFolders([...expandedFolders, folderPath]);
    }
  };
  
  const toggleFileExplorer = () => {
    setIsFileExplorerOpen(!isFileExplorerOpen);
  };
  
  const updateProjectName = (name: string) => {
    setProjectName(name);
    localStorage.setItem('projectName', name);
    toast.success("Proje adı güncellendi");
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('code');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedLanguage = localStorage.getItem('language');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedProjectFiles = localStorage.getItem('projectFiles');
    const savedProjectName = localStorage.getItem('projectName');

    if (savedCode) setCode(savedCode);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme);
    if (savedProjectFiles) setProjectFiles(JSON.parse(savedProjectFiles));
    if (savedProjectName) setProjectName(savedProjectName);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const saveCode = () => {
    localStorage.setItem('code', code);
    localStorage.setItem('language', language);
    localStorage.setItem('projectFiles', JSON.stringify(projectFiles));
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
    if (!code.trim()) {
      toast.error("Lütfen önce biraz kod yazın");
      return;
    }

    setIsProcessing(true);
    
    try {
      setTimeout(() => {
        let result;
        
        try {
          const executeCode = new Function(code);
          
          const originalConsoleLog = console.log;
          const logs: string[] = [];
          
          console.log = (...args) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
            originalConsoleLog(...args);
          };
          
          result = executeCode();
          
          console.log = originalConsoleLog;
          
          setOutput(logs.length > 0 ? logs.join('\n') : String(result || ''));
          toast.success("Kod başarıyla çalıştırıldı");
        } catch (error) {
          if (error instanceof Error) {
            setOutput(`Hata: ${error.message}`);
            toast.error(`Hata: ${error.message}`);
          } else {
            setOutput(`Bilinmeyen bir hata oluştu`);
            toast.error("Bilinmeyen bir hata oluştu");
          }
        }
        
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof Error) {
        setOutput(`Hata: ${error.message}`);
        toast.error(`Hata: ${error.message}`);
      } else {
        setOutput(`Bilinmeyen bir hata oluştu`);
        toast.error("Bilinmeyen bir hata oluştu");
      }
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
        activeFile,
        setActiveFile: handleFileSelect,
        openFiles,
        closeFile,
        projectFiles,
        createNewFile,
        createNewFolder,
        expandedFolders,
        toggleFolderExpand,
        isFileExplorerOpen,
        toggleFileExplorer,
        projectName,
        updateProjectName
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

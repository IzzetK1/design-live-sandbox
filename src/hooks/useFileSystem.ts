
import { useState, useEffect } from 'react';
import { toast } from "sonner";

export interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
}

export interface FileSystemState {
  projectFiles: FileStructure[];
  activeFile: string;
  openFiles: string[];
  expandedFolders: string[];
  isFileExplorerOpen: boolean;
  projectName: string;
}

export interface FileSystemActions {
  setActiveFile: (file: string) => void;
  closeFile: (file: string) => void;
  createNewFile: () => void;
  createNewFolder: () => void;
  toggleFolderExpand: (folderPath: string) => void;
  toggleFileExplorer: () => void;
  updateProjectName: (name: string) => void;
  getFileContent: (filePath: string) => string | undefined;
  saveFileContent: (filePath: string, content: string) => void;
}

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

export function useFileSystem(onFileSelect?: (content: string, language: string) => void): FileSystemState & FileSystemActions {
  const [projectFiles, setProjectFiles] = useState<FileStructure[]>(defaultProjectFiles);
  const [activeFile, setActiveFile] = useState<string>('');
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src', 'src/components']);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState<boolean>(true);
  const [projectName, setProjectName] = useState<string>('Untitled');

  // Load saved state on mount
  useEffect(() => {
    const savedProjectFiles = localStorage.getItem('projectFiles');
    const savedProjectName = localStorage.getItem('projectName');

    if (savedProjectFiles) setProjectFiles(JSON.parse(savedProjectFiles));
    if (savedProjectName) setProjectName(savedProjectName);
  }, []);

  // Get file content for a given path
  const getFileContent = (filePath: string): string | undefined => {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    
    const findFileContent = (files: FileStructure[], path: string[]): string | undefined => {
      if (path.length === 0) {
        const file = files.find(f => f.name === fileName && f.type === 'file');
        return file?.content;
      }
      
      const folderName = path[0];
      const folder = files.find(f => f.name === folderName && f.type === 'folder');
      
      if (!folder || !folder.children) return undefined;
      
      return findFileContent(folder.children, path.slice(1));
    };
    
    return findFileContent(projectFiles, pathParts);
  };

  // Save file content
  const saveFileContent = (filePath: string, content: string): void => {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop() || '';
    
    const updateFileContent = (files: FileStructure[], path: string[]): FileStructure[] => {
      if (path.length === 0) {
        return files.map(file => {
          if (file.name === fileName && file.type === 'file') {
            return { ...file, content };
          }
          return file;
        });
      }
      
      const folderName = path[0];
      return files.map(file => {
        if (file.name === folderName && file.type === 'folder' && file.children) {
          return {
            ...file,
            children: updateFileContent(file.children, path.slice(1))
          };
        }
        return file;
      });
    };
    
    const updatedFiles = updateFileContent(projectFiles, pathParts);
    setProjectFiles(updatedFiles);
    localStorage.setItem('projectFiles', JSON.stringify(updatedFiles));
  };

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    const fileContent = getFileContent(filePath);
    
    if (fileContent) {
      setActiveFile(filePath);
      
      if (!openFiles.includes(filePath)) {
        setOpenFiles([...openFiles, filePath]);
      }
      
      if (onFileSelect) {
        const extension = filePath.split('.').pop()?.toLowerCase() || '';
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
        
        const language = extensionToLanguage[extension] || 'plaintext';
        onFileSelect(fileContent, language);
      }
    }
  };
  
  // Close a file tab
  const closeFile = (filePath: string) => {
    setOpenFiles(openFiles.filter(file => file !== filePath));
    if (activeFile === filePath) {
      setActiveFile(openFiles[openFiles.indexOf(filePath) - 1] || openFiles[0] || '');
      
      if (openFiles.length > 1) {
        const newActiveFile = openFiles[openFiles.indexOf(filePath) - 1] || openFiles[0];
        if (newActiveFile !== filePath) {
          const newFileContent = getFileContent(newActiveFile);
          const extension = newActiveFile.split('.').pop()?.toLowerCase() || '';
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
          
          const language = extensionToLanguage[extension] || 'plaintext';
          
          if (onFileSelect && newFileContent) {
            onFileSelect(newFileContent, language);
          }
        }
      }
    }
  };
  
  // Create a new file
  const createNewFile = () => {
    const newFileName = 'newFile.js';
    setProjectFiles([...projectFiles, {
      name: newFileName,
      type: 'file',
      content: '// New file content'
    }]);
    
    if (onFileSelect) {
      onFileSelect('// New file content', 'javascript');
    }
    
    setActiveFile(newFileName);
    if (!openFiles.includes(newFileName)) {
      setOpenFiles([...openFiles, newFileName]);
    }
    
    localStorage.setItem('projectFiles', JSON.stringify([...projectFiles, {
      name: newFileName,
      type: 'file',
      content: '// New file content'
    }]));
    
    toast.success("Yeni dosya oluşturuldu");
  };
  
  // Create a new folder
  const createNewFolder = () => {
    const newFolder = {
      name: 'newFolder',
      type: 'folder' as const,
      children: []
    };
    
    setProjectFiles([...projectFiles, newFolder]);
    localStorage.setItem('projectFiles', JSON.stringify([...projectFiles, newFolder]));
    toast.success("Yeni klasör oluşturuldu");
  };
  
  // Toggle folder expand/collapse
  const toggleFolderExpand = (folderPath: string) => {
    if (expandedFolders.includes(folderPath)) {
      setExpandedFolders(expandedFolders.filter(folder => folder !== folderPath));
    } else {
      setExpandedFolders([...expandedFolders, folderPath]);
    }
  };
  
  // Toggle file explorer visibility
  const toggleFileExplorer = () => {
    setIsFileExplorerOpen(!isFileExplorerOpen);
  };
  
  // Update project name
  const updateProjectName = (name: string) => {
    setProjectName(name);
    localStorage.setItem('projectName', name);
    toast.success("Proje adı güncellendi");
  };

  return {
    projectFiles,
    activeFile,
    openFiles,
    expandedFolders,
    isFileExplorerOpen,
    projectName,
    setActiveFile: handleFileSelect,
    closeFile,
    createNewFile,
    createNewFolder,
    toggleFolderExpand,
    toggleFileExplorer,
    updateProjectName,
    getFileContent,
    saveFileContent
  };
}

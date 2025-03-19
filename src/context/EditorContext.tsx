
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

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
}

const defaultCode = `// Write your code here
function greet() {
  return "Hello, world!";
}

console.log(greet());`;

const EditorContext = createContext<EditorContextProps | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(defaultCode);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load saved settings from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem('code');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedLanguage = localStorage.getItem('language');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

    if (savedCode) setCode(savedCode);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  // Apply theme when component mounts and when theme changes
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Save the current code to localStorage
  const saveCode = () => {
    localStorage.setItem('code', code);
    localStorage.setItem('language', language);
    toast.success("Code saved successfully");
  };

  // Load code from localStorage
  const loadCode = () => {
    const savedCode = localStorage.getItem('code');
    if (savedCode) {
      setCode(savedCode);
      toast.success("Code loaded successfully");
    } else {
      toast.error("No saved code found");
    }
  };

  // Function to run the code
  const runCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate processing for demo (will integrate with Ollama later)
      setTimeout(() => {
        // Simple JavaScript execution for demo purposes
        let result;
        
        try {
          // Use Function constructor to evaluate code safely
          const executeCode = new Function(code);
          
          // Capture console.log output
          const originalConsoleLog = console.log;
          const logs: string[] = [];
          
          console.log = (...args) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
            originalConsoleLog(...args);
          };
          
          // Execute the code
          result = executeCode();
          
          // Restore original console.log
          console.log = originalConsoleLog;
          
          // Set output to logged messages or result
          setOutput(logs.length > 0 ? logs.join('\n') : String(result || ''));
          toast.success("Code executed successfully");
        } catch (error) {
          if (error instanceof Error) {
            setOutput(`Error: ${error.message}`);
            toast.error(`Error: ${error.message}`);
          } else {
            setOutput(`Unknown error occurred`);
            toast.error("Unknown error occurred");
          }
        }
        
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
        toast.error(`Error: ${error.message}`);
      } else {
        setOutput(`Unknown error occurred`);
        toast.error("Unknown error occurred");
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
        loadCode
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

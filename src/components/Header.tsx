
import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Play, Save, Moon, Sun, Settings, 
  Code, FileCode, RotateCcw, Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { 
    runCode, 
    saveCode, 
    loadCode, 
    theme, 
    toggleTheme, 
    apiKey, 
    setApiKey,
    language,
    setLanguage
  } = useEditor();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out z-10">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo and app name */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Code className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-subtle" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Code<span className="text-primary">Preview</span>
          </h1>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-background p-1 gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "text-xs px-3 rounded transition-all duration-300",
                language === "javascript" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setLanguage("javascript")}
            >
              JavaScript
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "text-xs px-3 rounded transition-all duration-300",
                language === "html" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setLanguage("html")}
            >
              HTML
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "text-xs px-3 rounded transition-all duration-300",
                language === "css" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
              onClick={() => setLanguage("css")}
            >
              CSS
            </Button>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCode} 
            className="text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Load</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveCode} 
            className="text-xs flex items-center gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={runCode} 
            className="text-xs flex items-center gap-1"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Run</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="apiKey" className="text-right col-span-1">
                    Ollama API Key
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="col-span-3"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Your API key is stored locally and never sent to our servers.
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => {
                    localStorage.setItem('apiKey', apiKey);
                    setIsSettingsOpen(false);
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};

export default Header;

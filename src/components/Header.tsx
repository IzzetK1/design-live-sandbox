
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
  Code, FileCode, RotateCcw, Coffee,
  ChevronRight, FolderTree, Download,
  Share, Github, Menu, Bot, Link, CloudOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    setLanguage,
    toggleFileExplorer,
    isFileExplorerOpen,
    projectName,
    updateProjectName,
    useOllama,
    toggleOllamaMode,
    ollamaModels,
    selectedModel,
    setSelectedModel,
    isOllamaConnected,
    connectToOllama,
    ollamaBaseUrl,
    setOllamaBaseUrl,
  } = useEditor();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOllamaSettingsOpen, setIsOllamaSettingsOpen] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);

  const handleProjectNameSubmit = () => {
    updateProjectName(tempProjectName);
    setEditingProjectName(false);
  };

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out z-10">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo and app name */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground" 
            onClick={toggleFileExplorer}
          >
            {isFileExplorerOpen ? <Menu className="h-5 w-5" /> : <FolderTree className="h-5 w-5" />}
          </Button>
          
          <div className="relative">
            <Code className="h-7 w-7 text-primary" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-subtle" />
          </div>
          
          {editingProjectName ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProjectNameSubmit();
              }}
            >
              <Input
                value={tempProjectName}
                onChange={(e) => setTempProjectName(e.target.value)}
                className="h-7 text-lg"
                autoFocus
                onBlur={handleProjectNameSubmit}
              />
            </form>
          ) : (
            <h1 
              className="text-lg font-semibold tracking-tight cursor-pointer hover:underline" 
              onClick={() => setEditingProjectName(true)}
            >
              {projectName} <span className="text-primary">Preview</span>
            </h1>
          )}
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
          {/* Ollama Bağlantı Durumu */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOllamaSettingsOpen(true)}
            className={cn(
              "text-xs flex items-center gap-1",
              isOllamaConnected ? "border-green-500" : "border-orange-500"
            )}
          >
            {isOllamaConnected ? (
              <>
                <Bot className="h-3.5 w-3.5 text-green-500" />
                <span className="hidden sm:inline">Ollama: Bağlı</span>
              </>
            ) : (
              <>
                <CloudOff className="h-3.5 w-3.5 text-orange-500" />
                <span className="hidden sm:inline">Ollama: Bağlantı Yok</span>
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCode} 
            className="text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Yükle</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveCode} 
            className="text-xs flex items-center gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kaydet</span>
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={runCode} 
            className="text-xs flex items-center gap-1"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Çalıştır</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsOllamaSettingsOpen(true)}>
                <Bot className="h-4 w-4 mr-2" />
                Ollama Ayarları
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Projeyi İndir
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Github className="h-4 w-4 mr-2" />
                GitHub'a Bağla
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Ana Ayarlar Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ayarlar</DialogTitle>
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
                    placeholder="API anahtarınızı giriniz"
                    className="col-span-3"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  API anahtarınız yerel olarak saklanır ve asla sunucularımıza gönderilmez.
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
                  Ayarları Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Ollama Ayarları Dialog */}
          <Dialog open={isOllamaSettingsOpen} onOpenChange={setIsOllamaSettingsOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ollama Bağlantı Ayarları</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Ollama Modu */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ollama-mode" className="text-base">Ollama Modu</Label>
                    <p className="text-sm text-muted-foreground">
                      Kod çalıştırmak için Ollama'yı kullan
                    </p>
                  </div>
                  <Switch
                    id="ollama-mode"
                    checked={useOllama}
                    onCheckedChange={toggleOllamaMode}
                  />
                </div>

                <div className="space-y-4">
                  {/* Ollama API URL */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ollama-url" className="text-right">
                      Ollama API URL
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="ollama-url"
                        placeholder="http://localhost:11434/api"
                        value={ollamaBaseUrl}
                        onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Ollama API'nin çalıştığı URL (varsayılan: http://localhost:11434/api)
                      </p>
                    </div>
                  </div>

                  {/* Model Seçimi */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model-select" className="text-right">
                      Model
                    </Label>
                    <div className="col-span-3">
                      {ollamaModels.length > 0 ? (
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger id="model-select">
                            <SelectValue placeholder="Model seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {ollamaModels.map(model => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Henüz model listesi yok. Bağlantıyı test edin.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bağlantı Test Butonu */}
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={connectToOllama}
                      className="flex items-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      Bağlantıyı Test Et
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setIsOllamaSettingsOpen(false)}>
                  Kapat
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

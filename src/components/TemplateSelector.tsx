
import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Code, Component, FileCode, Loader2, Package, Store, Users } from 'lucide-react';
import { ProjectTemplate } from '../services/ollamaService';
import { toast } from 'sonner';

const TemplateSelector: React.FC = () => {
  const { isOllamaConnected, askOllama, setCode, language, setLanguage } = useEditor();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [customDetails, setCustomDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'component' | 'module' | 'application'>('component');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  
  useEffect(() => {
    if (isOllamaConnected) {
      const ollamaService = new (require('../services/ollamaService').default)();
      const availableTemplates = ollamaService.getTemplates();
      setTemplates(availableTemplates);
    }
  }, [isOllamaConnected]);
  
  const filteredTemplates = templates.filter(template => 
    template.type === activeTab && 
    (template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setCustomDetails('');
    setGeneratedCode('');
  };
  
  const getTemplateIcon = (template: ProjectTemplate) => {
    switch(template.name.toLowerCase()) {
      case 'erp müşteri modülü':
        return <Users className="h-8 w-8 text-blue-500" />;
      case 'erp stok yönetimi':
        return <Store className="h-8 w-8 text-green-500" />;
      case 'temel tablo bileşeni':
        return <Component className="h-8 w-8 text-purple-500" />;
      case 'form oluşturucu':
        return <FileCode className="h-8 w-8 text-orange-500" />;
      default:
        return <Code className="h-8 w-8 text-gray-500" />;
    }
  };
  
  const getComplexityColor = (complexity: string) => {
    switch(complexity) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const generateFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setGeneratedCode('');
    
    try {
      const ollamaService = new (require('../services/ollamaService').default)();
      const result = await ollamaService.generateFromTemplate(selectedTemplate.name, customDetails);
      
      setGeneratedCode(result);
      
      // Kod bloklarını ayıklayalım
      const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript)?\s*([\s\S]*?)```/g;
      let match;
      let extractedCode = '';
      
      while ((match = codeBlockRegex.exec(result)) !== null) {
        extractedCode += match[1] + '\n\n';
      }
      
      if (extractedCode.trim()) {
        setCode(extractedCode.trim());
        
        // Dil ayarını güncelle
        if (extractedCode.includes('import React') || extractedCode.includes('jsx')) {
          setLanguage('jsx');
        } else if (extractedCode.includes('typescript') || extractedCode.includes('interface') || extractedCode.includes(':')) {
          setLanguage('typescript');
        }
        
        toast.success("Şablondan kod oluşturuldu ve editöre aktarıldı");
      } else {
        toast.info("Kod bloğu bulunamadı, tam yanıt editöre aktarıldı");
        setCode(result);
      }
    } catch (error) {
      toast.error("Şablondan kod oluşturulurken bir hata oluştu");
      console.error("Template generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateTestCode = async () => {
    if (!generatedCode) {
      toast.error("Önce şablondan kod oluşturmalısınız");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const ollamaService = new (require('../services/ollamaService').default)();
      const testCode = await ollamaService.generateTests(generatedCode, language);
      
      // Test kodunu ekleyerek yeni kod oluşturuyoruz
      const updatedCode = `${generatedCode}\n\n// TEST KODU:\n${testCode}`;
      setCode(updatedCode);
      setGeneratedCode(updatedCode);
      
      toast.success("Test kodu oluşturuldu ve eklendi");
    } catch (error) {
      toast.error("Test kodu oluşturulurken bir hata oluştu");
      console.error("Test generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOllamaConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Code className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Ollama Bağlantısı Gerekli</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Kod şablonlarını kullanabilmek için önce Ollama servisine bağlanmanız gerekmektedir.
          Ayarlar panelinden Ollama bağlantısını yapılandırın.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Input
          placeholder="Şablon ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-grow flex flex-col">
        <div className="border-b px-3">
          <TabsList>
            <TabsTrigger value="component">Bileşenler</TabsTrigger>
            <TabsTrigger value="module">Modüller</TabsTrigger>
            <TabsTrigger value="application">Uygulamalar</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/2 border-r">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <Card
                      key={template.name}
                      className={cn(
                        "cursor-pointer hover:border-primary transition-colors",
                        selectedTemplate?.name === template.name && "border-primary"
                      )}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        {getTemplateIcon(template)}
                        <div className="space-x-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                        <CardDescription className="text-sm">{template.description}</CardDescription>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Badge className={cn("text-xs", getComplexityColor(template.complexity))}>
                          {template.complexity === 'basic' ? 'Basit' : 
                           template.complexity === 'intermediate' ? 'Orta' : 'Gelişmiş'}
                        </Badge>
                        {selectedTemplate?.name === template.name && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aramanızla eşleşen şablon bulunamadı.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="w-1/2 flex flex-col">
            {selectedTemplate ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium mb-1">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
                  
                  <Textarea
                    placeholder="Şablona eklemek istediğiniz özel detaylar..."
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    className="min-h-[100px] mb-3"
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={generateFromTemplate} 
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Oluşturuluyor...
                        </>
                      ) : (
                        <>
                          <Code className="h-4 w-4 mr-2" />
                          Kod Oluştur
                        </>
                      )}
                    </Button>
                    
                    {generatedCode && (
                      <Button 
                        onClick={generateTestCode} 
                        disabled={isGenerating} 
                        variant="outline"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCode className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {generatedCode && (
                  <ScrollArea className="flex-grow p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {generatedCode}
                    </pre>
                  </ScrollArea>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Code className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-2">Bir Şablon Seçin</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Başlamak için soldaki listeden bir şablon seçin.
                  Şablonlar, kod geliştirmenizi hızlandırmak için önceden hazırlanmış yapılardır.
                </p>
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default TemplateSelector;

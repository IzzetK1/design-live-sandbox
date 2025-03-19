
import React from 'react';
import { useEditor } from '../context/EditorContext';
import { Folder, File, ChevronRight, ChevronDown, Plus, FileCode, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const FileExplorer: React.FC = () => {
  const { 
    projectFiles, 
    setActiveFile, 
    activeFile,
    createNewFile,
    createNewFolder,
    expandedFolders,
    toggleFolderExpand
  } = useEditor();

  const renderFileTree = (files: any[], parentPath = '') => {
    return (
      <ul className="pl-4">
        {files.map((item) => {
          const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          
          if (item.type === 'folder') {
            const isExpanded = expandedFolders.includes(fullPath);
            return (
              <li key={fullPath} className="mb-1">
                <div 
                  className={cn(
                    "flex items-center py-1 px-2 rounded-md hover:bg-accent group cursor-pointer"
                  )}
                  onClick={() => toggleFolderExpand(fullPath)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  )}
                  <Folder className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                {isExpanded && item.children && renderFileTree(item.children, fullPath)}
              </li>
            );
          }
          
          return (
            <li key={fullPath}>
              <div 
                className={cn(
                  "flex items-center py-1 px-2 rounded-md hover:bg-accent group cursor-pointer ml-4",
                  activeFile === fullPath && "bg-accent font-medium"
                )}
                onClick={() => setActiveFile(fullPath)}
              >
                <FileCode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <span className="text-sm truncate">{item.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="text-sm font-medium">Explorer</h3>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNewFile}>
                <FileCode className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New File</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNewFolder}>
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Folder</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="overflow-auto p-2 flex-grow">
        {projectFiles.length > 0 ? (
          renderFileTree(projectFiles)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Folder className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No files yet</p>
            <Button variant="outline" size="sm" onClick={createNewFile} className="text-xs">
              <Plus className="h-3 w-3 mr-1" /> Create a file
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;

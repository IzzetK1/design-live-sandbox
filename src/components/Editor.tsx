
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import CodePanel from './CodePanel';
import ResultPanel from './ResultPanel';
import FileExplorer from './FileExplorer';
import { useEditor } from '../context/EditorContext';

const Editor: React.FC = () => {
  const { isFileExplorerOpen } = useEditor();

  return (
    <div className="w-full h-[calc(100vh-57px)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {isFileExplorerOpen && (
          <>
            <ResizablePanel defaultSize={15} minSize={10} maxSize={25} className="bg-secondary">
              <FileExplorer />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel defaultSize={50} minSize={30}>
          <CodePanel />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResultPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Editor;

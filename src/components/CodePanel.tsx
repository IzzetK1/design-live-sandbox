
import React, { useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { cn } from '@/lib/utils';

interface CodePanelProps {
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
}

const CodePanel: React.FC<CodePanelProps> = ({ width, setWidth }) => {
  const { code, setCode, language } = useEditor();
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle resize functionality
  useEffect(() => {
    const resizeHandle = resizeHandleRef.current;
    if (!resizeHandle) return;

    let startX = 0;
    let startWidth = 0;

    const onMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = width;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(30, Math.min(70, startWidth + ((e.clientX - startX) / window.innerWidth * 100)));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    resizeHandle.addEventListener('mousedown', onMouseDown);

    return () => {
      resizeHandle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [width, setWidth]);

  // Adjust textarea height to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [code]);

  return (
    <div 
      className={cn(
        "relative h-full overflow-hidden transition-all duration-300 ease-in-out",
        "bg-editor text-editor-foreground"
      )}
      style={{ width: `${width}%` }}
    >
      <div className="w-full h-full p-4 overflow-auto">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={cn(
            "w-full h-full resize-none outline-none",
            "bg-transparent font-mono text-sm leading-relaxed",
            "border-0 focus:ring-0",
            "transition-all duration-300"
          )}
          style={{ 
            tabSize: 2,
            lineHeight: 1.5,
            minHeight: '100%',
          }}
          spellCheck="false"
          placeholder="Write your code here..."
        />
      </div>
      
      {/* Resize handle */}
      <div 
        ref={resizeHandleRef}
        className="resize-handle"
      />
    </div>
  );
};

export default CodePanel;

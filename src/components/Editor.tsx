
import React, { useState } from 'react';
import CodePanel from './CodePanel';
import ResultPanel from './ResultPanel';

const Editor: React.FC = () => {
  const [codeWidth, setCodeWidth] = useState<number>(50); // Initial width percentage

  return (
    <div className="w-full h-[calc(100vh-57px)] flex overflow-hidden">
      <CodePanel width={codeWidth} setWidth={setCodeWidth} />
      <ResultPanel width={codeWidth} />
    </div>
  );
};

export default Editor;

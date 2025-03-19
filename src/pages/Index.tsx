
import React from 'react';
import { EditorProvider } from '../context/EditorContext';
import Header from '../components/Header';
import Editor from '../components/Editor';

const Index: React.FC = () => {
  return (
    <EditorProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <Editor />
      </div>
    </EditorProvider>
  );
};

export default Index;

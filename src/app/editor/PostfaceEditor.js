'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Importa os estilos do Quill

// eslint-disable-next-line no-unused-vars
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function PostfaceEditor() {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [postfaceContent, setPostfaceContent] = useState('');

  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4 text-brazil-blue">Editor de Posfácio</h3>
      <p className="text-gray-600 mb-4">Adicione o conteúdo do posfácio do seu e-book aqui.</p>
      {editorLoaded ? (
        <ReactQuill theme="snow" className="h-96 mb-4" value={postfaceContent} onChange={setPostfaceContent} />
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-500">Carregando editor...</div>
      )}
      <button
        className="mt-4 bg-brazil-blue text-brazil-white hover:bg-brazil-green font-bold py-2 px-4 rounded-full transition duration-300"
      >
        Salvar Posfácio
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function TableOfContentsEditor({ ebookContent }) {
  const [toc, setToc] = useState([]);

  useEffect(() => {
    if (ebookContent) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ebookContent, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const newToc = Array.from(headings).map((heading, index) => ({
        id: `heading-${index}`,
        text: heading.textContent,
        level: parseInt(heading.tagName.substring(1)),
      }));
      setToc(newToc);
    }
  }, [ebookContent]);

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4 text-brazil-blue">Editor de Índice Descritivo</h3>

      {toc.length === 0 ? (
        <p className="text-gray-600">Nenhum título encontrado no conteúdo do e-book para gerar o índice.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-700 font-semibold mb-2">Estrutura do Índice:</p>
          <ul className="list-disc list-inside">
            {toc.map((item) => (
              <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 20}px` }} className="text-gray-800">
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botão para Salvar/Gerar Índice - funcionalidade futura */}
      <button
        className="mt-4 bg-brazil-blue text-brazil-white hover:bg-brazil-green font-bold py-2 px-4 rounded-full transition duration-300"
      >
        Salvar Índice
      </button>
    </div>
  );
}
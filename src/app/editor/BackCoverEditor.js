'use client';

import { useState } from 'react';

export default function BackCoverEditor() {
  const [synopsis, setSynopsis] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [testimonials, setTestimonials] = useState(''); // Placeholder para múltiplos depoimentos

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4 text-brazil-blue">Editor de Contracapa</h3>

      <div className="mb-4">
        <label htmlFor="synopsis" className="block text-gray-700 text-sm font-bold mb-2">Sinopse do E-book:</label>
        <textarea
          id="synopsis"
          rows="6"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
        ></textarea>
      </div>

      <div className="mb-4">
        <label htmlFor="authorBio" className="block text-gray-700 text-sm font-bold mb-2">Biografia do Autor:</label>
        <textarea
          id="authorBio"
          rows="4"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={authorBio}
          onChange={(e) => setAuthorBio(e.target.value)}
        ></textarea>
      </div>

      <div className="mb-4">
        <label htmlFor="testimonials" className="block text-gray-700 text-sm font-bold mb-2">Depoimentos (opcional):</label>
        <textarea
          id="testimonials"
          rows="3"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={testimonials}
          onChange={(e) => setTestimonials(e.target.value)}
          placeholder="Adicione depoimentos separados por linha ou ponto e vírgula."
        ></textarea>
      </div>

      {/* Botão para Salvar/Gerar Contracapa - funcionalidade futura */}
      <button
        className="bg-brazil-blue text-brazil-white hover:bg-brazil-green font-bold py-2 px-4 rounded-full transition duration-300"
      >
        Salvar Contracapa
      </button>
    </div>
  );
}
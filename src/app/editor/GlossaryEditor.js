'use client';

import { useState } from 'react';

export default function GlossaryEditor() {
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');

  const handleAddTerm = () => {
    if (newTerm.trim() && newDefinition.trim()) {
      setTerms([...terms, { term: newTerm, definition: newDefinition }]);
      setNewTerm('');
      setNewDefinition('');
    } else {
      alert("Por favor, preencha o termo e a definição.");
    }
  };

  const handleRemoveTerm = (index) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4 text-brazil-blue">Editor de Glossário</h3>
      <p className="text-gray-600 mb-4">Adicione termos e suas definições para o glossário do seu e-book.</p>

      <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-md">
        <div className="mb-2">
          <label htmlFor="newTerm" className="block text-gray-700 text-sm font-bold mb-2">Termo:</label>
          <input
            type="text"
            id="newTerm"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="newDefinition" className="block text-gray-700 text-sm font-bold mb-2">Definição:</label>
          <textarea
            id="newDefinition"
            rows="3"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newDefinition}
            onChange={(e) => setNewDefinition(e.target.value)}
          ></textarea>
        </div>
        <button
          onClick={handleAddTerm}
          className="bg-brazil-blue text-brazil-white hover:bg-brazil-green font-bold py-2 px-4 rounded-full transition duration-300"
        >
          Adicionar Termo
        </button>
      </div>

      {terms.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold mb-2 text-brazil-blue">Termos Adicionados:</h4>
          <ul className="space-y-2">
            {terms.map((item, index) => (
              <li key={index} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                <div>
                  <strong className="text-gray-800">{item.term}:</strong> {item.definition}
                </div>
                <button
                  onClick={() => handleRemoveTerm(index)}
                  className="text-red-500 hover:text-red-700 font-bold py-1 px-2 rounded-full transition duration-300"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botão para Salvar Glossário - funcionalidade futura */}
      <button
        className="mt-6 bg-brazil-blue text-brazil-white hover:bg-brazil-green font-bold py-2 px-4 rounded-full transition duration-300"
      >
        Salvar Glossário
      </button>
    </div>
  );
}

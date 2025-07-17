'use client';

export default function CoverEditor() {
  return (
    <div className="p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h3 className="text-xl font-bold mb-4 text-brazil-blue">Editor de Capa</h3>

      <div className="mb-4">
        <label htmlFor="coverTitle">Título da Capa:</label>
        <input type="text" id="coverTitle" />
      </div>

      <div className="mb-4">
        <label htmlFor="author">Autor:</label>
        <input type="text" id="author" />
      </div>

      <div className="mb-4">
        <label htmlFor="subtitle">Subtítulo:</label>
        <input type="text" id="subtitle" />
      </div>

      <div className="mb-4">
        <label htmlFor="coverImage">Imagem da Capa:</label>
        <input type="file" id="coverImage" accept="image/*" />
      </div>

      <button className="mt-4 bg-brazil-green text-brazil-white hover:bg-brazil-blue font-bold py-2 px-4 rounded-full transition duration-300">Salvar Capa</button>
    </div>
  );
}
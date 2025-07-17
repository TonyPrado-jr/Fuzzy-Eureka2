'use client';

export default function DevelopmentPage() {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white font-sans">
            <div className="text-center p-8">
                <h1 className="text-5xl font-bold text-brazil-green mb-4">EbookStark</h1>
                <h2 className="text-3xl font-light text-gray-300 mb-8">Em Breve</h2>
                
                <div className="max-w-2xl mx-auto bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
                    <p className="text-lg text-gray-400">
                        Nossa plataforma de criação de e-books com inteligência artificial está em fase final de desenvolvimento.
                    </p>
                    <p className="text-lg text-gray-400 mt-4">
                        Estamos trabalhando nos últimos detalhes para oferecer a você a melhor experiência.
                    </p>
                    <div className="mt-8 border-t border-gray-700 pt-6">
                        <p className="text-sm text-gray-500">Para mais informações, entre em contato: <a href="mailto:contato@ebookstark.com" className="text-brazil-blue hover:underline">contato@ebookstark.com</a></p>
                    </div>
                </div>

                <footer className="mt-12 text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} EbookStark. Todos os direitos reservados.</p>
                </footer>
            </div>
        </div>
    );
}
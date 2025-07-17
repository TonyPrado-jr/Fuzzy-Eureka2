'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MyEbooksPage() {
    const router = useRouter();
    const [ebooks, setEbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEbooks = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Sessão expirada. Por favor, faça login novamente.');
                router.push('/login');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/ebooks', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401 || response.status === 403) {
                    throw new Error('Não autorizado. Faça login novamente.');
                }

                if (!response.ok) {
                    throw new Error('Falha ao buscar seus e-books.');
                }

                const data = await response.json();
                setEbooks(data);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
                if (err.message.includes('Não autorizado')) {
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEbooks();
    }, [router]);

    const handleCreateNew = () => {
        router.push('/editor');
    };

    const handleEdit = (ebookId) => {
        router.push(`/editor?id=${ebookId}`);
    };

    const handleDelete = async (ebookId) => {
        if (!window.confirm('Tem certeza de que deseja excluir este e-book? Esta ação não pode ser desfeita.')) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            toast.info('Excluindo e-book...');
            const response = await fetch(`http://localhost:5000/api/ebooks/${ebookId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao excluir o e-book.');
            }

            toast.success('E-book excluído com sucesso!');
            // Remove o e-book da lista na UI
            setEbooks(ebooks.filter(ebook => ebook.id !== ebookId));

        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return <div className="text-center py-10">Carregando seus e-books...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Erro: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-brazil-blue">Meus E-books</h1>
                    <button
                        onClick={handleCreateNew}
                        className="bg-brazil-green text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 font-semibold"
                    >
                        Criar Novo E-book
                    </button>
                </div>

                {ebooks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <p className="text-gray-600">Você ainda não tem e-books.</p>
                        <p className="text-gray-500 text-sm mt-2">Clique em "Criar Novo E-book" para começar sua jornada!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ebooks.map((ebook) => (
                            <div key={ebook.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 truncate">{ebook.title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{ebook.subject}</p>
                                    <p className="text-xs text-gray-400 mt-2">Última atualização: {new Date(ebook.updated_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        onClick={() => handleEdit(ebook.id)}
                                        className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 text-sm transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ebook.id)}
                                        className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}
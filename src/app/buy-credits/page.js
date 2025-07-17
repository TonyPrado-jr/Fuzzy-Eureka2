'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const creditPacks = [
    {
        amount: 50,
        price: 'R$ 9,90',
        description: 'Ideal para pequenas revisões e gerações.',
        color: 'bg-teal-500',
        hoverColor: 'hover:bg-teal-600'
    },
    {
        amount: 150,
        price: 'R$ 24,90',
        description: 'Bom para projetos de médio porte.',
        color: 'bg-cyan-500',
        hoverColor: 'hover:bg-cyan-600'
    },
    {
        amount: 300,
        price: 'R$ 44,90',
        description: 'O melhor custo-benefício para grandes projetos.',
        color: 'bg-sky-500',
        hoverColor: 'hover:bg-sky-600'
    }
];

export default function BuyCreditsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleBuyCredits = async (amount) => {
        setLoading(true);
        toast.info(`Processando a compra de ${amount} créditos...`);

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para comprar créditos.');
            router.push('/login');
            setLoading(false);
            return;
        }

        // Novamente, a integração com o gateway de pagamento viria aqui.

        try {
            const response = await fetch('http://localhost:5000/api/user/credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao processar a compra.');
            }

            toast.success(data.message);
            router.push('/my-ebooks'); // Redireciona após a compra

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <main className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Comprar Créditos</h1>
                <p className="text-center text-gray-600 mb-10">Ficou sem créditos? Recarregue e continue criando.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {creditPacks.map((pack) => (
                        <div key={pack.amount} className="bg-white rounded-lg shadow-lg p-6 flex flex-col text-center">
                            <div className="mb-4">
                                <img src="/images/gold-coin.png" alt="Moeda de Crédito" className="w-20 h-20 mx-auto"/>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">{pack.amount} Créditos</h2>
                            <p className="text-3xl font-bold my-4 text-gray-900">{pack.price}</p>
                            <p className="text-gray-500 mb-6 flex-grow">{pack.description}</p>
                            <button
                                onClick={() => handleBuyCredits(pack.amount)}
                                disabled={loading}
                                className={`w-full text-white font-bold py-3 rounded-md transition-colors duration-300 ${pack.color} ${pack.hoverColor} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {loading ? 'Processando...' : 'Comprar Agora'}
                            </button>
                        </div>
                    ))}
                </div>
            </main>
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}
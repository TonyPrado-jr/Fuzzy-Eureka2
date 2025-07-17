'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const plans = [
    {
        name: 'Básico',
        apiName: 'basic',
        price: 'R$ 19,90',
        features: [
            '100 Créditos Iniciais',
            'Até 30 páginas por e-book',
            'Suporte por Email'
        ],
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600'
    },
    {
        name: 'Intermediário',
        apiName: 'intermediate',
        price: 'R$ 39,90',
        features: [
            '250 Créditos Iniciais',
            'Até 50 páginas por e-book',
            'Ganhe créditos ao compartilhar',
            'Suporte Prioritário'
        ],
        color: 'bg-indigo-500',
        hoverColor: 'hover:bg-indigo-600'
    },
    {
        name: 'Premium Stark',
        apiName: 'platinum',
        price: 'R$ 59,90',
        features: [
            '600 Créditos Iniciais',
            'Páginas Ilimitadas',
            'Ganhe créditos ao compartilhar',
            'Acesso a todos os recursos'
        ],
        color: 'bg-purple-600',
        hoverColor: 'hover:bg-purple-700'
    }
];

export default function UpgradePlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (planApiName) => {
        setLoading(true);
        toast.info(`Processando upgrade para o plano ${planApiName}...`);

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para fazer um upgrade.');
            router.push('/login');
            setLoading(false);
            return;
        }

        // Em um cenário real, aqui você integraria com um gateway de pagamento (Stripe, PagSeguro, etc.)
        // Após o pagamento ser confirmado, a API do backend seria chamada.

        try {
            const response = await fetch('http://localhost:5000/api/user/plan', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ newPlan: planApiName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao processar o upgrade.');
            }

            toast.success(data.message);
            // Opcional: redirecionar para a página de perfil ou dashboard
            router.push('/my-ebooks');

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <main className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Faça um Upgrade no seu Plano</h1>
                <p className="text-center text-gray-600 mb-10">Escolha o plano que melhor se adapta às suas necessidades.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
                            <h2 className={`text-2xl font-bold text-white text-center py-3 rounded-t-lg -mt-6 -mx-6 ${plan.color}`}>{plan.name}</h2>
                            <p className="text-4xl font-bold text-center my-6 text-gray-800">{plan.price}</p>
                            <ul className="space-y-3 text-gray-600 mb-8 flex-grow">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleUpgrade(plan.apiName)}
                                disabled={loading}
                                className={`w-full text-white font-bold py-3 rounded-md transition-colors duration-300 ${plan.color} ${plan.hoverColor} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {loading ? 'Processando...' : 'Fazer Upgrade'}
                            </button>
                        </div>
                    ))}
                </div>
            </main>
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}
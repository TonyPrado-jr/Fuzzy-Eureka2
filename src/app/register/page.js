'use client';

import { useState, useEffect } from 'react'; // Importa useEffect
import { useRouter, useSearchParams } from 'next/navigation'; // Importa useSearchParams
import Link from 'next/link';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [plan, setPlan] = useState('free'); // 'free' como padrão
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook para ler parâmetros da URL

    useEffect(() => {
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl) {
            setPlan(planFromUrl);
        }
    }, [searchParams]); // Executa quando searchParams muda

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, email, password, plan }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message + ' Você pode fazer login agora.');
                setFirstName('');
                setLastName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                router.push('/login'); // Redireciona para a página de login
                // Não reseta o plano aqui para manter o pré-selecionado se o usuário não mudar
            } else {
                setError(data.message || 'Erro ao registrar. Tente novamente.');
            }
        } catch (err) {
            console.error('Erro de rede ou servidor:', err);
            setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div style={{
                backgroundColor: '#fff',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    marginBottom: '20px',
                    color: '#333',
                    fontSize: '24px'
                }}>Cadastro</h1>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Nome"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <input
                        type="text"
                        placeholder="Sobrenome"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <input
                        type="password"
                        placeholder="Confirme sua Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                    >
                        <option value="free">Plano Grátis (30 dias)</option>
                        <option value="basic">Plano Básico (90 dias)</option>
                        <option value="intermediate">Plano Intermediário (120 dias)</option>
                        <option value="platinum">Plano Premium Stark (01 ano)</option>
                    </select>

                    {error && <p style={{ color: 'red', fontSize: '14px', margin: '0' }}>{error}</p>}
                    {success && <p style={{ color: 'green', fontSize: '14px', margin: '0' }}>{success}</p>}
                    <button
                        type="submit"
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        Cadastrar
                    </button>
                </form>
                <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
                    Já tem uma conta?{' '}
                    <Link href="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                        Faça Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

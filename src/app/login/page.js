'use client'; // Indica que este é um Client Component no Next.js 13+

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importa useRouter de next/navigation
import Link from 'next/link'; // Importa Link para navegação

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                localStorage.setItem('token', data.token); // Armazena o token
                localStorage.setItem('userEmail', data.user.email); // Armazena o email do usuário
                router.push('/editor'); // Redireciona para a página de edição
            } else {
                // Erro no login
                setError(data.message || 'Erro ao fazer login. Tente novamente.');
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
                }}>Login</h1>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '16px'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '16px'
                        }}
                    />
                    {error && <p style={{ color: 'red', fontSize: '14px', margin: '0' }}>{error}</p>}
                    <button
                        type="submit"
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '18px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        Entrar
                    </button>
                </form>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#007bff', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    Esqueceu a Senha?
                </p>
                <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
                    Ainda não tem uma conta?{' '}
                    <Link href="/register" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </div>
    );
}
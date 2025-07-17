'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation'; // Importa useRouter
import { useState, useEffect } from 'react'; // Importa useState e useEffect

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter(); // Inicializa useRouter
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determina se os botões de autenticação e links de recursos/planos devem ser mostrados
  const showAuthButtonsAndLinks = pathname !== '/editor' && pathname !== '/login' && pathname !== '/register';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (pathname === '/editor' && token) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/user/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            setUser(data.user);
          } else {
            console.error('Erro ao buscar dados do usuário na Navbar:', data.message);
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            router.push('/login'); // Redireciona se o token for inválido
          }
        } catch (error) {
          console.error('Erro de rede ao buscar dados do usuário na Navbar:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          router.push('/login');
        } finally {
          setLoading(false);
        }
      };
      fetchUserProfile();
    } else {
      setLoading(false);
      setUser(null); // Limpa o usuário se não estiver na página do editor ou não tiver token
    }
  }, [pathname, router]); // Dependências: pathname e router

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    router.push('/'); // Redireciona para a página inicial
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-0">
          <span className="text-3xl font-bold text-brazil-blue">EbookStark</span>
          <Image src="/images/Lobo-removebg-preview.png" alt="Logo EbookStark - Filhote de Lobo Branco" width={80} height={80} />
        </Link>
        <div className="space-x-4 flex items-center"> {/* Adicionado flex items-center para alinhar */}
          {showAuthButtonsAndLinks && (
            <>
              <Link href="/#recursos" className="text-brazil-blue hover:text-brazil-green transition-colors duration-300">
                Recursos
              </Link>
              <Link href="#planos" className="text-brazil-blue hover:text-brazil-green transition-colors duration-300">
                Planos
              </Link>
              <Link href="/login" className="text-brazil-blue hover:text-brazil-green transition-colors duration-300">
                Login
              </Link>
              <Link href="/register" className="bg-brazil-green text-brazil-white px-4 py-2 rounded-md hover:bg-brazil-blue transition-colors duration-300">
                Cadastre-se
              </Link>
            </>
          )}

          {pathname === '/editor' && !loading && user && (
            <>
              <div className="flex flex-col items-end mr-4">
                <span className="text-lg font-semibold text-gray-700">{user.first_name} {user.last_name}</span>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Plano: {user.plan}</span>
                  <Link href="/planos" className="ml-2 text-brazil-blue hover:underline">
                    Alterar Plano
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-center mr-4">
                <span className="text-xs text-gray-500">Créditos</span>
                <div className="flex items-center space-x-1">
                  <Image src="/images/gold-coin.png" alt="Moeda de Crédito" width={24} height={24} />
                  <span className="text-lg font-bold text-brazil-green">{user.credits}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
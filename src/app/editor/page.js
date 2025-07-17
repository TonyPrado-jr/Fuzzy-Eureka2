'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function EditorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('content');
    const [subject, setSubject] = useState('');
    const [title, setTitle] = useState('');
    const [mainContent, setMainContent] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [summaryContent, setSummaryContent] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [dedicationContent, setDedicationContent] = useState('');
    const [acknowledgementsContent, setAcknowledgementsContent] = useState('');
    const [bibliographyContent, setBibliographyContent] = useState('');
    const [showEditorContent, setShowEditorContent] = useState(true); // Novo estado para controlar a visibilidade da área de edição
    const [userPlan, setUserPlan] = useState('free'); // Placeholder: Em um cenário real, viria do backend
    const [ebookId, setEbookId] = useState(null); // Novo estado para o ID do e-book
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const ebookId = params.get('id');

        if (ebookId) {
            const fetchEbookData = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/ebooks/${ebookId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('E-book não encontrado ou você não tem permissão para editá-lo.');
                    }
                    const data = await response.json();
                    // Preencher todos os estados com os dados do e-book
                    setTitle(data.title || '');
                    setSubject(data.subject || '');
                    setMainContent(data.main_content || '');
                    setCoverImageUrl(data.cover_image_url || '');
                    setSummaryContent(data.summary_content || '');
                    setAuthorName(data.author_name || '');
                    setDedicationContent(data.dedication_content || '');
                    setAcknowledgementsContent(data.acknowledgements_content || '');
                    setBibliographyContent(data.bibliography_content || '');
                    toast.success(`Editando o e-book: ${data.title}`);
                } catch (err) {
                    toast.error(err.message);
                    router.push('/my-ebooks'); // Redireciona se houver erro
                }
            };
            fetchEbookData();
        }

        setLoading(false);
    }, [router]);

    const handleDownloadClick = () => {
        setShowEditorContent(false);
        setActiveSection('download');
    };

    const handleFinalDownload = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para fazer o download.');
            router.push('/login');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const ebookId = params.get('id');
        if (!ebookId) {
            toast.error('Não foi possível identificar o e-book. Salve seu trabalho primeiro.');
            return;
        }

        try {
            // Etapa 1: Deduzir créditos se for plano gratuito
            if (userPlan === 'free') {
                const creditResponse = await fetch('http://localhost:5000/api/process-download', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ plan: userPlan }),
                });

                const creditData = await creditResponse.json();
                if (!creditResponse.ok) {
                    throw new Error(creditData.message || 'Falha na verificação de créditos.');
                }
                toast.info('Créditos deduzidos. Iniciando o download da prévia...');
            }

            // Etapa 2: Chamar a rota de download do PDF
            toast.info('Preparando seu e-book para download...');
            const downloadResponse = await fetch(`http://localhost:5000/api/ebooks/${ebookId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!downloadResponse.ok) {
                throw new Error('Não foi possível gerar o PDF do seu e-book.');
            }

            // Etapa 3: Iniciar o download no navegador
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/\s+/g, '_') || 'ebook'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Download do e-book iniciado com sucesso!');

        } catch (error) {
            console.error('Erro no processo de download:', error);
            toast.error(error.message || 'Ocorreu um erro durante o download.');
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para salvar.');
            router.push('/login');
            return;
        }

        if (!title || !subject) {
            toast.error('Por favor, preencha o Assunto e o Título do E-book antes de salvar.');
            return;
        }

        const ebookData = {
            ebookId: ebookId, // Será null para novos e-books, ou o ID para edição
            title,
            subject,
            mainContent,
            coverImageUrl,
            summaryContent,
            authorName,
            dedicationContent,
            acknowledgementsContent,
            bibliographyContent,
        };

        try {
            toast.info('Salvando seu e-book...');
            const response = await fetch('http://localhost:5000/api/ebooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(ebookData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                if (data.ebook && data.ebook.id) {
                    setEbookId(data.ebook.id); // Atualiza o ID se for um novo e-book
                }
            } else {
                throw new Error(data.message || 'Erro ao salvar o e-book.');
            }
        } catch (err) {
            console.error('Erro ao salvar e-book:', err);
            toast.error(err.message || 'Erro de conexão ao salvar o e-book.');
        }
    };

    const handleGenerateEbook = async () => {
        if (!subject || !title) {
            toast.error('Por favor, preencha o Assunto e o Título do E-book.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para gerar um e-book.');
            router.push('/login');
            return;
        }

        try {
            toast.info('Gerando conteúdo do e-book com IA... Isso pode levar alguns segundos.');
            const response = await fetch('http://localhost:5000/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, title }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Conteúdo gerado recebido:', data.generatedContent);
                setMainContent(data.generatedContent);
                toast.success('Conteúdo do e-book gerado com sucesso! 5 créditos deduzidos.');
                // Atualizar créditos na Navbar se necessário (pode ser feito via contexto ou refetch)
            } else {
                toast.error(data.message || 'Erro ao gerar conteúdo do e-book.');
            }
        } catch (error) {
            console.error('Erro de rede ao gerar conteúdo do e-book:', error);
            toast.error('Erro de conexão ao gerar conteúdo do e-book.');
        }
    };

    const handleCoverImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImageUrl(reader.result);
                toast.success("Imagem da capa carregada com sucesso!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateCoverAI = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para gerar uma capa.');
            router.push('/login');
            return;
        }

        try {
            toast.info('Gerando sugestão de capa com IA... Isso pode levar alguns segundos.');
            const response = await fetch('http://localhost:5000/api/generate-cover', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, title }), // Envia o contexto para a IA
            });

            const data = await response.json();

            if (response.ok) {
                setCoverImageUrl(data.generatedCoverUrl);
                toast.success('Sugestão de capa gerada com sucesso! 25 créditos deduzidos.');
                // Atualizar créditos na Navbar
            } else {
                toast.error(data.message || 'Erro ao gerar sugestão de capa.');
            }
        } catch (error) {
            console.error('Erro de rede ao gerar capa:', error);
            toast.error('Erro de conexão ao gerar a capa.');
        }
    };

    const handleGenerateSummaryAI = async () => {
        if (!mainContent) {
            toast.error('É necessário ter um conteúdo principal para gerar o resumo.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para gerar um resumo.');
            router.push('/login');
            return;
        }

        try {
            toast.info('Gerando resumo com IA...');
            const response = await fetch('http://localhost:5000/api/generate-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ mainContent, subject, title }),
            });

            const data = await response.json();

            if (response.ok) {
                setSummaryContent(data.generatedSummary);
                setAuthorName(data.generatedAuthorName);
                toast.success('Resumo gerado com sucesso! 10 créditos deduzidos.');
                // Atualizar créditos na Navbar
            } else {
                toast.error(data.message || 'Erro ao gerar o resumo.');
            }
        } catch (error) {
            console.error('Erro de rede ao gerar resumo:', error);
            toast.error('Erro de conexão ao gerar o resumo.');
        }
    };

    const handleShareOnEbookStark = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Você precisa estar logado para compartilhar.');
            router.push('/login');
            return;
        }

        // Simulação de dados do e-book. Em um cenário real, você teria o ID do e-book.
        const ebookData = {
            ebook_id: 1, // Placeholder
            title: title,
            summary: summaryContent,
            cover_image_url: coverImageUrl,
        };

        if (!ebookData.title || !ebookData.summary || !ebookData.cover_image_url) {
            toast.error('Para compartilhar, seu e-book precisa ter um título, um resumo e uma imagem de capa.');
            return;
        }

        try {
            toast.info('Compartilhando seu e-book na plataforma...');
            const response = await fetch('http://localhost:5000/api/share-ebook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(ebookData),
            });

            const data = await response.json();

            if (response.ok) {
                let successMessage = "Muito obrigado por compartilhar na EbookStark!";
                if (data.creditsAwarded > 0) {
                    successMessage += ` Você ganhou ${data.creditsAwarded} créditos.`;
                }
                toast.success(successMessage);
                // Atualizar créditos na Navbar
            } else {
                toast.error(data.message || 'Erro ao compartilhar o e-book.');
            }
        } catch (error) {
            console.error('Erro de rede ao compartilhar e-book:', error);
            toast.error('Erro de conexão ao compartilhar o e-book.');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100">Carregando editor...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Esquerda */}
            <aside className="w-64 bg-white p-4 shadow-md flex flex-col space-y-2">
                <h2 className="text-xl font-bold mb-4 text-brazil-blue">Seu E-book</h2>
                <button
                    onClick={() => setActiveSection('content')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'content' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Conteúdo
                </button>
                <button
                    onClick={() => setActiveSection('cover')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'cover' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Capa
                </button>
                <button
                    onClick={() => setActiveSection('summary')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'summary' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Resumo
                </button>
                <button
                    onClick={() => setActiveSection('index')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'index' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Índice
                </button>
                <button
                    onClick={() => setActiveSection('dedication')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'dedication' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Dedicatória
                </button>
                <button
                    onClick={() => setActiveSection('acknowledgements')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'acknowledgements' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Agradecimentos
                </button>
                <button
                    onClick={() => setActiveSection('bibliography')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'bibliography' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Bibliografia
                </button>
                <button
                    onClick={() => setActiveSection('download')}
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'download' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Download
                </button>
                <button
                    onClick={() => setActiveSection('share')} // Novo botão para a seção de compartilhamento
                    className={`text-left px-4 py-2 rounded-md transition-colors duration-300 ${activeSection === 'share' ? 'bg-brazil-blue text-white' : 'text-brazil-blue hover:bg-gray-200'}`}
                >
                    Compartilhar
                </button>

                {/* Seção Comprar Créditos */}
                <div className="mt-auto pt-4 border-t border-gray-200">
                    <div 
                        onClick={() => router.push('/buy-credits')} 
                        className="flex items-center space-x-2 cursor-pointer text-brazil-blue hover:text-brazil-green transition-colors duration-300"
                    >
                        <span className="font-semibold">Comprar Créditos</span>
                        <img src="/images/gold-coin.png" alt="Comprar Créditos" className="w-8 h-8" />
                    </div>
                </div>
            </aside>

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 p-8">
                {activeSection !== 'download' && activeSection !== 'share' && ( // Renderiza a área de edição se não for download ou share
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
                                Assunto
                            </label>
                            <input
                                type="text"
                                id="subject"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Assunto do E-book"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                Título
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Título do E-book"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Área de texto principal para o conteúdo do E-book */}
                        {activeSection === 'content' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Conteúdo Principal</h3>
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={mainContent}
                                    onChange={setMainContent}
                                    className="h-96 mb-12"
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, false] }],
                                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                            ['link', 'image'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </div>
                        )}

                        {/* Seção da Capa */}
                        {activeSection === 'cover' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Capa do E-book</h3>
                                <p className="text-gray-600 mb-4">
                                    Você pode gerar uma sugestão de capa com nossa IA clicando no botão abaixo, ou pode fazer o upload de uma capa que possua...
                                </p>
                                <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 mb-4 rounded-md">
                                    {coverImageUrl ? (
                                        <img src={coverImageUrl} alt="Capa do E-book" className="object-contain h-full w-full" />
                                    ) : (
                                        '[Pré-visualização da Capa]'
                                    )}
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-300"
                                    >
                                        Upload de Imagem
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleCoverImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        onClick={handleGenerateCoverAI}
                                        className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors duration-300"
                                    >
                                        Sugestão IA
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Seção do Resumo */}
                        {activeSection === 'summary' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Resumo do E-book</h3>
                                <textarea
                                    className="shadow appearance-none border rounded w-full h-48 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                                    placeholder="Resumo do e-book gerado pela IA..."
                                    value={summaryContent}
                                    onChange={(e) => setSummaryContent(e.target.value)}
                                ></textarea>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authorName">
                                    Nome do Autor
                                </label>
                                <input
                                    type="text"
                                    id="authorName"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Nome do Autor"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                />
                                <button
                                    onClick={handleGenerateSummaryAI}
                                    className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors duration-300 mt-4"
                                >
                                    Gerar Resumo com IA
                                </button>
                            </div>
                        )}

                        {activeSection === 'dedication' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Dedicatória</h3>
                                <textarea
                                    className="shadow appearance-none border rounded w-full h-48 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="É a menção em que o Autor presta ou dedica a obra a alguém, escreva sua Dedicatória Aqui...(Opcional)"
                                    value={dedicationContent}
                                    onChange={(e) => setDedicationContent(e.target.value)}
                                ></textarea>
                            </div>
                        )}

                        {activeSection === 'acknowledgements' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Agradecimentos</h3>
                                <textarea
                                    className="shadow appearance-none border rounded w-full h-48 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="São menções que o Autor faz a pessoas e/ou instituições das quais eventualmente recebeu apoio ou obteve inspirações, escreva seus Agradecimentos Aqui...(Opcional)"
                                    value={acknowledgementsContent}
                                    onChange={(e) => setAcknowledgementsContent(e.target.value)}
                                ></textarea>
                            </div>
                        )}

                        {activeSection === 'bibliography' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brazil-blue">Bibliografia</h3>
                                <textarea
                                    className="shadow appearance-none border rounded w-full h-48 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="A bibliografia de um livro é a lista de todas as fontes consultadas e utilizadas pelo autor durante a pesquisa e escrita da obra, liste suas referências aqui..."
                                    value={bibliographyContent}
                                    onChange={(e) => setBibliographyContent(e.target.value)}
                                ></textarea>
                            </div>
                        )}

                        <div className="flex justify-end mt-6 space-x-4">
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors duration-300 text-lg font-semibold"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={handleGenerateEbook}
                                className="bg-brazil-green text-white px-6 py-3 rounded-md hover:bg-brazil-blue transition-colors duration-300 text-lg font-semibold"
                            >
                                Gerar E-book
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'download' && (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-lg font-bold mb-4 text-brazil-blue">Prévia do E-book</h3>
                        {/* Placeholder para o controle de flipbook */}
                        <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 mb-6 rounded-md">
                            [Placeholder: Controle de Flipbook Aqui]
                        </div>
                        <button
                            onClick={handleFinalDownload}
                            className="bg-brazil-green text-white px-6 py-3 rounded-md hover:bg-brazil-blue transition-colors duration-300 text-lg font-semibold"
                        >
                            Baixar E-book Final
                        </button>
                    </div>
                )}

                {activeSection === 'share' && ( // Nova seção de compartilhamento
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-lg font-bold mb-4 text-brazil-blue">Compartilhe sua obra</h3>
                        <div className="flex justify-center space-x-4 mb-6">
                            {/* Ícones de redes sociais - placeholders */}
                            <a href="#" className="text-blue-600 text-4xl hover:text-blue-800">📘</a> {/* Facebook */}
                            <a href="#" className="text-blue-400 text-4xl hover:text-blue-600">🐦</a> {/* Twitter */}
                            <a href="#" className="text-pink-600 text-4xl hover:text-pink-800">📸</a> {/* Instagram */}
                            <a href="#" className="text-green-600 text-4xl hover:text-green-800">💬</a> {/* WhatsApp */}
                        </div>
                        <p className="text-gray-600 mb-4">Gostaria de compartilhar sua obra aqui na EbookStark?</p>
                        <button
                            onClick={handleShareOnEbookStark}
                            className="bg-brazil-green text-white px-6 py-3 rounded-md hover:bg-brazil-blue transition-colors duration-300 text-lg font-semibold"
                        >
                            Compartilhar na EbookStark
                        </button>
                    </div>
                )}
            </main>
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}
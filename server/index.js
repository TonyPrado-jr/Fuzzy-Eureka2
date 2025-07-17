const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 5000;

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ebookstark_db',
    password: 'Vilma@290634',
    port: 5432,
});

// Configuração do CORS para permitir requisições do seu frontend Next.js
app.use(cors({
    origin: 'http://localhost:3000', // CORRIGIDO: Agora permite requisições da porta 3000
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura';

// Middleware de autenticação para rotas protegidas
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // Se não houver token, não autorizado

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token inválido ou expirado
        req.user = user; // Adiciona o payload do token ao objeto de requisição
        next(); // Continua para a próxima função middleware/rota
    });
};

// Rota de registro de usuário
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, plan } = req.body;

    if (!firstName || !lastName || !email || !password || !plan) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'Usuário com este email já existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let planExpiresAt = null;
        let credits = 0; // Inicializa créditos
        const now = new Date();

        switch (plan) {
            case 'free':
                planExpiresAt = new Date(now.setDate(now.getDate() + 30)); // 30 dias
                credits = 30; // 30 créditos
                break;
            case 'basic':
                planExpiresAt = new Date(now.setDate(now.getDate() + 90)); // 90 dias
                credits = 100; // 100 créditos
                break;
            case 'intermediate':
                planExpiresAt = new Date(now.setDate(now.getDate() + 120)); // 120 dias
                credits = 250; // 250 créditos
                break;
            case 'platinum': // O frontend ainda envia 'platinum', mas o nome exibido é 'Premium Stark'
                planExpiresAt = new Date(now.setFullYear(now.getFullYear() + 1)); // 1 ano
                credits = 600; // 600 créditos
                break;
            default:
                planExpiresAt = null; // Sem expiração ou outro tratamento para planos desconhecidos
                credits = 0;
                break;
        }

        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, plan, plan_expires_at, credits) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, plan, plan_expires_at, credits, created_at',
            [firstName, lastName, email, hashedPassword, plan, planExpiresAt, credits]
        );

        const token = jwt.sign({ userId: newUser.rows[0].id, email: newUser.rows[0].email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            user: {
                id: newUser.rows[0].id,
                firstName: newUser.rows[0].first_name,
                lastName: newUser.rows[0].last_name,
                email: newUser.rows[0].email,
                plan: newUser.rows[0].plan,
                planExpiresAt: newUser.rows[0].plan_expires_at,
                credits: newUser.rows[0].credits, // Retorna os créditos
            },
            token,
        });

    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', error: err.message });
    }
});

// Rota de login de usuário
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const storedUser = user.rows[0];

        const isMatch = await bcrypt.compare(password, storedUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ userId: storedUser.id, email: storedUser.email }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login bem-sucedido!',
            user: {
                id: storedUser.id,
                email: storedUser.email,
                firstName: storedUser.first_name,
                lastName: storedUser.last_name,
                credits: storedUser.credits,
                plan: storedUser.plan,
            },
            token,
        });

    } catch (err) {
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', error: err.message });
    }
});

// NOVA ROTA: Obter perfil do usuário (protegida por token)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        // req.user contém o payload do token (userId, email)
        const user = await pool.query('SELECT id, first_name, last_name, email, plan, credits, plan_expires_at FROM users WHERE id = $1', [req.user.userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({
            message: 'Dados do perfil do usuário obtidos com sucesso!',
            user: user.rows[0],
        });

    } catch (err) {
        console.error('Erro ao obter perfil do usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao obter perfil do usuário.', error: err.message });
    }
});

// NOVA ROTA: Obter e-books compartilhados publicamente
app.get('/api/shared-ebooks', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, title, summary, cover_image_url FROM shared_ebooks ORDER BY shared_at DESC LIMIT 3');
        res.status(200).json({
            message: 'E-books compartilhados obtidos com sucesso!',
            ebooks: result.rows,
        });
    } catch (err) {
        console.error('Erro ao obter e-books compartilhados:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao obter e-books compartilhados.', error: err.message });
    }
});

// NOVA ROTA: Gerar conteúdo do e-book com IA
app.post('/api/generate-content', authenticateToken, async (req, res) => {
    const { subject, title } = req.body;
    const userId = req.user.userId;
    const COST_PER_GENERATION = 5;

    if (!subject || !title) {
        return res.status(400).json({ message: 'Assunto e Título são obrigatórios para gerar o conteúdo.' });
    }

    try {
        // 1. Verificar créditos do usuário
        const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const currentCredits = userResult.rows[0].credits;
        if (currentCredits < COST_PER_GENERATION) {
            return res.status(402).json({ message: 'Créditos insuficientes. Por favor, compre mais créditos.' });
        }

        // 2. Deduzir créditos
        const updatedCredits = currentCredits - COST_PER_GENERATION;
        await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [updatedCredits, userId]);

        // 3. Chamar serviço de IA (placeholder)
        // Em um cenário real, você integraria com uma API de IA aqui (ex: OpenAI, Gemini, etc.)
        const generatedContent = `
            <h1>${title}</h1>
            <h2>Introdução</h2>
            <p>Este e-book aborda o assunto de ${subject} de forma aprofundada, explorando seus principais conceitos e aplicações.</p>
            <h2>Desenvolvimento</h2>
            <p>Aqui seria o conteúdo gerado pela inteligência artificial, detalhando ${subject} e ${title}.</p>
            <p>A IA pode criar seções, parágrafos e exemplos relevantes para o tema.</p>
            <h2>Conclusão</h2>
            <p>Em resumo, ${subject} é um campo fascinante com muitas possibilidades.</p>
        `;

        res.status(200).json({
            message: 'Conteúdo gerado com sucesso!',
            generatedContent: generatedContent,
            remainingCredits: updatedCredits,
        });

    } catch (err) {
        console.error('Erro ao gerar conteúdo com IA:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar conteúdo com IA.', error: err.message });
    }
});

// NOVA ROTA: Gerar sugestão de capa com IA
app.post('/api/generate-cover', authenticateToken, async (req, res) => {
    const { subject, title } = req.body; // Assunto e título podem ser usados para contextualizar a IA
    const userId = req.user.userId;
    const COST_PER_COVER_GENERATION = 25;

    try {
        // 1. Verificar créditos do usuário
        const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const currentCredits = userResult.rows[0].credits;
        if (currentCredits < COST_PER_COVER_GENERATION) {
            return res.status(402).json({ message: 'Créditos insuficientes para gerar capa. Por favor, compre mais créditos.' });
        }

        // 2. Deduzir créditos
        const updatedCredits = currentCredits - COST_PER_COVER_GENERATION;
        await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [updatedCredits, userId]);

        // 3. Chamar serviço de IA para gerar URL da capa (placeholder)
        // Em um cenário real, você integraria com uma API de IA de geração de imagens
        const generatedCoverUrl = '/images/generated-cover-placeholder.jpg'; // URL de imagem placeholder

        res.status(200).json({
            message: 'Sugestão de capa gerada com sucesso!',
            generatedCoverUrl: generatedCoverUrl,
            remainingCredits: updatedCredits,
        });

    } catch (err) {
        console.error('Erro ao gerar sugestão de capa com IA:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar sugestão de capa com IA.', error: err.message });
    }
});

// NOVA ROTA: Gerar resumo com IA
app.post('/api/generate-summary', authenticateToken, async (req, res) => {
    const { mainContent, subject, title } = req.body;
    const userId = req.user.userId;
    const COST_PER_SUMMARY_GENERATION = 10;

    if (!mainContent) {
        return res.status(400).json({ message: 'Conteúdo principal é necessário para gerar o resumo.' });
    }

    try {
        // 1. Verificar créditos do usuário
        const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const currentCredits = userResult.rows[0].credits;
        if (currentCredits < COST_PER_SUMMARY_GENERATION) {
            return res.status(402).json({ message: 'Créditos insuficientes para gerar resumo. Por favor, compre mais créditos.' });
        }

        // 2. Deduzir créditos
        const updatedCredits = currentCredits - COST_PER_SUMMARY_GENERATION;
        await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [updatedCredits, userId]);

        // 3. Chamar serviço de IA para gerar resumo e nome do autor (placeholder)
        // Em um cenário real, você integraria com uma API de IA de processamento de texto
        const generatedSummary = `Este é um resumo gerado por IA do seu conteúdo sobre ${subject} e ${title}. Ele captura os pontos chave e oferece uma visão geral concisa.`;
        const generatedAuthorName = `Autor IA - ${req.user.email.split('@')[0]}`; // Exemplo de nome de autor gerado

        res.status(200).json({
            message: 'Resumo gerado com sucesso!',
            generatedSummary: generatedSummary,
            generatedAuthorName: generatedAuthorName,
            remainingCredits: updatedCredits,
        });

    } catch (err) {
        console.error('Erro ao gerar resumo com IA:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar resumo com IA.', error: err.message });
    }
});

// NOVA ROTA: Processar download e deduzir créditos
app.post('/api/process-download', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { plan } = req.body; // O frontend enviará o plano do usuário
    const COST_FOR_FREE_PLAN_DOWNLOAD = 15;

    if (plan !== 'free') {
        // Para planos pagos, o download é "gratuito" (incluído no plano)
        return res.status(200).json({ message: 'Download permitido.' });
    }

    try {
        // Lógica para plano gratuito
        const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const currentCredits = userResult.rows[0].credits;
        if (currentCredits < COST_FOR_FREE_PLAN_DOWNLOAD) {
            return res.status(402).json({ message: 'Créditos insuficientes para o download da prévia.' });
        }

        const updatedCredits = currentCredits - COST_FOR_FREE_PLAN_DOWNLOAD;
        await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [updatedCredits, userId]);

        res.status(200).json({
            message: 'Créditos deduzidos com sucesso! O download da prévia pode começar.',
            remainingCredits: updatedCredits,
        });

    } catch (err) {
        console.error('Erro ao processar download:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao processar download.', error: err.message });
    }
});

// NOVA ROTA: Compartilhar e-book na plataforma
app.post('/api/share-ebook', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { title, summary, cover_image_url, ebook_id } = req.body;

    if (!title || !summary || !cover_image_url || !ebook_id) {
        return res.status(400).json({ message: 'Dados incompletos para compartilhar o e-book.' });
    }

    try {
        // 1. Inserir o e-book na tabela de compartilhados
        await pool.query(
            'INSERT INTO shared_ebooks (user_id, ebook_id, title, summary, cover_image_url) VALUES ($1, $2, $3, $4, $5)',
            [userId, ebook_id, title, summary, cover_image_url]
        );

        // 2. Verificar o plano do usuário e conceder créditos se aplicável
        const userResult = await pool.query('SELECT plan, credits FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = userResult.rows[0];
        let creditsAwarded = 0;

        if (user.plan === 'intermediate' || user.plan === 'platinum') {
            const updatedCredits = user.credits + 10;
            await pool.query('UPDATE users SET credits = $1 WHERE id = $2', [updatedCredits, userId]);
            creditsAwarded = 10;
        }

        res.status(200).json({
            message: 'E-book compartilhado com sucesso!',
            creditsAwarded: creditsAwarded
        });

    } catch (err) {
        console.error('Erro ao compartilhar e-book:', err);
        // Adicionar verificação de erro de chave única para evitar compartilhamentos duplicados
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Este e-book já foi compartilhado.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao compartilhar e-book.', error: err.message });
    }
});

// --- ROTAS CRUD PARA E-BOOKS ---

// ROTA POST: Criar ou atualizar um e-book
app.post('/api/ebooks', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { ebookId, title, subject, mainContent, coverImageUrl, summaryContent, authorName, dedicationContent, acknowledgementsContent, bibliographyContent } = req.body;

    // Validação básica
    if (!title || !subject) {
        return res.status(400).json({ message: 'Título e Assunto são obrigatórios.' });
    }

    try {
        let result;
        if (ebookId) {
            // Atualizar e-book existente
            result = await pool.query(
                `UPDATE ebooks SET 
                    title = $1, subject = $2, main_content = $3, cover_image_url = $4, 
                    summary_content = $5, author_name = $6, dedication_content = $7, 
                    acknowledgements_content = $8, bibliography_content = $9, updated_at = NOW()
                WHERE id = $10 AND user_id = $11 RETURNING *`,
                [title, subject, mainContent, coverImageUrl, summaryContent, authorName, dedicationContent, acknowledgementsContent, bibliographyContent, ebookId, userId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'E-book não encontrado ou não pertence ao usuário.' });
            }
            res.status(200).json({ message: 'E-book atualizado com sucesso!', ebook: result.rows[0] });
        } else {
            // Criar novo e-book
            result = await pool.query(
                `INSERT INTO ebooks (user_id, title, subject, main_content, cover_image_url, summary_content, author_name, dedication_content, acknowledgements_content, bibliography_content) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [userId, title, subject, mainContent, coverImageUrl, summaryContent, authorName, dedicationContent, acknowledgementsContent, bibliographyContent]
            );
            res.status(201).json({ message: 'E-book salvo com sucesso!', ebook: result.rows[0] });
        }
    } catch (err) {
        console.error('Erro ao salvar o e-book:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao salvar o e-book.', error: err.message });
    }
});

// ROTA GET: Listar todos os e-books do usuário
app.get('/api/ebooks', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query('SELECT id, title, subject, updated_at FROM ebooks WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao listar e-books:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao listar e-books.', error: err.message });
    }
});

// ROTA GET: Obter um e-book específico por ID
app.get('/api/ebooks/:id', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM ebooks WHERE id = $1 AND user_id = $2', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'E-book não encontrado ou não pertence ao usuário.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter o e-book:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao obter o e-book.', error: err.message });
    }
});

// ROTA DELETE: Excluir um e-book
app.delete('/api/ebooks/:id', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM ebooks WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'E-book não encontrado ou não pertence ao usuário.' });
        }
        res.status(200).json({ message: 'E-book excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir o e-book:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir o e-book.', error: err.message });
    }
});

// --- ROTAS DE PLANOS E CRÉDITOS ---

// ROTA PUT: Fazer upgrade do plano do usuário
app.put('/api/user/plan', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { newPlan } = req.body;

    if (!newPlan || !['basic', 'intermediate', 'platinum'].includes(newPlan)) {
        return res.status(400).json({ message: 'Plano inválido.' });
    }

    // Lógica de pagamento seria integrada aqui. Como simulação, vamos apenas atualizar o plano.

    let planExpiresAt = new Date();
    let creditsToAdd = 0;

    switch (newPlan) {
        case 'basic':
            planExpiresAt.setDate(planExpiresAt.getDate() + 90);
            creditsToAdd = 100; // Bônus de upgrade
            break;
        case 'intermediate':
            planExpiresAt.setDate(planExpiresAt.getDate() + 120);
            creditsToAdd = 250;
            break;
        case 'platinum':
            planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
            creditsToAdd = 600;
            break;
    }

    try {
        const result = await pool.query(
            'UPDATE users SET plan = $1, plan_expires_at = $2, credits = credits + $3 WHERE id = $4 RETURNING id, plan, plan_expires_at, credits',
            [newPlan, planExpiresAt, creditsToAdd, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: `Upgrade para o plano ${newPlan} realizado com sucesso!`, user: result.rows[0] });

    } catch (err) {
        console.error('Erro ao fazer upgrade do plano:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer upgrade do plano.', error: err.message });
    }
});

// ROTA POST: Comprar créditos
app.post('/api/user/credits', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Quantidade de créditos inválida.' });
    }

    // Lógica de pagamento seria integrada aqui. Como simulação, vamos apenas adicionar os créditos.

    try {
        const result = await pool.query(
            'UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING id, credits',
            [amount, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: `${amount} créditos adicionados com sucesso!`, user: result.rows[0] });

    } catch (err) {
        console.error('Erro ao comprar créditos:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao comprar créditos.', error: err.message });
    }
});

// ROTA GET: Download do e-book em PDF
app.get('/api/ebooks/:id/download', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        // 1. Buscar os dados completos do e-book
        const ebookResult = await pool.query('SELECT * FROM ebooks WHERE id = $1 AND user_id = $2', [id, userId]);
        if (ebookResult.rows.length === 0) {
            return res.status(404).json({ message: 'E-book não encontrado ou não pertence ao usuário.' });
        }
        const ebook = ebookResult.rows[0];

        // 2. Montar o HTML do e-book
        const ebookHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${ebook.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .cover { width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background-color: #f0f0f0; }
                    .cover img { max-width: 80%; max-height: 70%; object-fit: contain; }
                    .cover h1 { font-size: 3em; margin-top: 20px; }
                    .page { page-break-before: always; padding: 2cm; }
                    h1, h2 { color: #0056b3; }
                    .ql-align-center { text-align: center; }
                    .ql-align-right { text-align: right; }
                    .ql-indent-1 { padding-left: 3em; }
                    .ql-indent-2 { padding-left: 6em; }
                </style>
            </head>
            <body>
                <!-- Capa -->
                <div class="cover">
                    ${ebook.cover_image_url ? `<img src="${ebook.cover_image_url}" alt="Capa">` : ''}
                    <h1>${ebook.title}</h1>
                    <h2>${ebook.author_name || ''}</h2>
                </div>

                <!-- Conteúdo Principal -->
                <div class="page">
                    ${ebook.main_content || ''}
                </div>

                <!-- Resumo -->
                ${ebook.summary_content ? `<div class="page"><h2>Resumo</h2><p>${ebook.summary_content}</p></div>` : ''}

                <!-- Dedicatória -->
                ${ebook.dedication_content ? `<div class="page"><h2>Dedicatória</h2><p>${ebook.dedication_content}</p></div>` : ''}

                <!-- Agradecimentos -->
                ${ebook.acknowledgements_content ? `<div class="page"><h2>Agradecimentos</h2><p>${ebook.acknowledgements_content}</p></div>` : ''}

                <!-- Bibliografia -->
                ${ebook.bibliography_content ? `<div class="page"><h2>Bibliografia</h2><p>${ebook.bibliography_content}</p></div>` : ''}
            </body>
            </html>
        `;

        // 3. Gerar o PDF com Puppeteer
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(ebookHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // 4. Enviar o PDF como resposta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${ebook.title.replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Erro ao gerar o PDF do e-book:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar o PDF.', error: err.message });
    }
});



// Rota de teste para verificar a conexão com o banco de dados
app.get('/api/test-db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.status(200).json({
            message: 'Conexão com o banco de dados PostgreSQL bem-sucedida!',
            currentTime: result.rows[0].now
        });
    } catch (err) {
        console.error('Erro ao conectar ou consultar o banco de dados:', err);
        res.status(500).json({
            message: 'Erro ao conectar ou consultar o banco de dados.',
            error: err.message
        });
    }
});

// Rota de teste simples para o servidor
app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Backend do EbookStark funcionando!' });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});
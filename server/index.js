import express from 'express';
import { networkInterfaces } from 'node:os';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pruneDrafts } from './db.js';
import { criarSessao, porteiro, senhaConfere, senhaArquivo, senhaOrigem, senhaParaMostrar } from './lib/senha.js';
import { seedRecipes } from './seed/recipes.js';
import metaRoutes from './routes/meta.js';
import houseRoutes from './routes/house.js';
import pantryRoutes from './routes/pantry.js';
import recipeRoutes from './routes/recipes.js';
import shoppingRoutes from './routes/shopping.js';
import choreRoutes from './routes/chores.js';
import chore2Routes from './routes/chores2.js';
import insightRoutes from './routes/insights.js';
import demoRoutes from './routes/demo.js';
import extraRoutes from './routes/extras.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
// 3777 e não 3000: a porta 3000 é o padrão de quase todo projeto Next/CRA, e
// subir em cima de outro app faz a API responder HTML no lugar de JSON.
const PORT = Number(process.env.PORT) || 3777;

const seeded = seedRecipes();
const descartados = pruneDrafts();

const app = express();
app.use(express.json({ limit: '2mb' }));

// log enxuto de API, so para debug no terminal
app.use('/api', (req, _res, next) => {
  if (req.method !== 'GET') console.log(`  ${req.method} ${req.originalUrl}`);
  next();
});


// ---------------------------------------------------------------- tranca
// Todo o /api passa pelo porteiro. Só /ping e /entrar respondem sem crachá.
app.post('/api/entrar', (req, res) => {
  if (!senhaConfere(req.body?.senha)) {
    return res.status(401).json({
      error: String(req.body?.senha ?? '').trim() ? 'Senha incorreta' : 'Digite a senha da casa',
    });
  }
  res.json({ ok: true, token: criarSessao(req.get('user-agent') ?? '') });
});

app.use('/api', porteiro);

app.use('/api', metaRoutes);
app.use('/api', houseRoutes);
app.use('/api', pantryRoutes);
app.use('/api', recipeRoutes);
app.use('/api', shoppingRoutes);
app.use('/api', choreRoutes);
app.use('/api', chore2Routes);
app.use('/api', insightRoutes);
app.use('/api', demoRoutes);
app.use('/api', extraRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use('/api', (err, _req, res, _next) => {
  console.error('[erro]', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

// em producao o Express tambem serve o front buildado
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')));
}

function localIPs() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

const server = app.listen(PORT, '0.0.0.0', () => {
  const served = existsSync(DIST);
  console.log('');
  console.log('  🏠  House Kats');
  console.log(`  ├─ local     http://localhost:${PORT}`);
  for (const ip of localIPs()) console.log(`  ├─ na Wi-Fi  http://${ip}:${PORT}`);
  if (descartados) console.log(`  ├─ limpeza   ${descartados} casa(s) abandonada(s) no cadastro`);
  console.log(`  ├─ receitas  ${seeded.total} no catálogo${seeded.added ? ` (+${seeded.added} novas)` : ''}`);
  console.log(`  ├─ senha     ${senhaOrigem === 'HOUSEKATS_SENHA' ? 'da variável de ambiente' : senhaArquivo}`);
  console.log(`  └─ ${served ? 'servindo o app buildado' : 'só API (rode "npm run dev" para o front)'}`);

  // a senha sorteada só aparece uma vez: é a única chance de anotar
  const nova = senhaParaMostrar();
  if (nova) {
    console.log('');
    console.log(`  🔑 Primeira vez aqui. A senha da casa é:  ${nova}`);
    console.log(`     Anote. Ela ficou salva em ${senhaArquivo}`);
  }
  console.log('');
});

// erro de porta ocupada é o mais comum de todos, merece uma mensagem de gente
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('');
    console.log(`  ⚠️  A porta ${PORT} já está sendo usada.`);
    console.log('');
    console.log('  Provavelmente o House Kats já está rodando em outra janela.');
    console.log(`  Tente abrir http://localhost:${PORT} antes de subir de novo.`);
    console.log('');
    console.log(`  Se não for o caso, use outra porta:   set PORT=3001 && npm start`);
    console.log('');
  } else {
    console.error('  ⚠️  Não deu para subir o servidor:', err.message);
  }
  process.exit(1);
});

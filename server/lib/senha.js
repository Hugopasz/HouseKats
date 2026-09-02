import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, all, get, run } from '../db.js';

/**
 * Senha da casa: a única tranca do app.
 *
 * O House Kats não tem contas nem login por pessoa — é uma casa, não um banco,
 * e ninguém quer autenticar para dizer que comeu um ovo. Mas quando o app sai da
 * Wi-Fi e ganha endereço na internet, uma porta sem tranca vira convite. Então a
 * casa inteira fica atrás de uma senha só, digitada uma vez por aparelho.
 *
 * O segredo NUNCA mora no repositório. A ordem de busca é:
 *   1. HOUSEKATS_SENHA (o jeito certo em hospedagem)
 *   2. senha.txt ao lado do banco, fora do projeto
 *   3. não existe nenhuma? o app sorteia uma, grava e mostra no terminal
 */
const ARQUIVO = join(DATA_DIR, 'senha.txt');

function carregarSenha() {
  const doAmbiente = String(process.env.HOUSEKATS_SENHA || '').trim();
  if (doAmbiente) return { senha: doAmbiente, origem: 'HOUSEKATS_SENHA' };

  if (existsSync(ARQUIVO)) {
    const salva = readFileSync(ARQUIVO, 'utf8').trim();
    if (salva) return { senha: salva, origem: 'arquivo' };
  }

  // primeira vez nesta máquina: seis dígitos sorteados, fáceis de digitar no celular
  const nova = String(randomBytes(4).readUInt32BE(0) % 1000000).padStart(6, '0');
  writeFileSync(ARQUIVO, `${nova}\n`, 'utf8');
  return { senha: nova, origem: 'sorteada' };
}

const { senha: SENHA, origem: ORIGEM } = carregarSenha();

export const senhaOrigem = ORIGEM;
export const senhaArquivo = ARQUIVO;
/** Só para o terminal mostrar na primeira vez. Nunca vai para a API. */
export const senhaParaMostrar = () => (ORIGEM === 'sorteada' ? SENHA : null);

/** Comparação de tamanho constante, para não vazar a senha pelo tempo de resposta. */
function iguais(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  if (x.length !== y.length) return false;
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return dif === 0;
}

export const senhaConfere = (tentativa) => iguais(String(tentativa ?? '').trim(), SENHA);

// ---------------------------------------------------------------- sessões
/**
 * Depois de acertar a senha, o aparelho recebe um crachá e não precisa digitar
 * de novo. O crachá vive no banco, então reiniciar o servidor não expulsa
 * ninguém, e dá para revogar tudo apagando a tabela.
 */
const DIAS_DE_VALIDADE = 180;

export function criarSessao(apelido = '') {
  const token = randomBytes(24).toString('hex');
  run(
    "INSERT INTO sessao (token, apelido, expires_at) VALUES (?,?, date('now', ?))",
    token, String(apelido).slice(0, 60), `+${DIAS_DE_VALIDADE} day`
  );
  return token;
}

export function sessaoValida(token) {
  if (!token) return false;
  const s = get(
    "SELECT token FROM sessao WHERE token = ? AND expires_at >= date('now')", String(token)
  );
  return !!s;
}

/** Derruba todos os aparelhos. Serve para quando a senha vaza. */
export function derrubarSessoes() {
  const n = all('SELECT token FROM sessao').length;
  run('DELETE FROM sessao');
  return n;
}

// ---------------------------------------------------------------- porteiro
/** Rotas que respondem sem crachá: identificar o servidor e entrar. */
const LIVRES = new Set(['/ping', '/entrar']);

export function porteiro(req, res, next) {
  if (LIVRES.has(req.path)) return next();
  if (sessaoValida(req.get('x-casa-token'))) return next();
  res.status(401).json({ error: 'Essa casa está trancada', precisaSenha: true });
}

/**
 * Barra a ação quando a senha não bate. Continua valendo para criar e apagar
 * casa: entrar no app é uma coisa, apagar tudo é outra, e a segunda merece a
 * senha na hora, mesmo com o celular já destrancado.
 */
export function senhaBarrou(req, res) {
  if (senhaConfere(req.body?.senha)) return false;
  res.status(401).json({
    error: String(req.body?.senha ?? '').trim()
      ? 'Senha da casa incorreta'
      : 'Essa ação pede a senha da casa',
    precisaSenha: true,
  });
  return true;
}

import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import {
  BEBIDAS, COPOS, acharBebida, avisosDaSemana, beber, ehBebida,
  resumoDoDia, ultimosDias,
} from '../lib/hydration.js';
import { CATALOGO, MOEDAS, comprar, creditar, praca, saldoDaCasa, usarFundo } from '../lib/plaza.js';
import { applyMove, pantryOf, today } from '../lib/fridge.js';

const r = Router();
const bad = (res, msg) => res.status(400).json({ error: msg });

/**
 * O resumo do dia com tudo que a tela precisa: os goles, as metas, o histórico
 * da semana e as bebidas que estão na geladeira agora. As três rotas devolvem
 * esse mesmo formato para o front nunca receber meio objeto.
 */
function resumoCompleto(houseId, memberId, day = today()) {
  const resumo = resumoDoDia(houseId, memberId, day);
  if (!resumo) return null;

  const naGeladeira = pantryOf(houseId)
    .filter((it) => ehBebida(it.name, it.unit) && it.qty > 0)
    .map((it) => {
      const b = acharBebida(it.name);
      return {
        id: it.id, name: it.name, qty: it.qty, unit: it.unit, emoji: it.emoji,
        hydration: b?.hydration ?? 0.9, kind: b?.kind ?? 'outro',
        disponivelMl: it.unit === 'l' ? Math.round(it.qty * 1000) : Math.round(it.qty),
      };
    });

  return { ...resumo, naGeladeira, historico: ultimosDias(memberId, 7) };
}

// ================================================================ LÍQUIDOS
r.get('/drinks/catalog', (_req, res) => {
  res.json({
    bebidas: Object.entries(BEBIDAS).map(([key, b]) => ({
      key, label: b.label, emoji: b.e, hydration: b.hydration, debt: b.debt, kind: b.kind,
    })),
    copos: COPOS,
  });
});

r.get('/houses/:id/drinks', (req, res) => {
  const memberId = Number(req.query.member);
  if (!memberId) return bad(res, 'Informe o integrante');
  const resumo = resumoCompleto(Number(req.params.id), memberId, String(req.query.day || today()));
  if (!resumo) return res.status(404).json({ error: 'Integrante não encontrado' });
  res.json(resumo);
});

/** Registrar um gole. Se vier da geladeira, também dá baixa no estoque. */
r.post('/houses/:id/drinks', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const memberId = Number(b.member_id);
  const ml = Number(b.ml);
  const name = String(b.name ?? '').trim();
  if (!memberId || !name || !Number.isFinite(ml) || ml <= 0) return bad(res, 'Dados incompletos');

  const itemId = b.item_id ? Number(b.item_id) : null;

  const out = tx(() => {
    const gole = beber(houseId, memberId, {
      name, ml, source: itemId ? 'geladeira' : 'manual', itemId,
    });

    // beber da geladeira consome o estoque de verdade
    if (itemId) {
      const item = get('SELECT * FROM pantry_item WHERE id = ? AND house_id = ?', itemId, houseId);
      if (item) {
        const consumo = item.unit === 'l' ? ml / 1000 : ml;
        const { moveId } = applyMove({
          houseId, itemId, name: item.name, category: item.category,
          qty: Math.min(item.qty, consumo), unit: item.unit, reason: 'consumido', loggedBy: memberId,
        });
        if (moveId) {
          run(
            `INSERT INTO consumption_claim (house_id, move_id, member_id, logged_by, share, status)
             VALUES (?,?,?,?,1,'confirmed')`,
            houseId, moveId, memberId, memberId
          );
        }
      }
    }
    return gole;
  });

  // bateu a meta de água hoje? isso vale moeda, uma vez por dia
  const resumo = resumoCompleto(houseId, memberId);
  if (resumo && resumo.agua >= resumo.meta.total) {
    const jaGanhou = get(
      "SELECT id FROM coin_log WHERE member_id = ? AND reason = 'hidratacao' AND day = ?",
      memberId, today()
    );
    if (!jaGanhou) {
      creditar(houseId, memberId, MOEDAS.hidratacao, 'hidratacao', today());
      const who = get('SELECT name FROM member WHERE id = ?', memberId);
      logEvent(houseId, '💧', `${who?.name ?? 'Alguém'} bateu a meta de água hoje`, 'liquidos', memberId);
    }
  }

  res.status(201).json({ ...out, resumo });
});

r.delete('/drinks/:id', (req, res) => {
  const g = get('SELECT * FROM drink_log WHERE id = ?', Number(req.params.id));
  if (!g) return res.status(404).json({ error: 'Registro não encontrado' });
  run('DELETE FROM drink_log WHERE id = ?', g.id);
  res.json({ ok: true, resumo: resumoCompleto(g.house_id, g.member_id) });
});

r.get('/members/:id/drink-warnings', (req, res) => {
  res.json(avisosDaSemana(Number(req.params.id)));
});

// ================================================================ A PRAÇA
r.get('/houses/:id/plaza', (req, res) => {
  res.json(praca(Number(req.params.id)));
});

r.post('/houses/:id/plaza/buy', (req, res) => {
  const out = comprar(
    Number(req.params.id),
    req.body?.member_id ? Number(req.body.member_id) : null,
    String(req.body?.item_key ?? '')
  );
  if (out.erro) return bad(res, out.erro);
  res.status(201).json({ ...out, praca: praca(Number(req.params.id)) });
});

/** Trocar para um fundo que a casa já tem. */
r.post('/houses/:id/plaza/background', (req, res) => {
  const houseId = Number(req.params.id);
  const out = usarFundo(houseId, String(req.body?.key ?? ''));
  if (out.erro) return bad(res, out.erro);
  res.json({ ...out, praca: praca(houseId) });
});

/**
 * Jogar um petisco para os bichinhos. É só carinho: não sai da geladeira e não
 * conta como consumo de ninguém.
 */
r.post('/houses/:id/plaza/treat', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;
  const recipeId = req.body?.recipe_id ? Number(req.body.recipe_id) : null;

  const rec = recipeId ? get('SELECT * FROM recipe WHERE id = ?', recipeId) : null;
  const label = rec?.name ?? String(req.body?.label ?? 'Petisco');
  const emoji = rec?.emoji ?? String(req.body?.emoji ?? '🍪');

  run(
    'INSERT INTO plaza_treat (house_id, member_id, recipe_id, label, emoji) VALUES (?,?,?,?,?)',
    houseId, memberId, recipeId, label, emoji
  );

  // a reação de cada um sai da nota que ele deu para o prato
  const reacoes = all(
    "SELECT id, name, emoji FROM member WHERE house_id = ? AND kind = 'pessoa'", houseId
  ).map((m) => {
    const nota = recipeId ? get(
      `SELECT rr.stars FROM recipe_rating rr JOIN house_recipe hr ON hr.id = rr.house_recipe_id
       WHERE hr.house_id = ? AND hr.recipe_id = ? AND rr.member_id = ?`,
      houseId, recipeId, m.id
    )?.stars ?? null : null;

    const fala = nota == null
      ? pick(['o que é isso?', 'hmm, deixa eu provar', 'novidade!', '*cheira desconfiado*'])
      : nota >= 5 ? pick(['MEU FAVORITO!', 'isso sim!', 'mais! mais!'])
      : nota >= 4 ? pick(['adoro isso', 'muito bom!', 'boa escolha'])
      : nota === 3 ? pick(['tá bom', 'aceito', 'nada mal'])
      : pick(['ah não, isso não', 'passo...', '*empurra pro lado*']);

    return { member: m, nota, fala, gostou: nota == null ? null : nota >= 4 };
  });

  const pets = all("SELECT id, name, emoji FROM member WHERE house_id = ? AND kind = 'pet'", houseId)
    .map((p) => ({ member: p, nota: null, fala: pick(['*devora*', 'au au!', '*mastiga feliz*', 'miau!']), gostou: true }));

  res.status(201).json({ ok: true, label, emoji, reacoes: [...reacoes, ...pets] });
});

r.get('/houses/:id/coins', (req, res) => {
  const houseId = Number(req.params.id);
  res.json({
    cofre: saldoDaCasa(houseId),
    porIntegrante: all(
      "SELECT id, name, emoji, coins FROM member WHERE house_id = ? AND kind = 'pessoa' ORDER BY coins DESC",
      houseId
    ),
    historico: all(
      `SELECT c.*, m.name AS quem FROM coin_log c LEFT JOIN member m ON m.id = c.member_id
       WHERE c.house_id = ? ORDER BY c.id DESC LIMIT 20`,
      houseId
    ),
    catalogo: CATALOGO,
  });
});

// ================================================================ VISITANTES
/** Visitantes com prazo vencido, para a casa decidir o que fazer. */
r.get('/houses/:id/visitors', (req, res) => {
  const houseId = Number(req.params.id);
  const hoje = today();
  const todos = all(
    'SELECT * FROM member WHERE house_id = ? AND temporary = 1 ORDER BY visit_until', houseId
  );
  res.json({
    ativos: todos.filter((v) => !v.visit_until || v.visit_until >= hoje),
    vencidos: todos.filter((v) => v.visit_until && v.visit_until < hoje),
  });
});

/** Fim da visita: some, fica mais um tempo, ou vira morador. */
r.post('/members/:id/visit', (req, res) => {
  const id = Number(req.params.id);
  const m = get('SELECT * FROM member WHERE id = ?', id);
  if (!m) return res.status(404).json({ error: 'Integrante não encontrado' });

  const acao = String(req.body?.action ?? '');
  const dias = Math.max(1, Math.min(365, Number(req.body?.days) || 7));

  if (acao === 'remover') {
    run('DELETE FROM member WHERE id = ?', id);
    logEvent(m.house_id, '👋', `A visita de ${m.name} terminou. Os dados foram apagados.`, 'casa');
    return res.json({ ok: true, action: 'remover' });
  }

  if (acao === 'estender') {
    const ate = new Date();
    ate.setDate(ate.getDate() + dias);
    const novo = ate.toISOString().slice(0, 10);
    run('UPDATE member SET visit_until = ? WHERE id = ?', novo, id);
    logEvent(m.house_id, '🗓️', `${m.name} fica na casa até ${novo}`, 'casa', id);
    return res.json({ ok: true, action: 'estender', visit_until: novo });
  }

  if (acao === 'efetivar') {
    run('UPDATE member SET temporary = 0, visit_until = NULL WHERE id = ?', id);
    logEvent(m.house_id, '🎉', `${m.name} agora mora aqui de verdade!`, 'casa', id);
    return res.json({ ok: true, action: 'efetivar' });
  }

  return bad(res, 'Escolha remover, estender ou efetivar');
});

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default r;

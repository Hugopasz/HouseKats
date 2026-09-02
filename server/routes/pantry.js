import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { CATEGORIES, UNITS, guessCategory, guessUnit, suggest } from '../lib/food.js';
import { alimentosDaCasa, lembrarAlimento, sobrasVencidas, validadeDe } from '../lib/pantryExtras.js';
import {
  applyMove, decorateItem, expiring, fmtItem, mealsAvailable, receitasPossiveis,
  nutritionOfDay, pantryOf, recomputeStreak, today,
} from '../lib/fridge.js';
import { targetsFor } from '../lib/nutrition.js';

const r = Router();

const ORIGINS = ['comprado', 'delivery', 'ganho', 'ajuste'];
const REMOVE_REASONS = ['consumido', 'estragou', 'ajuste'];
const bad = (res, msg) => res.status(400).json({ error: msg });

const originLabel = { comprado: 'trouxe do mercado', delivery: 'pediu por delivery', ganho: 'ganhou', ajuste: 'ajustou' };
const reasonLabel = { consumido: 'consumiu', estragou: 'jogou fora', ajuste: 'ajustou' };

// ---------------------------------------------------------------- estoque
r.get('/houses/:id/pantry', (req, res) => {
  res.json(pantryOf(Number(req.params.id)));
});

/** Adicionar item: nome, categoria, origem, preço opcional e para quem é. */
r.post('/houses/:id/pantry', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim();
  if (!name) return bad(res, 'O item precisa de um nome');

  const qty = Number(b.qty);
  if (!Number.isFinite(qty) || qty <= 0) return bad(res, 'Quantidade inválida');

  const unit = UNITS.includes(b.unit) ? b.unit : guessUnit(name);
  const category = CATEGORIES[b.category] ? b.category : guessCategory(name);
  const origin = ORIGINS.includes(b.origin) ? b.origin : 'comprado';
  const loggedBy = b.loggedBy ? Number(b.loggedBy) : null;
  const temPreco = origin === 'comprado' || origin === 'delivery';
  const price = temPreco && b.price !== '' && b.price != null ? Number(b.price) : null;

  const frozen = !!b.frozen;
  const kind = b.kind === 'sobra' ? 'sobra' : 'item';
  const dias = b.days != null && b.days !== '' ? Number(b.days) : null;

  const out = tx(() => {
    const { item, moveId } = applyMove({
      houseId, name, category, qty, unit, reason: origin, price, loggedBy,
    });

    // validade: manual > prazo em dias (sobras) > estimativa por tipo, esticada se congelado
    const expires = b.expires_at || validadeDe(name, category, { frozen, kind, dias });
    const source = b.expires_at || dias != null ? 'manual' : 'auto';
    const forMember = b.for_member_id ? Number(b.for_member_id) : null;
    run(
      `UPDATE pantry_item SET expires_at = ?, expiry_source = ?, for_member_id = ?,
         frozen = ?, frozen_at = ?, kind = ?, note = ?, updated_at = datetime('now') WHERE id = ?`,
      expires, source, forMember, frozen ? 1 : 0, frozen ? today() : null,
      kind, String(b.note ?? ''), item.id
    );

    // o app aprende os alimentos que a casa inventa
    lembrarAlimento(houseId, { name, category, unit, price, qty, shelfDays: dias });

    const who = loggedBy ? get('SELECT name, emoji FROM member WHERE id = ?', loggedBy) : null;
    const priceTxt = price ? ` (R$ ${price.toFixed(2).replace('.', ',')})` : '';
    // sem integrante (cadastro inicial da casa) a frase fica sem sujeito
    logEvent(
      houseId,
      '🛒',
      who
        ? `${who.name} ${originLabel[origin]} ${fmtItem(qty, unit, name)}${priceTxt}`
        : `${fmtItem(qty, unit, name)} entrou no armário${priceTxt}`,
      'geladeira',
      loggedBy
    );
    return { item, moveId };
  });

  res.status(201).json(decorateItem(get('SELECT * FROM pantry_item WHERE id = ?', out.item.id)));
});

/**
 * Remover / dar baixa em vários itens de uma vez.
 * body: { loggedBy, reason, lines: [{ item_id, qty }], consumers: [memberId] }
 * Quando o motivo é "consumido", cada consumidor ganha uma atribuição; se quem
 * lançou marcou outra pessoa, essa atribuição nasce pendente de confirmação.
 */
r.post('/houses/:id/pantry/remove', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const reason = REMOVE_REASONS.includes(b.reason) ? b.reason : 'consumido';
  const loggedBy = b.loggedBy ? Number(b.loggedBy) : null;
  const lines = Array.isArray(b.lines) ? b.lines : [];
  if (!lines.length) return bad(res, 'Escolha ao menos um item');

  const consumers = reason === 'consumido' && Array.isArray(b.consumers) && b.consumers.length
    ? b.consumers.map(Number)
    : [];

  const done = tx(() => {
    const touched = [];
    for (const line of lines) {
      const itemId = Number(line.item_id);
      const item = get('SELECT * FROM pantry_item WHERE id = ? AND house_id = ?', itemId, houseId);
      if (!item) continue;
      const qty = Math.min(Number(line.qty) || 0, item.qty);
      if (qty <= 0) continue;

      const { moveId } = applyMove({
        houseId, itemId, name: item.name, category: item.category,
        qty, unit: item.unit, reason, loggedBy,
      });

      if (reason === 'consumido' && consumers.length) {
        const share = 1 / consumers.length;
        for (const memberId of consumers) {
          run(
            `INSERT INTO consumption_claim (house_id, move_id, member_id, logged_by, share, status)
             VALUES (?,?,?,?,?,?)`,
            houseId, moveId, memberId, loggedBy, share,
            memberId === loggedBy ? 'confirmed' : 'pending'
          );
        }
      }

      touched.push({ name: item.name, qty, unit: item.unit });
    }

    if (touched.length) {
      const who = loggedBy ? get('SELECT name FROM member WHERE id = ?', loggedBy) : null;
      const list = touched.map((t) => fmtItem(t.qty, t.unit, t.name)).join(', ');
      const icon = reason === 'estragou' ? '🗑️' : reason === 'ajuste' ? '⚖️' : '🍽️';
      let msg = `${who?.name ?? 'Alguém'} ${reasonLabel[reason]} ${list}`;
      if (reason === 'consumido' && consumers.length > 1) {
        msg += ` (dividido entre ${consumers.length} pessoas)`;
      } else if (reason === 'consumido' && consumers.length === 1 && consumers[0] !== loggedBy) {
        const other = get('SELECT name FROM member WHERE id = ?', consumers[0]);
        msg = `${who?.name ?? 'Alguém'} lançou ${list} para ${other?.name ?? 'alguém'}`;
      }
      logEvent(houseId, icon, msg, 'geladeira', loggedBy);
    }

    return touched;
  });

  for (const memberId of consumers) recomputeStreak(memberId);
  res.json({ ok: true, removed: done.length, pantry: pantryOf(houseId) });
});

r.patch('/pantry/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = get('SELECT * FROM pantry_item WHERE id = ?', id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  const b = req.body ?? {};
  const fields = [];
  const values = [];
  if (b.name !== undefined) { fields.push('name = ?'); values.push(String(b.name).trim() || item.name); }
  if (b.category !== undefined && CATEGORIES[b.category]) { fields.push('category = ?'); values.push(b.category); }
  if (b.qty !== undefined) { fields.push('qty = ?'); values.push(Math.max(0, Number(b.qty) || 0)); }
  if (b.unit !== undefined && UNITS.includes(b.unit)) { fields.push('unit = ?'); values.push(b.unit); }
  if (b.expires_at !== undefined) {
    fields.push('expires_at = ?', 'expiry_source = ?');
    values.push(b.expires_at || null, b.expires_at ? 'manual' : 'auto');
  }
  if (b.for_member_id !== undefined) {
    fields.push('for_member_id = ?');
    values.push(b.for_member_id ? Number(b.for_member_id) : null);
  }
  if (fields.length) {
    run(`UPDATE pantry_item SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...values, id);
  }
  res.json(decorateItem(get('SELECT * FROM pantry_item WHERE id = ?', id)));
});

/** Manda para o congelador ou tira de lá, recalculando a validade. */
r.post('/pantry/:id/freeze', (req, res) => {
  const id = Number(req.params.id);
  const item = get('SELECT * FROM pantry_item WHERE id = ?', id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  const congelar = req.body?.frozen !== false;
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;

  // congelar estica a validade a partir de hoje; descongelar volta ao prazo normal
  const expires = validadeDe(item.name, item.category, {
    frozen: congelar,
    kind: item.kind,
    // ao descongelar, comida pronta dura pouco e o resto volta ao padrão do tipo
    dias: congelar ? null : item.kind === 'sobra' ? 2 : null,
  });

  run(
    "UPDATE pantry_item SET frozen = ?, frozen_at = ?, expires_at = ?, updated_at = datetime('now') WHERE id = ?",
    congelar ? 1 : 0, congelar ? today() : null, expires, id
  );

  const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  logEvent(
    item.house_id, congelar ? '🧊' : '💧',
    `${who?.name ?? 'Alguém'} ${congelar ? 'congelou' : 'descongelou'} ${item.name}`,
    'geladeira', memberId
  );
  res.json(decorateItem(get('SELECT * FROM pantry_item WHERE id = ?', id)));
});

// ---------------------------------------------------------------- sobras
/** Sobras da casa, separando o que já passou do prazo. */
r.get('/houses/:id/leftovers', (req, res) => {
  const houseId = Number(req.params.id);
  const hoje = today();
  const rows = all(
    "SELECT * FROM pantry_item WHERE house_id = ? AND kind = 'sobra' AND qty > 0 ORDER BY expires_at",
    houseId
  ).map(decorateItem);
  res.json({
    ativas: rows.filter((s) => !s.expires_at || s.expires_at >= hoje),
    vencidas: rows.filter((s) => s.expires_at && s.expires_at < hoje),
  });
});

/** Guardar sobra: nome, porções e por quantos dias aguenta. */
r.post('/houses/:id/leftovers', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim();
  if (!name) return bad(res, 'A sobra precisa de um nome');

  const qty = Math.max(1, Number(b.qty) || 1);
  const dias = Math.max(1, Math.min(30, Number(b.days) || 3));
  const memberId = b.member_id ? Number(b.member_id) : null;
  const frozen = !!b.frozen;
  const category = CATEGORIES[b.category] ? b.category : guessCategory(name);

  const info = run(
    `INSERT INTO pantry_item (house_id, name, category, qty, unit, expires_at, expiry_source, kind, frozen, frozen_at, note)
     VALUES (?,?,?,?,'un',?, 'manual', 'sobra', ?, ?, ?)`,
    houseId, name, category, qty,
    validadeDe(name, category, { frozen, kind: 'sobra', dias: frozen ? null : dias }),
    frozen ? 1 : 0, frozen ? today() : null, String(b.note ?? '')
  );
  const id = Number(info.lastInsertRowid);

  const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  logEvent(
    houseId, '🍲',
    `${who?.name ?? 'Alguém'} guardou ${qty} ${qty === 1 ? 'porção' : 'porções'} de ${name}${frozen ? ' no congelador' : ''}`,
    'geladeira', memberId
  );
  res.status(201).json(decorateItem(get('SELECT * FROM pantry_item WHERE id = ?', id)));
});

// ---------------------------------------------------------------- sugestões
/** Autocomplete: tabela do app + alimentos que esta casa já usou. */
r.get('/houses/:id/foods', (req, res) => {
  const houseId = Number(req.params.id);
  const q = String(req.query.q ?? '');
  const daCasa = alimentosDaCasa(houseId, q, 6);
  const doApp = suggest(q, 8).filter((f) => !daCasa.some((c) => c.name.toLowerCase() === f.name.toLowerCase()));
  res.json([...daCasa, ...doApp].slice(0, 10));
});

r.delete('/pantry/:id', (req, res) => {
  const item = get('SELECT * FROM pantry_item WHERE id = ?', Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  run('DELETE FROM pantry_item WHERE id = ?', item.id);
  logEvent(item.house_id, '❌', `${item.name} saiu do armário`, 'geladeira');
  res.json({ ok: true });
});

// ---------------------------------------------------------------- home
/** Tudo que a home da Geladeira precisa numa tacada só. */
r.get('/houses/:id/dashboard', (req, res) => {
  const houseId = Number(req.params.id);
  const meId = req.query.me ? Number(req.query.me) : null;
  const members = all('SELECT * FROM member WHERE house_id = ? ORDER BY id', houseId);
  if (!members.length) return res.json({ meals: null, me: null, expiring: [], pantry: [] });

  const meals = mealsAvailable(houseId, members);
  const me = meId ? members.find((m) => m.id === meId) : null;

  let mine = null;
  if (me) {
    const targets = targetsFor(me);
    const nut = nutritionOfDay(me.id);
    const streak = get('SELECT * FROM streak WHERE member_id = ?', me.id) ?? { current: 0, best: 0 };
    const pct = (feito, meta) => Math.min(999, Math.round((feito / Math.max(1, meta)) * 100));
    mine = {
      targets,
      nutrition: nut,
      streak,
      // as quatro macros, cada uma com sua barra
      pct: {
        kcal: pct(nut.kcal, targets.kcal),
        protein: pct(nut.protein, targets.protein),
        carbs: pct(nut.carbs, targets.carbs),
        fat: pct(nut.fat, targets.fat),
      },
    };
  }

  const spentMonth = get(
    `SELECT COALESCE(SUM(price), 0) AS total FROM stock_move
     WHERE house_id = ? AND price IS NOT NULL AND day >= date('now','start of month')`,
    houseId
  );

  res.json({
    meals,
    cozinhaveis: receitasPossiveis(houseId),
    me: mine,
    // congelado não conta como "vence logo": só o que está na geladeira mesmo
    expiring: expiring(houseId, 4).filter((it) => !it.frozen),
    leftoversExpired: sobrasVencidas(houseId).map(decorateItem),
    frozenCount: get(
      'SELECT COUNT(*) AS n FROM pantry_item WHERE house_id = ? AND frozen = 1 AND qty > 0', houseId
    ).n,
    spentMonth: Number(spentMonth?.total ?? 0),
    houseMembers: members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji })),
  });
});

// ---------------------------------------------------------------- contestação
/**
 * Pendências de consumo, agrupadas do jeito que a pessoa lembra do que comeu.
 *
 * Cozinhar baixa um monte de ingrediente, e perguntar "você comeu 0,1 kg de
 * cebola?" seis vezes seguidas não ajuda ninguém a lembrar de nada. Quando os
 * lançamentos vieram do mesmo preparo, viram uma linha só com o nome do prato.
 * O que foi lançado solto (um salgadinho, uma fruta) continua item a item.
 */
r.get('/members/:id/claims', (req, res) => {
  const rows = all(
    `SELECT c.id, c.share, c.status, c.day, c.cook_id, m.item_name, m.delta, m.unit, m.category,
            who.name AS logged_by_name, who.emoji AS logged_by_emoji, c.logged_by
     FROM consumption_claim c
     JOIN stock_move m ON m.id = c.move_id
     LEFT JOIN member who ON who.id = c.logged_by
     WHERE c.member_id = ? AND c.status = 'pending'
     ORDER BY c.id DESC`,
    Number(req.params.id)
  );

  const grupos = [];
  const porCook = new Map();

  for (const row of rows) {
    if (!row.cook_id) {
      grupos.push({ ...row, kind: 'item', ids: [row.id] });
      continue;
    }

    let g = porCook.get(row.cook_id);
    if (!g) {
      const cook = get(
        `SELECT ck.servings, r.name, r.emoji FROM cook_log ck
         JOIN recipe r ON r.id = ck.recipe_id WHERE ck.id = ?`,
        row.cook_id
      );
      g = {
        kind: 'receita',
        id: -row.cook_id,               // id negativo: nunca colide com claim
        cook_id: row.cook_id,
        ids: [],
        item_name: cook?.name ?? 'Uma receita',
        emoji: cook?.emoji ?? '🍽️',
        servings: cook?.servings ?? 1,
        share: row.share,
        day: row.day,
        logged_by: row.logged_by,
        logged_by_name: row.logged_by_name,
        logged_by_emoji: row.logged_by_emoji,
        ingredientes: [],
      };
      porCook.set(row.cook_id, g);
      grupos.push(g);
    }
    g.ids.push(row.id);
    g.ingredientes.push({
      name: row.item_name,
      qty: Math.abs(row.delta) * row.share,
      unit: row.unit,
    });
  }

  res.json(grupos);
});

/**
 * Confirmar ou contestar. Ao contestar, o app não abre discussão: divide o
 * consumo meio a meio entre quem foi marcado e quem marcou.
 */
/** Aplica a decisão num aviso só. Devolve quem precisa ter a streak refeita. */
function resolverClaim(id, action, { silencioso = false, rotulo = null } = {}) {
  const claim = get('SELECT * FROM consumption_claim WHERE id = ?', id);
  if (!claim) return null;

  const move = get('SELECT * FROM stock_move WHERE id = ?', claim.move_id);
  const me = get('SELECT * FROM member WHERE id = ?', claim.member_id);
  const other = claim.logged_by ? get('SELECT * FROM member WHERE id = ?', claim.logged_by) : null;
  const nome = rotulo ?? move.item_name;

  if (action === 'confirm') {
    run("UPDATE consumption_claim SET status = 'confirmed', resolved_at = datetime('now') WHERE id = ?", id);
    if (!silencioso) {
      logEvent(claim.house_id, '👍', `${me.name} confirmou o consumo de ${nome}`, 'geladeira', me.id);
    }
  } else {
    // salomônico: metade para cada, sem briga
    run(
      "UPDATE consumption_claim SET status = 'dividido', share = ?, resolved_at = datetime('now') WHERE id = ?",
      claim.share / 2, id
    );
    if (other) {
      run(
        `INSERT INTO consumption_claim (house_id, move_id, member_id, logged_by, share, status, day, resolved_at, cook_id)
         VALUES (?,?,?,?,?,'dividido',?,datetime('now'),?)`,
        claim.house_id, claim.move_id, other.id, claim.logged_by, claim.share / 2, claim.day, claim.cook_id
      );
    }
    if (!silencioso) {
      logEvent(
        claim.house_id, '⚖️',
        `${me.name} contestou ${nome}, e o app dividiu com ${other?.name ?? 'quem lançou'}`,
        'geladeira', me.id
      );
    }
  }

  return { membro: claim.member_id, outro: other?.id ?? null, casa: claim.house_id, me, other };
}

r.post('/claims/:id/resolve', (req, res) => {
  const action = req.body?.action === 'contest' ? 'contest' : 'confirm';
  let out = null;
  tx(() => { out = resolverClaim(Number(req.params.id), action); });
  if (!out) return res.status(404).json({ error: 'Aviso não encontrado' });

  recomputeStreak(out.membro);
  if (out.outro) recomputeStreak(out.outro);
  res.json({ ok: true, action });
});

/**
 * Resolve de uma vez todos os avisos de um mesmo preparo. O log leva o nome do
 * prato, não a lista de ingredientes: é assim que a pessoa se lembra da refeição.
 */
r.post('/claims/resolve-group', (req, res) => {
  const action = req.body?.action === 'contest' ? 'contest' : 'confirm';
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return bad(res, 'Nenhum aviso informado');

  const primeiro = get('SELECT * FROM consumption_claim WHERE id = ?', ids[0]);
  if (!primeiro) return res.status(404).json({ error: 'Aviso não encontrado' });

  const prato = primeiro.cook_id
    ? get(
      `SELECT r.name FROM cook_log ck JOIN recipe r ON r.id = ck.recipe_id WHERE ck.id = ?`,
      primeiro.cook_id
    )?.name
    : null;

  let ultimo = null;
  tx(() => {
    for (const id of ids) {
      const r2 = resolverClaim(id, action, { silencioso: true });
      if (r2) ultimo = r2;
    }
  });
  if (!ultimo) return res.status(404).json({ error: 'Aviso não encontrado' });

  const nome = prato ?? 'o que foi lançado';
  logEvent(
    ultimo.casa,
    action === 'confirm' ? '👍' : '⚖️',
    action === 'confirm'
      ? `${ultimo.me.name} confirmou que comeu ${nome}`
      : `${ultimo.me.name} contestou ${nome}, e o app dividiu com ${ultimo.other?.name ?? 'quem lançou'}`,
    'geladeira', ultimo.me.id
  );

  recomputeStreak(ultimo.membro);
  if (ultimo.outro) recomputeStreak(ultimo.outro);
  res.json({ ok: true, action, resolvidos: ids.length });
});

export default r;

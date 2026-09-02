import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { applyMove, pantryOf, recomputeStreak } from '../lib/fridge.js';
import { convertQty, norm } from '../lib/food.js';
import { MOEDAS, creditar } from '../lib/plaza.js';

const r = Router();

const DAILY_SWIPES = 10;
const COMFORT_MIN = 10;   // preparos para ganhar o selo
const COMFORT_SLOTS = 5;  // top 5 no máximo

const parse = (row) => ({
  ...row,
  tags: JSON.parse(row.tags || '[]'),
  steps: JSON.parse(row.steps || '[]'),
});

const ingredientsOf = (recipeId) =>
  all('SELECT name, qty, unit, category, optional FROM recipe_ingredient WHERE recipe_id = ? ORDER BY id', recipeId);

/** Recalcula o selo Prato Conforto: top 5 com 10+ preparos. */
function refreshComfort(houseId) {
  run('UPDATE house_recipe SET comfort = 0 WHERE house_id = ?', houseId);
  const top = all(
    `SELECT id FROM house_recipe
     WHERE house_id = ? AND times_cooked >= ?
     ORDER BY times_cooked DESC, added_at ASC LIMIT ?`,
    houseId, COMFORT_MIN, COMFORT_SLOTS
  );
  for (const t of top) run('UPDATE house_recipe SET comfort = 1 WHERE id = ?', t.id);
  return top.length;
}

// ---------------------------------------------------------------- descoberta
/**
 * Leva do dia: 10 pratos por integrante, uma vez por dia.
 * Prioriza receitas com ingredientes que a casa já tem.
 */
r.get('/houses/:id/discover', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = Number(req.query.member);
  if (!memberId) return res.status(400).json({ error: 'Informe o integrante' });

  const doneToday = get(
    "SELECT COUNT(*) AS n FROM recipe_swipe WHERE member_id = ? AND day = date('now')",
    memberId
  ).n;

  if (doneToday >= DAILY_SWIPES) {
    return res.json({ done: true, remaining: 0, cards: [], swipedToday: doneToday });
  }

  const inBook = new Set(all('SELECT recipe_id FROM house_recipe WHERE house_id = ?', houseId).map((x) => x.recipe_id));
  const seen = new Set(all('SELECT recipe_id FROM recipe_swipe WHERE member_id = ?', memberId).map((x) => x.recipe_id));
  const have = new Set(pantryOf(houseId).map((p) => norm(p.name)));

  const pool = all("SELECT * FROM recipe WHERE source = 'catalog'")
    .filter((rec) => !seen.has(rec.id) && !inBook.has(rec.id));

  // pontua pelo que já existe na geladeira, com um empurrãozinho aleatório
  const scored = pool.map((rec) => {
    const ing = ingredientsOf(rec.id);
    const hits = ing.filter((i) => {
      const n = norm(i.name);
      return [...have].some((h) => h.includes(n) || n.includes(h));
    }).length;
    return { rec, ing, score: hits / Math.max(1, ing.length) + Math.random() * 0.5 };
  }).sort((a, b) => b.score - a.score);

  const remaining = DAILY_SWIPES - doneToday;
  const cards = scored.slice(0, remaining).map(({ rec, ing }) => ({
    ...parse(rec),
    ingredients: ing,
    haveCount: ing.filter((i) => {
      const n = norm(i.name);
      return [...have].some((h) => h.includes(n) || n.includes(h));
    }).length,
  }));

  res.json({ done: false, remaining, cards, swipedToday: doneToday });
});

/** Curtiu vai direto para o livro da casa. */
r.post('/houses/:id/discover/swipe', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = Number(req.body?.member_id);
  const recipeId = Number(req.body?.recipe_id);
  const liked = !!req.body?.liked;
  if (!memberId || !recipeId) return res.status(400).json({ error: 'Dados incompletos' });

  const rec = get('SELECT * FROM recipe WHERE id = ?', recipeId);
  if (!rec) return res.status(404).json({ error: 'Receita não encontrada' });

  tx(() => {
    run(
      `INSERT INTO recipe_swipe (house_id, member_id, recipe_id, liked) VALUES (?,?,?,?)
       ON CONFLICT(member_id, recipe_id) DO UPDATE SET liked = excluded.liked`,
      houseId, memberId, recipeId, liked ? 1 : 0
    );
    if (liked) {
      run(
        'INSERT OR IGNORE INTO house_recipe (house_id, recipe_id, added_by) VALUES (?,?,?)',
        houseId, recipeId, memberId
      );
      const who = get('SELECT name FROM member WHERE id = ?', memberId);
      logEvent(houseId, rec.emoji, `${who?.name ?? 'Alguém'} aprovou ${rec.name}`, 'receitas', memberId);
    }
  });

  res.json({ ok: true });
});

// ---------------------------------------------------------------- livro da casa
r.get('/houses/:id/recipes', (req, res) => {
  const houseId = Number(req.params.id);
  const meId = req.query.me ? Number(req.query.me) : null;
  const have = new Set(pantryOf(houseId).map((p) => norm(p.name)));

  const rows = all(
    `SELECT hr.id AS hr_id, hr.times_cooked, hr.comfort, hr.added_at, hr.added_by,
            r.*, m.name AS added_by_name, m.emoji AS added_by_emoji,
            (SELECT ROUND(AVG(stars),1) FROM recipe_rating WHERE house_recipe_id = hr.id) AS avg_stars,
            (SELECT COUNT(*) FROM recipe_rating WHERE house_recipe_id = hr.id) AS rating_count,
            (SELECT stars FROM recipe_rating WHERE house_recipe_id = hr.id AND member_id = ?) AS my_stars
     FROM house_recipe hr
     JOIN recipe r ON r.id = hr.recipe_id
     LEFT JOIN member m ON m.id = hr.added_by
     WHERE hr.house_id = ?
     ORDER BY hr.comfort DESC, hr.times_cooked DESC, r.name`,
    meId, houseId
  );

  res.json(rows.map((row) => {
    const ing = ingredientsOf(row.id);
    const missing = ing.filter((i) => {
      const n = norm(i.name);
      return ![...have].some((h) => h.includes(n) || n.includes(h));
    });
    return { ...parse(row), ingredients: ing, missing: missing.map((i) => i.name), canCook: missing.length === 0 };
  }));
});

r.get('/recipes/:id', (req, res) => {
  const rec = get('SELECT * FROM recipe WHERE id = ?', Number(req.params.id));
  if (!rec) return res.status(404).json({ error: 'Receita não encontrada' });
  res.json({ ...parse(rec), ingredients: ingredientsOf(rec.id) });
});

/** Catálogo completo, para o usuário buscar e adicionar à mão. */
r.get('/catalog', (req, res) => {
  const houseId = req.query.house ? Number(req.query.house) : null;
  const inBook = houseId
    ? new Set(all('SELECT recipe_id FROM house_recipe WHERE house_id = ?', houseId).map((x) => x.recipe_id))
    : new Set();
  const q = norm(req.query.q || '');
  const rows = all("SELECT * FROM recipe WHERE source = 'catalog' ORDER BY name")
    .filter((rec) => !q || norm(rec.name).includes(q) || norm(rec.description).includes(q));
  res.json(rows.map((rec) => ({ ...parse(rec), inBook: inBook.has(rec.id) })));
});

r.post('/houses/:houseId/recipes/:recipeId', (req, res) => {
  const houseId = Number(req.params.houseId);
  const recipeId = Number(req.params.recipeId);
  const rec = get('SELECT * FROM recipe WHERE id = ?', recipeId);
  if (!rec) return res.status(404).json({ error: 'Receita não encontrada' });
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;

  run('INSERT OR IGNORE INTO house_recipe (house_id, recipe_id, added_by) VALUES (?,?,?)', houseId, recipeId, memberId);
  const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  // sem integrante (cadastro inicial da casa) a frase fica sem sujeito
  logEvent(
    houseId, rec.emoji,
    who ? `${who.name} adicionou ${rec.name} ao livro` : `${rec.name} entrou no livro de receitas`,
    'receitas', memberId
  );
  res.status(201).json({ ok: true });
});

r.delete('/houses/:houseId/recipes/:recipeId', (req, res) => {
  const houseId = Number(req.params.houseId);
  const recipeId = Number(req.params.recipeId);
  const rec = get('SELECT * FROM recipe WHERE id = ?', recipeId);
  run('DELETE FROM house_recipe WHERE house_id = ? AND recipe_id = ?', houseId, recipeId);
  if (rec) logEvent(houseId, '📕', `${rec.name} saiu do livro de receitas`, 'receitas');
  res.json({ ok: true });
});

/** Nota de 1 a 5, entra no peso da lista de compras. */
r.post('/house-recipes/:id/rate', (req, res) => {
  const hrId = Number(req.params.id);
  const memberId = Number(req.body?.member_id);
  const stars = Math.max(1, Math.min(5, Number(req.body?.stars) || 0));
  if (!memberId || !stars) return res.status(400).json({ error: 'Dados incompletos' });

  run(
    `INSERT INTO recipe_rating (house_recipe_id, member_id, stars) VALUES (?,?,?)
     ON CONFLICT(house_recipe_id, member_id) DO UPDATE SET stars = excluded.stars, updated_at = datetime('now')`,
    hrId, memberId, stars
  );
  const avg = get('SELECT ROUND(AVG(stars),1) AS a FROM recipe_rating WHERE house_recipe_id = ?', hrId);
  res.json({ ok: true, avg: avg?.a ?? stars });
});

/**
 * Registrar preparo. Conta para o Prato Conforto e, se pedido, já dá baixa
 * dos ingredientes na geladeira.
 */
/**
 * Confere se dá para fazer a receita para N porções com o que tem no armário.
 * A conta é a mesma do preparo, então o aviso bate com o que vai ser baixado.
 * Serve para o app avisar antes, quando alguém aumenta o prato por causa de visita.
 */
function conferirEstoque(houseId, recipeId, servings, baseServings) {
  const factor = servings / Math.max(1, baseServings);
  const pantry = pantryOf(houseId);
  const faltando = [];

  for (const ing of ingredientsOf(recipeId)) {
    if (ing.optional) continue;

    const n = norm(ing.name);
    const item = pantry.find((p) => {
      const pn = norm(p.name);
      return pn === n || pn.includes(n) || n.includes(pn);
    });

    const precisa = Math.round(ing.qty * factor * 100) / 100;

    if (!item) {
      faltando.push({ name: ing.name, precisa, tem: 0, unit: ing.unit, motivo: 'nao-tem' });
      continue;
    }

    // sem conversão possível (ex.: receita em "un", estoque em "g") o app não
    // chuta: considera que tem, e o preparo também não mexe nesse item
    const wanted = convertQty(ing.qty * factor, ing.unit, item.unit);
    if (wanted === null) continue;

    if (item.qty + 0.001 < wanted) {
      faltando.push({
        name: ing.name,
        precisa: Math.round(wanted * 100) / 100,
        tem: Math.round(item.qty * 100) / 100,
        unit: item.unit,
        motivo: 'pouco',
      });
    }
  }

  return { servings, faltando, ok: faltando.length === 0 };
}

r.get('/house-recipes/:id/check', (req, res) => {
  const hr = get('SELECT * FROM house_recipe WHERE id = ?', Number(req.params.id));
  if (!hr) return res.status(404).json({ error: 'Receita não está no livro' });
  const rec = get('SELECT servings FROM recipe WHERE id = ?', hr.recipe_id);
  const servings = Math.max(1, Number(req.query.servings) || rec.servings);
  res.json(conferirEstoque(hr.house_id, hr.recipe_id, servings, rec.servings));
});

r.post('/house-recipes/:id/cook', (req, res) => {
  const hrId = Number(req.params.id);
  const hr = get('SELECT * FROM house_recipe WHERE id = ?', hrId);
  if (!hr) return res.status(404).json({ error: 'Receita não está no livro' });

  const rec = get('SELECT * FROM recipe WHERE id = ?', hr.recipe_id);
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;
  const deduct = req.body?.deduct !== false;

  // quem comeu o prato: sem isso o preparo não chega aos macros nem aos Padrões
  const eaters = Array.isArray(req.body?.eaters) && req.body.eaters.length
    ? req.body.eaters.map(Number)
    : memberId ? [memberId] : [];

  // visitas são bocas a mais na mesa sem perfil no app: entram na conta dos
  // ingredientes, mas o que elas comem não vira consumo de ninguém
  const guests = Math.max(0, Math.min(20, Number(req.body?.guests) || 0));
  const naMesa = eaters.length + guests;

  // A receita rende para o número de pessoas que vão comer: dois comendo
  // significam o dobro de ingredientes, não meia porção para cada um.
  const servings = Math.max(1, Number(req.body?.servings) || naMesa || rec.servings);

  // conferido antes de baixar: depois o estoque já mudou e a conta perde o sentido
  const faltou = deduct ? conferirEstoque(hr.house_id, hr.recipe_id, servings, rec.servings).faltando : [];

  const out = tx(() => {
    run('UPDATE house_recipe SET times_cooked = times_cooked + 1 WHERE id = ?', hrId);
    const cookInfo = run(
      'INSERT INTO cook_log (house_id, recipe_id, member_id, servings) VALUES (?,?,?,?)',
      hr.house_id, hr.recipe_id, memberId, servings
    );
    const cookId = Number(cookInfo.lastInsertRowid);

    const used = [];
    if (deduct) {
      const factor = servings / Math.max(1, rec.servings);
      const pantry = pantryOf(hr.house_id);
      for (const ing of ingredientsOf(hr.recipe_id)) {
        const n = norm(ing.name);
        const item = pantry.find((p) => {
          const pn = norm(p.name);
          return pn === n || pn.includes(n) || n.includes(pn);
        });
        if (!item) continue;
        // converte para a unidade do estoque; se não der (ex: "un" x "g"), não mexe
        const wanted = convertQty(ing.qty * factor, ing.unit, item.unit);
        if (wanted === null) continue;
        const qty = Math.min(item.qty, wanted);
        if (qty <= 0) continue;
        const { moveId } = applyMove({
          houseId: hr.house_id, itemId: item.id, name: item.name, category: item.category,
          qty, unit: item.unit, reason: 'consumido', loggedBy: memberId,
        });

        // cada ingrediente baixado vira consumo de quem comeu, dividido igualmente.
        // Com visita na mesa a divisão inclui ela, mas só os integrantes ficam com
        // a sua parte: o prato da visita simplesmente não é de ninguém.
        if (moveId && eaters.length) {
          const share = 1 / Math.max(eaters.length, naMesa);
          for (const eaterId of eaters) {
            run(
              `INSERT INTO consumption_claim (house_id, move_id, member_id, logged_by, share, status, cook_id)
               VALUES (?,?,?,?,?,?,?)`,
              hr.house_id, moveId, eaterId, memberId, share,
              eaterId === memberId ? 'confirmed' : 'pending', cookId
            );
          }
        }
        used.push(item.name);
      }
    }

    const comfortCount = refreshComfort(hr.house_id);
    const after = get('SELECT * FROM house_recipe WHERE id = ?', hrId);
    const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;

    logEvent(
      hr.house_id, rec.emoji,
      `${who?.name ?? 'Alguém'} fez ${rec.name}${used.length ? ` (${used.length} ingredientes baixados)` : ''}`,
      'receitas', memberId
    );
    if (after.comfort && after.times_cooked === COMFORT_MIN) {
      logEvent(hr.house_id, '🏅', `${rec.name} virou Prato Conforto da casa!`, 'receitas', memberId);
    }

    return { after, used, comfortCount };
  });

  // o consumo mexe na streak de quem comeu
  for (const eaterId of eaters) recomputeStreak(eaterId);
  if (memberId) creditar(hr.house_id, memberId, MOEDAS.receitaFeita, 'receita', rec.name);

  res.json({
    ok: true,
    times_cooked: out.after.times_cooked,
    comfort: !!out.after.comfort,
    deducted: out.used,
    eaters: eaters.length,
    guests,
    servings,
    // o que não deu para baixar por completo, para o app avisar depois do fato
    faltou,
  });
});

export default r;

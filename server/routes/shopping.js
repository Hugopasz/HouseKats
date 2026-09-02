import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { guessCategory, guessEmoji, norm, toBase } from '../lib/food.js';
import { applyMove, pantryOf } from '../lib/fridge.js';
import { DIETS } from '../lib/nutrition.js';
import { SPECIES } from '../lib/fun.js';
import { TABELA_ATUALIZADA_EM, estimarLista, estimarPreco } from '../lib/prices.js';

const r = Router();

/** Classifica a receita pelo papel que ela cumpre no dia. */
function mealType(tags) {
  if (tags.includes('doce')) return 'doce';
  if (tags.includes('café da manhã')) return 'cafe';
  if (tags.includes('lanche')) return 'lanche';
  return 'principal';
}

/** Arredonda para uma quantidade que dá para comprar de verdade. */
function roundBuy(qty, unit) {
  if (unit === 'un' || unit === 'pacote') return Math.max(1, Math.ceil(qty));
  if (unit === 'kg' || unit === 'l') return Math.max(0.1, Math.ceil(qty * 4) / 4); // de 250 em 250
  return Math.max(50, Math.ceil(qty / 50) * 50);                                   // g e ml, de 50 em 50
}

/** 1400 g vira 1,4 kg, ninguém pede grama e meio no mercado. */
function prettyUnit(qty, unit) {
  if (unit === 'g' && qty >= 1000) return { qty: Math.round(qty / 100) / 10, unit: 'kg' };
  if (unit === 'ml' && qty >= 1000) return { qty: Math.round(qty / 100) / 10, unit: 'l' };
  return { qty, unit };
}

const trim = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Monta a lista a partir do livro de receitas da casa.
 * Escolhe receitas com peso pela nota e pelo selo Prato Conforto, soma os
 * ingredientes das refeições do período e desconta o que já existe na geladeira.
 */
/**
 * Ração dos bichinhos. Cada pet come mais ou menos conforme o porte, e isso
 * entra na lista igual a qualquer outro item da casa: se já tem no armário,
 * desconta.
 */
function racaoDosPets(pets, days, pantry) {
  const linhas = [];
  for (const pet of pets) {
    const sp = SPECIES[pet.species] ?? SPECIES.outro;
    const peso = Number(pet.weight_kg) || (pet.species === 'cachorro' ? 10 : 3);
    // regra de bolso: ~2,5% do peso por dia em ração seca
    const fator = pet.diet === 'pouca' ? 0.8 : pet.diet === 'grande' ? 1.25 : 1;
    const gramasDia = Math.max(10, peso * 25 * fator);
    let precisa = gramasDia * days;

    const nome = sp.racao;
    const estoque = pantry.find((p) => norm(p.name) === norm(nome));
    if (estoque) {
      const temGramas = estoque.unit === 'kg' ? estoque.qty * 1000 : estoque.qty;
      precisa = Math.max(0, precisa - temGramas);
    }
    if (precisa <= 20) continue;

    const linha = linhas.find((l) => l.name === nome);
    if (linha) linha.gramas += precisa;
    else linhas.push({ name: nome, gramas: precisa, emoji: sp.emoji, quem: [] });
    (linha ?? linhas[linhas.length - 1]).quem.push(pet.name);
  }

  return linhas.map((l) => {
    const buy = prettyUnit(roundBuy(l.gramas >= 1000 ? l.gramas / 1000 : l.gramas, l.gramas >= 1000 ? 'kg' : 'g'), l.gramas >= 1000 ? 'kg' : 'g');
    return {
      name: l.name,
      qty: buy.qty,
      unit: buy.unit,
      category: 'pet',
      emoji: l.emoji,
      note: `para ${l.quem.join(' e ')}`,
    };
  });
}

function buildList(houseId, opts) {
  const days = Math.max(1, Math.min(60, Number(opts.days) || 7));
  const memberIds = Array.isArray(opts.members) && opts.members.length ? opts.members.map(Number) : null;

  const todos = all('SELECT * FROM member WHERE house_id = ? ORDER BY id', houseId)
    .filter((m) => !memberIds || memberIds.includes(m.id));

  // pet não come receita da casa: ele entra na lista pela ração, mais abaixo
  const members = todos.filter((m) => m.kind !== 'pet');
  const pets = todos.filter((m) => m.kind === 'pet');

  const mealsPerDay = members.reduce((s, m) => s + (DIETS[m.diet] ?? DIETS.media).mealsPerDay, 0);
  const totalMeals = Math.round(mealsPerDay * days);

  const book = all(
    `SELECT hr.id AS hr_id, hr.times_cooked, hr.comfort, r.id, r.name, r.emoji, r.servings, r.tags,
            (SELECT AVG(stars) FROM recipe_rating WHERE house_recipe_id = hr.id) AS avg_stars
     FROM house_recipe hr JOIN recipe r ON r.id = hr.recipe_id
     WHERE hr.house_id = ?`,
    houseId
  ).map((b) => ({ ...b, type: mealType(JSON.parse(b.tags || '[]')) }));

  if (!book.length) {
    const soRacao = racaoDosPets(pets, days, pantryOf(houseId));
    return { days, totalMeals, mealsPerDay, items: soRacao, orcamento: estimarLista(soRacao), recipes: [], empty: soRacao.length ? null : 'sem-receitas' };
  }

  const onlyFavs = !!opts.onlyFavorites;
  const pool = onlyFavs ? book.filter((b) => (b.avg_stars ?? 0) >= 4) : book;
  const usable = pool.length ? pool : book;

  // peso: nota (1-5, neutro 3) + bônus de conforto + variedade aleatória
  const weighted = usable.map((b) => ({
    ...b,
    weight: (b.avg_stars ?? 3) + (b.comfort ? 2.5 : 0) + Math.random() * 1.5,
  })).sort((a, b) => b.weight - a.weight);

  // Cotas por tipo: a casa come café da manhã todo dia, almoça e janta de
  // verdade, e sobremesa é sobremesa. Sem isso o cardápio vira só doce.
  const quotas = {
    cafe: Math.min(totalMeals, members.length * days),
    doce: Math.ceil(days / 3),
    lanche: Math.ceil(totalMeals * 0.08),
  };
  quotas.principal = Math.max(0, totalMeals - quotas.cafe - quotas.doce - quotas.lanche);

  const plan = new Map();
  const takeFor = (type, target) => {
    const list = weighted.filter((b) => b.type === type);
    if (!list.length || target <= 0) return target;             // cota sobra e volta para principal
    const maxPer = Math.max(1, Math.ceil(target / Math.min(list.length, 4)));
    let left = target;
    for (let pass = 0; pass < 8 && left > 0; pass++) {
      for (const rec of list) {
        if (left <= 0) break;
        const cur = plan.get(rec.id) ?? { rec, meals: 0 };
        if (cur.meals >= maxPer) continue;
        const take = Math.min(rec.servings, left, maxPer - cur.meals);
        cur.meals += take;
        left -= take;
        plan.set(rec.id, cur);
      }
    }
    return left;
  };

  // o que não couber no tipo volta para os pratos principais
  let overflow = 0;
  overflow += takeFor('cafe', quotas.cafe);
  overflow += takeFor('doce', quotas.doce);
  overflow += takeFor('lanche', quotas.lanche);
  const restPrincipal = takeFor('principal', quotas.principal + overflow);
  if (restPrincipal > 0) takeFor('cafe', restPrincipal);       // livro só de café/doce

  // soma os ingredientes de tudo que foi planejado
  const needed = new Map(); // chave: nome normalizado + unidade
  for (const { rec, meals } of plan.values()) {
    const factor = meals / Math.max(1, rec.servings);
    for (const ing of all('SELECT * FROM recipe_ingredient WHERE recipe_id = ?', rec.id)) {
      const key = `${norm(ing.name)}|${ing.unit}`;
      const cur = needed.get(key) ?? { name: ing.name, unit: ing.unit, qty: 0, category: ing.category };
      cur.qty += ing.qty * factor;
      needed.set(key, cur);
    }
  }

  // desconta o estoque atual (comparando em gramas/ml para não errar unidade)
  const pantry = pantryOf(houseId);
  const items = [];
  for (const need of needed.values()) {
    const stock = pantry.find((p) => {
      const pn = norm(p.name);
      const nn = norm(need.name);
      return pn === nn || pn.includes(nn) || nn.includes(pn);
    });

    let missing = need.qty;
    if (stock) {
      const haveBase = toBase(stock.qty, stock.unit, stock.name);
      const needBase = toBase(need.qty, need.unit, need.name);
      const leftBase = Math.max(0, needBase - haveBase);
      missing = needBase === 0 ? 0 : (leftBase / needBase) * need.qty;
    }
    if (missing <= 0.01) continue;

    const buy = prettyUnit(roundBuy(missing, need.unit), need.unit);
    items.push({
      name: need.name,
      qty: buy.qty,
      unit: buy.unit,
      category: need.category || guessCategory(need.name),
      emoji: guessEmoji(need.name, need.category),
      note: stock ? `já tem ${trim(stock.qty)} ${stock.unit}` : '',
    });
  }

  // opcional: repor o que está vencendo ou acabando
  if (opts.includeExpiring) {
    for (const p of pantry.filter((x) => x.daysLeft !== null && x.daysLeft <= 3)) {
      if (items.some((it) => norm(it.name) === norm(p.name))) continue;
      const buy = prettyUnit(roundBuy(p.qty || 1, p.unit), p.unit);
      items.push({
        name: p.name,
        qty: buy.qty,
        unit: buy.unit,
        category: p.category,
        emoji: p.emoji,
        note: 'o que tem está vencendo',
      });
    }
  }

  items.push(...racaoDosPets(pets, days, pantry));

  items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  // preço de mercado estimado, só para dar ordem de grandeza antes de sair de casa
  const orcamento = estimarLista(items);

  return {
    days,
    mealsPerDay,
    totalMeals,
    items,
    orcamento,
    recipes: [...plan.values()].map(({ rec, meals }) => ({
      id: rec.id, name: rec.name, emoji: rec.emoji, meals, comfort: !!rec.comfort, type: rec.type,
    })).sort((a, b) => b.meals - a.meals),
  };
}

// ---------------------------------------------------------------- rotas
/** Prévia sem salvar, alimenta o modal antes de confirmar. */
r.post('/houses/:id/shopping/preview', (req, res) => {
  res.json(buildList(Number(req.params.id), req.body ?? {}));
});

r.post('/houses/:id/shopping', (req, res) => {
  const houseId = Number(req.params.id);
  const opts = req.body ?? {};
  const built = buildList(houseId, opts);
  if (!built.items.length) return res.status(400).json({ error: 'Nada para comprar com essas opções' });

  const createdBy = opts.created_by ? Number(opts.created_by) : null;

  const listId = tx(() => {
    run("UPDATE shopping_list SET status = 'fechada', closed_at = datetime('now') WHERE house_id = ? AND status = 'aberta'", houseId);
    const info = run(
      'INSERT INTO shopping_list (house_id, title, created_by, days, meals_per_day) VALUES (?,?,?,?,?)',
      houseId, opts.title?.trim() || `Compras de ${built.days} dias`, createdBy, built.days, built.mealsPerDay
    );
    const id = Number(info.lastInsertRowid);
    for (const it of built.items) {
      run(
        'INSERT INTO shopping_item (list_id, name, qty, unit, category, note) VALUES (?,?,?,?,?,?)',
        id, it.name, it.qty, it.unit, it.category, it.note ?? ''
      );
    }
    const who = createdBy ? get('SELECT name FROM member WHERE id = ?', createdBy) : null;
    logEvent(houseId, '📝', `${who?.name ?? 'Alguém'} gerou a lista de compras (${built.items.length} itens)`, 'compras', createdBy);
    return id;
  });

  res.status(201).json(listWithItems(listId));
});

function listWithItems(id) {
  const list = get('SELECT * FROM shopping_list WHERE id = ?', id);
  if (!list) return null;
  const items = all('SELECT * FROM shopping_item WHERE list_id = ? ORDER BY category, name', id)
    .map((it) => {
      const est = estimarPreco(it.name, it.category, it.qty, it.unit);
      return {
        ...it,
        checked: !!it.checked,
        emoji: guessEmoji(it.name, it.category),
        estimate: est.total,
        priceExact: est.exato,
      };
    });

  // gasto real do que já foi anotado + estimativa do que falta
  const total = items.reduce((s, it) => s + (it.price ?? 0), 0);
  const previsto = items.reduce((s, it) => s + (it.price ?? it.estimate), 0);
  const estimado = items.reduce((s, it) => s + it.estimate, 0);

  return {
    ...list,
    items,
    total: Math.round(total * 100) / 100,
    previsto: Math.round(previsto * 100) / 100,
    estimado: Math.round(estimado * 100) / 100,
    precosAtualizadosEm: TABELA_ATUALIZADA_EM,
    checkedCount: items.filter((i) => i.checked).length,
  };
}

r.get('/houses/:id/shopping', (req, res) => {
  const houseId = Number(req.params.id);
  const open = get("SELECT id FROM shopping_list WHERE house_id = ? AND status = 'aberta' ORDER BY id DESC", houseId);
  res.json(open ? listWithItems(open.id) : null);
});

r.get('/houses/:id/shopping/history', (req, res) => {
  const rows = all(
    `SELECT sl.*, (SELECT COUNT(*) FROM shopping_item WHERE list_id = sl.id) AS items,
            (SELECT COALESCE(SUM(price),0) FROM shopping_item WHERE list_id = sl.id) AS total
     FROM shopping_list sl WHERE sl.house_id = ? ORDER BY sl.id DESC LIMIT 20`,
    Number(req.params.id)
  );
  res.json(rows);
});

r.post('/shopping-lists/:id/items', (req, res) => {
  const listId = Number(req.params.id);
  const name = String(req.body?.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'O item precisa de um nome' });
  run(
    'INSERT INTO shopping_item (list_id, name, qty, unit, category, note) VALUES (?,?,?,?,?,?)',
    listId, name, Number(req.body?.qty) || 1, req.body?.unit || 'un',
    req.body?.category || guessCategory(name), 'adicionado à mão'
  );
  res.json(listWithItems(listId));
});

r.patch('/shopping-items/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = get('SELECT * FROM shopping_item WHERE id = ?', id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  const b = req.body ?? {};
  const fields = [];
  const values = [];
  if (b.name !== undefined) { fields.push('name = ?'); values.push(String(b.name).trim() || item.name); }
  if (b.qty !== undefined) { fields.push('qty = ?'); values.push(Math.max(0, Number(b.qty) || 0)); }
  if (b.unit !== undefined) { fields.push('unit = ?'); values.push(b.unit); }
  if (b.checked !== undefined) { fields.push('checked = ?'); values.push(b.checked ? 1 : 0); }
  if (b.price !== undefined) { fields.push('price = ?'); values.push(b.price === null || b.price === '' ? null : Number(b.price)); }
  if (fields.length) run(`UPDATE shopping_item SET ${fields.join(', ')} WHERE id = ?`, ...values, id);

  res.json(listWithItems(item.list_id));
});

r.delete('/shopping-items/:id', (req, res) => {
  const item = get('SELECT * FROM shopping_item WHERE id = ?', Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  run('DELETE FROM shopping_item WHERE id = ?', item.id);
  res.json(listWithItems(item.list_id));
});

/** Fecha a lista e, se pedido, joga o que foi marcado direto na geladeira. */
r.post('/shopping-lists/:id/close', (req, res) => {
  const listId = Number(req.params.id);
  const list = get('SELECT * FROM shopping_list WHERE id = ?', listId);
  if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

  const stock = req.body?.stock !== false;
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;

  const added = tx(() => {
    const checked = all('SELECT * FROM shopping_item WHERE list_id = ? AND checked = 1', listId);
    if (stock) {
      for (const it of checked) {
        applyMove({
          houseId: list.house_id, name: it.name, category: it.category,
          qty: it.qty, unit: it.unit, reason: 'comprado', price: it.price, loggedBy: memberId,
        });
      }
    }
    run("UPDATE shopping_list SET status = 'fechada', closed_at = datetime('now') WHERE id = ?", listId);
    const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
    logEvent(
      list.house_id, '✅',
      `${who?.name ?? 'Alguém'} fechou a lista de compras${stock && checked.length ? ` e guardou ${checked.length} itens` : ''}`,
      'compras', memberId
    );
    return checked.length;
  });

  res.json({ ok: true, stocked: stock ? added : 0 });
});

export default r;

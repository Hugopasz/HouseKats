import { all, get, run } from '../db.js';
import { macrosFor, toBase, guessEmoji, norm, CATEGORIES } from './food.js';
import { targetsFor, dayIsHealthy } from './nutrition.js';
import { isFrozen } from './travel.js';

export const today = () => new Date().toISOString().slice(0, 10);
export const daysFromNow = (iso) => {
  if (!iso) return null;
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000);
};

/** Item com macros do estoque e status de validade. */
export function decorateItem(it) {
  const macros = macrosFor(it.name, it.category, it.qty, it.unit);
  const left = daysFromNow(it.expires_at);
  const congelado = !!it.frozen;
  return {
    ...it,
    // kcal fracionada não ajuda ninguém a decidir nada
    macros: { ...macros, kcal: Math.round(macros.kcal) },
    daysLeft: left,
    // congelado não entra em pânico de validade; sobra vencida vira alerta forte
    status: left === null ? 'ok'
      : left < 0 ? 'vencido'
      : congelado ? 'congelado'
      : left <= 2 ? 'urgente'
      : left <= 5 ? 'atencao'
      : 'ok',
    frozen: congelado,
    isLeftover: it.kind === 'sobra',
    emoji: it.kind === 'sobra' ? '🍲' : guessEmoji(it.name, it.category),
    categoryLabel: CATEGORIES[it.category]?.label ?? 'Outro',
    categoryEmoji: CATEGORIES[it.category]?.emoji ?? '🧂',
    categoryColor: CATEGORIES[it.category]?.color ?? '#7c8496',
  };
}

export function pantryOf(houseId) {
  return all('SELECT * FROM pantry_item WHERE house_id = ? AND qty > 0 ORDER BY category, name', houseId)
    .map(decorateItem);
}

/**
 * Quantas refeições a casa ainda consegue montar.
 * Uma refeição de verdade precisa de proteína E carboidrato, então o total é
 * limitado pelo que estiver mais escasso, e é isso que vira o "gargalo".
 */
export function mealsAvailable(houseId, members) {
  const items = pantryOf(houseId);
  const totals = { protein: 0, carbs: 0, kcal: 0 };
  for (const it of items) {
    totals.protein += it.macros.protein;
    totals.carbs += it.macros.carbs;
    totals.kcal += it.macros.kcal;
  }

  const targets = members.map(targetsFor);
  const mealsPerDay = targets.reduce((s, t) => s + t.mealsPerDay, 0) || 1;
  const proteinPerDay = targets.reduce((s, t) => s + t.protein, 0) || 1;
  const carbsPerDay = targets.reduce((s, t) => s + t.carbs, 0) || 1;

  const perMealProtein = proteinPerDay / mealsPerDay;
  const perMealCarbs = carbsPerDay / mealsPerDay;

  const byProtein = totals.protein / perMealProtein;
  const byCarbs = totals.carbs / perMealCarbs;

  const meals = Math.floor(Math.min(byProtein, byCarbs));
  const bottleneck = byProtein <= byCarbs ? 'proteina' : 'carboidrato';

  return {
    meals,
    days: mealsPerDay ? +(meals / mealsPerDay).toFixed(1) : 0,
    bottleneck,
    bottleneckLabel: bottleneck === 'proteina' ? 'proteína' : 'carboidrato',
    totals: {
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      kcal: Math.round(totals.kcal),
    },
    itemCount: items.length,
  };
}

/**
 * Três gavetas para as receitas do livro. Café da manhã entra em lanche: é a
 * refeição leve da casa, e o usuário só quer três números, não cinco.
 */
const GAVETA = { doce: 'sobremesas', 'café da manhã': 'lanches', lanche: 'lanches' };
const gavetaDe = (tags) => {
  for (const t of tags) if (GAVETA[t]) return GAVETA[t];
  return 'caseira';
};

/**
 * Quantas receitas do livro da casa dá para fazer agora mesmo, por tipo.
 * O critério é o mesmo do livro (nenhum ingrediente faltando, comparando por
 * nome), então o número daqui bate com o que a tela do livro mostra.
 */
export function receitasPossiveis(houseId) {
  const have = pantryOf(houseId).filter((p) => p.qty > 0).map((p) => norm(p.name));

  const receitas = all(
    `SELECT r.id, r.tags FROM house_recipe hr JOIN recipe r ON r.id = hr.recipe_id
     WHERE hr.house_id = ?`,
    houseId
  );

  const conta = { lanches: 0, caseira: 0, sobremesas: 0 };
  const total = { lanches: 0, caseira: 0, sobremesas: 0 };

  for (const rec of receitas) {
    const gaveta = gavetaDe(JSON.parse(rec.tags || '[]'));
    total[gaveta] += 1;

    // ingrediente opcional não impede ninguém de cozinhar
    const ing = all(
      'SELECT name FROM recipe_ingredient WHERE recipe_id = ? AND optional = 0', rec.id
    );
    const falta = ing.some((i) => {
      const n = norm(i.name);
      return !have.some((h) => h.includes(n) || n.includes(h));
    });
    if (!falta) conta[gaveta] += 1;
  }

  return [
    { key: 'lanches', label: 'Lanches', emoji: '🥪', n: conta.lanches, total: total.lanches },
    { key: 'caseira', label: 'Comida caseira', emoji: '🍲', n: conta.caseira, total: total.caseira },
    { key: 'sobremesas', label: 'Sobremesas', emoji: '🍮', n: conta.sobremesas, total: total.sobremesas },
  ];
}

/** O que vence nos próximos N dias (base do Modo Viagem e dos alertas). */
export function expiring(houseId, withinDays = 4) {
  return pantryOf(houseId)
    .filter((it) => it.daysLeft !== null && it.daysLeft <= withinDays)
    .sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));
}

/** Macros que uma pessoa consumiu num dia, a partir das atribuições confirmadas. */
export function nutritionOfDay(memberId, day = today()) {
  const rows = all(
    `SELECT c.share, m.item_name, m.category, m.delta, m.unit
     FROM consumption_claim c JOIN stock_move m ON m.id = c.move_id
     WHERE c.member_id = ? AND c.day = ? AND c.status != 'contested' AND m.reason = 'consumido'`,
    memberId, day
  );
  const out = { kcal: 0, protein: 0, carbs: 0, fat: 0, count: rows.length };
  for (const r of rows) {
    const mac = macrosFor(r.item_name, r.category, Math.abs(r.delta) * r.share, r.unit);
    out.kcal += mac.kcal;
    out.protein += mac.protein;
    out.carbs += mac.carbs;
    out.fat += mac.fat;
  }
  for (const k of ['kcal', 'protein', 'carbs', 'fat']) out[k] = Math.round(out[k]);
  return out;
}

/**
 * Recalcula o streak de alimentação: dias seguidos comendo direito.
 * A régua premia constância (2+ registros no dia, entre 60% e 140% da meta),
 * não bater a dieta na vírgula.
 */
export function recomputeStreak(memberId) {
  const member = get('SELECT * FROM member WHERE id = ?', memberId);
  if (!member) return null;
  const target = targetsFor(member);

  let current = 0;
  const cursor = new Date();
  // se hoje ainda não fechou, começa a contagem de ontem
  for (let i = 0; i < 400; i++) {
    const day = cursor.toISOString().slice(0, 10);
    // Modo Viagem: o dia não conta nem a favor nem contra, a streak fica congelada
    if (isFrozen(member.house_id, day, memberId)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const n = nutritionOfDay(memberId, day);
    const good = dayIsHealthy(n.kcal, target.kcal, n.count);
    if (good) current++;
    else if (i > 0 || n.count > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }

  const prev = get('SELECT * FROM streak WHERE member_id = ?', memberId);
  const best = Math.max(current, prev?.best ?? 0);
  run(
    `INSERT INTO streak (member_id, current, best, last_day) VALUES (?,?,?,?)
     ON CONFLICT(member_id) DO UPDATE SET current = excluded.current, best = excluded.best, last_day = excluded.last_day`,
    memberId, current, best, today()
  );
  return { current, best };
}

/** Aplica um movimento no estoque e devolve o item resultante. */
export function applyMove({ houseId, itemId, name, category, qty, unit, reason, price, loggedBy }) {
  const delta = reason === 'consumido' || reason === 'estragou' ? -Math.abs(qty) : qty;

  let item = itemId
    ? get('SELECT * FROM pantry_item WHERE id = ? AND house_id = ?', itemId, houseId)
    : get('SELECT * FROM pantry_item WHERE house_id = ? AND lower(name) = lower(?) AND unit = ?', houseId, name, unit);

  if (item) {
    // arredonda para 3 casas: sem isso o float acumula e vira 0.8999999999999999
    const next = Math.max(0, Math.round((item.qty + delta) * 1000) / 1000);
    run("UPDATE pantry_item SET qty = ?, updated_at = datetime('now') WHERE id = ?", next, item.id);
    item = get('SELECT * FROM pantry_item WHERE id = ?', item.id);
  } else if (delta > 0) {
    const info = run(
      'INSERT INTO pantry_item (house_id, name, category, qty, unit, expires_at, expiry_source) VALUES (?,?,?,?,?,?,?)',
      houseId, name, category, delta, unit, null, 'auto'
    );
    item = get('SELECT * FROM pantry_item WHERE id = ?', Number(info.lastInsertRowid));
  } else {
    return { item: null, moveId: null };
  }

  const info = run(
    `INSERT INTO stock_move (house_id, item_id, item_name, category, delta, unit, reason, price, logged_by)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    houseId, item.id, item.name, item.category, delta, unit, reason,
    price === undefined || price === null || price === '' ? null : Number(price),
    loggedBy ?? null
  );

  return { item, moveId: Number(info.lastInsertRowid) };
}

/** Quantidade formatada para as mensagens do log. */
export const fmtQty = (qty, unit) => {
  const n = Number(qty);
  const clean = Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
  return unit === 'un' ? clean : `${clean} ${unit}`;
};

/** "0,3 kg de Peito de Frango" / "12 Ovos". Sem o "de" quando é contagem. */
export const fmtItem = (qty, unit, name) =>
  unit === 'un' ? `${fmtQty(qty, unit)} ${name}` : `${fmtQty(qty, unit)} de ${name}`;

export { toBase };

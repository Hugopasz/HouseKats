import { all, get } from '../db.js';
import { CATEGORIES, guessEmoji, norm } from './food.js';
import { pantryOf, today } from './fridge.js';

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Padrões de gasto e de gosto da casa, direto do histórico de movimentos.
 * Tudo sai de stock_move, consumption_claim e cook_log. Nada é estimado à parte.
 */
export function insights(houseId, months = 6) {
  // ---- gasto por mês
  const spendByMonth = all(
    `SELECT substr(day, 1, 7) AS month, ROUND(SUM(price), 2) AS total, COUNT(*) AS items
     FROM stock_move
     WHERE house_id = ? AND price IS NOT NULL AND day >= date('now', ?)
     GROUP BY month ORDER BY month`,
    houseId, `-${months} months`
  ).map((r) => ({ ...r, total: money(r.total) }));

  // ---- gasto por categoria
  const spendByCategory = all(
    `SELECT category, ROUND(SUM(price), 2) AS total, COUNT(*) AS items
     FROM stock_move
     WHERE house_id = ? AND price IS NOT NULL AND day >= date('now', ?)
     GROUP BY category ORDER BY total DESC`,
    houseId, `-${months} months`
  ).map((r) => ({
    ...r,
    total: money(r.total),
    label: CATEGORIES[r.category]?.label ?? 'Outro',
    emoji: CATEGORIES[r.category]?.emoji ?? '🧂',
    color: CATEGORIES[r.category]?.color ?? '#7c8496',
  }));

  const totalSpent = money(spendByCategory.reduce((s, r) => s + r.total, 0));

  // ---- mercado x delivery: comida pronta pesa diferente no bolso
  const ORIGENS = {
    comprado: { label: 'Mercado', emoji: '🛒', color: '#3fae8f' },
    delivery: { label: 'Delivery', emoji: '🛵', color: '#e8615a' },
    ganho: { label: 'Ganho', emoji: '🎁', color: '#a06ad4' },
    ajuste: { label: 'Ajuste', emoji: '⚖️', color: '#7c8496' },
  };
  const spendBySource = all(
    `SELECT reason, ROUND(SUM(COALESCE(price,0)), 2) AS total, COUNT(*) AS items
     FROM stock_move
     WHERE house_id = ? AND reason IN ('comprado','delivery') AND day >= date('now', ?)
     GROUP BY reason ORDER BY total DESC`,
    houseId, `-${months} months`
  ).map((r) => ({
    ...r,
    total: money(r.total),
    label: ORGIN_LABEL(r.reason),
    emoji: ORIGENS[r.reason]?.emoji ?? '🛒',
    color: ORIGENS[r.reason]?.color ?? '#7c8496',
    pct: totalSpent ? Math.round((money(r.total) / totalSpent) * 100) : 0,
  }));

  function ORGIN_LABEL(reason) {
    return ORIGENS[reason]?.label ?? 'Outro';
  }

  const deliveryTotal = spendBySource.find((s) => s.reason === 'delivery')?.total ?? 0;
  const mercadoTotal = spendBySource.find((s) => s.reason === 'comprado')?.total ?? 0;

  // delivery por mês, para ver se o hábito está crescendo
  const deliveryByMonth = all(
    `SELECT substr(day, 1, 7) AS month, ROUND(SUM(COALESCE(price,0)), 2) AS total, COUNT(*) AS items
     FROM stock_move
     WHERE house_id = ? AND reason = 'delivery' AND day >= date('now', ?)
     GROUP BY month ORDER BY month`,
    houseId, `-${months} months`
  ).map((r) => ({ ...r, total: money(r.total) }));

  // ---- o que mais entra em casa
  const topBought = all(
    `SELECT item_name AS name, COUNT(*) AS times, ROUND(SUM(COALESCE(price,0)), 2) AS spent
     FROM stock_move
     WHERE house_id = ? AND reason IN ('comprado','delivery') AND day >= date('now', ?)
     GROUP BY lower(item_name) ORDER BY times DESC, spent DESC LIMIT 8`,
    houseId, `-${months} months`
  ).map((r) => ({ ...r, spent: money(r.spent), emoji: guessEmoji(r.name) }));

  // ---- desperdício
  const wasted = all(
    `SELECT item_name AS name, COUNT(*) AS times
     FROM stock_move
     WHERE house_id = ? AND reason = 'estragou' AND day >= date('now', ?)
     GROUP BY lower(item_name) ORDER BY times DESC LIMIT 6`,
    houseId, `-${months} months`
  ).map((r) => ({ ...r, emoji: guessEmoji(r.name) }));

  const moveCounts = get(
    `SELECT
       SUM(CASE WHEN reason = 'estragou'  THEN 1 ELSE 0 END) AS spoiled,
       SUM(CASE WHEN reason = 'consumido' THEN 1 ELSE 0 END) AS eaten
     FROM stock_move WHERE house_id = ? AND day >= date('now', ?)`,
    houseId, `-${months} months`
  );
  const outflow = (moveCounts?.spoiled ?? 0) + (moveCounts?.eaten ?? 0);
  const wastePct = outflow ? Math.round(((moveCounts.spoiled ?? 0) / outflow) * 100) : 0;

  // ---- gostos: receitas mais feitas e mais bem avaliadas
  const topCooked = all(
    `SELECT r.name, r.emoji, hr.times_cooked AS times, hr.comfort,
            (SELECT ROUND(AVG(stars),1) FROM recipe_rating WHERE house_recipe_id = hr.id) AS stars
     FROM house_recipe hr JOIN recipe r ON r.id = hr.recipe_id
     WHERE hr.house_id = ? AND hr.times_cooked > 0
     ORDER BY hr.times_cooked DESC LIMIT 6`,
    houseId
  ).map((r) => ({ ...r, comfort: !!r.comfort }));

  const topRated = all(
    `SELECT r.name, r.emoji, ROUND(AVG(rr.stars),1) AS stars, COUNT(rr.member_id) AS votes
     FROM recipe_rating rr
     JOIN house_recipe hr ON hr.id = rr.house_recipe_id
     JOIN recipe r ON r.id = hr.recipe_id
     WHERE hr.house_id = ?
     GROUP BY r.id HAVING votes > 0
     ORDER BY stars DESC, votes DESC LIMIT 6`,
    houseId
  );

  // ---- gosto por categoria: o que a casa realmente come
  const eatenByCategory = all(
    `SELECT m.category, ROUND(SUM(ABS(m.delta) * c.share), 1) AS qty, COUNT(*) AS times
     FROM consumption_claim c JOIN stock_move m ON m.id = c.move_id
     WHERE c.house_id = ? AND m.reason = 'consumido' AND c.status != 'contested'
     GROUP BY m.category ORDER BY times DESC`,
    houseId
  ).map((r) => ({
    ...r,
    label: CATEGORIES[r.category]?.label ?? 'Outro',
    emoji: CATEGORIES[r.category]?.emoji ?? '🧂',
    color: CATEGORIES[r.category]?.color ?? '#7c8496',
  }));

  // ---- por integrante
  const byMember = all('SELECT id, name, emoji, color FROM member WHERE house_id = ? ORDER BY id', houseId)
    .map((m) => {
      const eats = get(
        `SELECT COUNT(*) AS n FROM consumption_claim
         WHERE member_id = ? AND status != 'contested' AND day >= date('now', ?)`,
        m.id, `-${months} months`
      ).n;
      const bought = get(
        `SELECT COUNT(*) AS n, ROUND(SUM(COALESCE(price,0)),2) AS total FROM stock_move
         WHERE logged_by = ? AND reason IN ('comprado','delivery') AND day >= date('now', ?)`,
        m.id, `-${months} months`
      );
      const chores = get(
        `SELECT COUNT(*) AS n, COALESCE(SUM(stars),0) AS stars FROM chore_done
         WHERE member_id = ? AND day >= date('now', ?)`,
        m.id, `-${months} months`
      );
      return {
        ...m,
        meals: eats,
        purchases: bought.n,
        spent: money(bought.total),
        chores: chores.n,
        stars: Math.round(chores.stars * 10) / 10,
      };
    });

  // ---- custo por pessoa por dia: divide o gasto pelos dias-pessoa alimentados
  const personDays = get(
    `SELECT COUNT(*) AS n FROM (
       SELECT DISTINCT day, member_id FROM consumption_claim
       WHERE house_id = ? AND day >= date('now', ?) AND status != 'contested'
     )`,
    houseId, `-${months} months`
  ).n;
  const mealsLogged = get(
    `SELECT COUNT(DISTINCT move_id) AS n FROM consumption_claim
     WHERE house_id = ? AND day >= date('now', ?) AND status != 'contested'`,
    houseId, `-${months} months`
  ).n;

  return {
    months,
    totalSpent,
    spendByMonth,
    spendByCategory,
    spendBySource,
    deliveryByMonth,
    deliveryTotal,
    mercadoTotal,
    deliveryPct: totalSpent ? Math.round((deliveryTotal / totalSpent) * 100) : 0,
    topBought,
    wasted,
    wastePct,
    spoiledCount: moveCounts?.spoiled ?? 0,
    topCooked,
    topRated,
    eatenByCategory,
    byMember,
    costPerPersonDay: personDays ? money(totalSpent / personDays) : 0,
    personDays,
    mealsLogged,
  };
}

// ---------------------------------------------------------------- modo viagem
/**
 * O que fazer com a geladeira antes de viajar: o que não sobrevive ao período
 * fora vira sugestão de consumir, congelar ou doar.
 */
export function travelPlan(houseId, days) {
  const back = new Date();
  back.setDate(back.getDate() + Number(days));
  const returnDay = back.toISOString().slice(0, 10);

  const items = pantryOf(houseId);
  const buckets = { consumir: [], congelar: [], doar: [], sobrevive: [] };

  for (const it of items) {
    // sem validade conhecida, assume que aguenta
    if (it.daysLeft === null) { buckets.sobrevive.push(it); continue; }
    if (it.daysLeft > days) { buckets.sobrevive.push(it); continue; }

    const freezable = ['proteina', 'carboidrato'].includes(it.category) && it.unit !== 'un';
    const perishable = it.category === 'hortifruti';

    if (it.daysLeft <= 2) buckets.consumir.push(it);
    else if (freezable) buckets.congelar.push(it);
    else if (perishable) buckets.doar.push(it);
    else buckets.consumir.push(it);
  }

  const atRisk = buckets.consumir.length + buckets.congelar.length + buckets.doar.length;
  return { days, returnDay, today: today(), ...buckets, atRisk, total: items.length };
}

export { norm };

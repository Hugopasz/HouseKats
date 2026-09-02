import { all, get, run } from '../db.js';
import { CATEGORIES, estimateExpiry, guessCategory, guessEmoji, guessUnit, matchFood, norm, shelfLifeDays } from './food.js';

/** Congelar multiplica a durabilidade: o número é grosseiro, mas a ideia é certa. */
export const FATOR_CONGELADO = 12;
export const MAX_DIAS_CONGELADO = 180;

/**
 * A casa vai ensinando o app. Todo alimento novo digitado vira um registro que
 * passa a aparecer no autocomplete daquela casa, com os dados que a pessoa deu.
 */
export function lembrarAlimento(houseId, { name, category, unit, price, qty, shelfDays }) {
  const n = norm(name);
  if (!n) return null;

  // se já existe na tabela oficial do app, não precisa lembrar
  if (matchFood(name)) return null;

  const existente = get('SELECT * FROM custom_food WHERE house_id = ? AND norm_name = ?', houseId, n);
  if (existente) {
    // preço por unidade base, para a lista de compras aproveitar depois
    const unitario = price && qty ? Math.round((price / qty) * 100) / 100 : existente.price;
    run(
      `UPDATE custom_food SET uses = uses + 1, category = ?, unit = ?, price = COALESCE(?, price),
         shelf_days = COALESCE(?, shelf_days) WHERE id = ?`,
      category || existente.category, unit || existente.unit, unitario, shelfDays ?? null, existente.id
    );
    return get('SELECT * FROM custom_food WHERE id = ?', existente.id);
  }

  const info = run(
    `INSERT INTO custom_food (house_id, name, norm_name, category, unit, emoji, shelf_days, price)
     VALUES (?,?,?,?,?,?,?,?)`,
    houseId, String(name).trim(), n,
    CATEGORIES[category] ? category : guessCategory(name),
    unit || guessUnit(name),
    guessEmoji(name, category),
    shelfDays ?? null,
    price && qty ? Math.round((price / qty) * 100) / 100 : null
  );
  return get('SELECT * FROM custom_food WHERE id = ?', Number(info.lastInsertRowid));
}

/** Alimentos que a casa já usou, para o autocomplete. */
export function alimentosDaCasa(houseId, termo = '', limite = 8) {
  const n = norm(termo);
  const rows = all(
    'SELECT * FROM custom_food WHERE house_id = ? ORDER BY uses DESC, name',
    houseId
  ).filter((f) => !n || f.norm_name.includes(n));
  return rows.slice(0, limite).map((f) => ({
    name: f.name,
    category: f.category,
    unit: f.unit,
    emoji: f.emoji,
    daCasa: true,
  }));
}

/** Validade de um item, considerando congelamento e o tipo de comida. */
export function validadeDe(name, category, { frozen = false, kind = 'item', dias = null, from = null } = {}) {
  if (dias != null) {
    const base = from ? new Date(from) : new Date();
    base.setDate(base.getDate() + Number(dias));
    return base.toISOString().slice(0, 10);
  }
  if (!frozen) return estimateExpiry(name, category, from);

  const normal = kind === 'sobra' ? 3 : shelfLifeDays(name, category);
  const congelado = Math.min(MAX_DIAS_CONGELADO, Math.round(normal * FATOR_CONGELADO));
  const base = from ? new Date(from) : new Date();
  base.setDate(base.getDate() + congelado);
  return base.toISOString().slice(0, 10);
}

/** Sobras que já passaram do prazo e precisam ir para o lixo. */
export function sobrasVencidas(houseId) {
  const hoje = new Date().toISOString().slice(0, 10);
  return all(
    `SELECT * FROM pantry_item
     WHERE house_id = ? AND kind = 'sobra' AND qty > 0 AND expires_at IS NOT NULL AND expires_at < ?
     ORDER BY expires_at`,
    houseId, hoje
  );
}

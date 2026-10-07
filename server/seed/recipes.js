import { createHash } from 'node:crypto';
import { all, get, run, db } from '../db.js';
import { guessCategory, macrosFor, opcoesDe } from '../lib/food.js';
import lotA from './recipes-a.js';
import lotB from './recipes-b.js';
import lotC from './recipes-c.js';

const CATALOG = [...lotA, ...lotB, ...lotC];

/**
 * Um ingrediente da receita e [nome, qtd, unidade] e, opcionalmente, um quarto
 * campo com os substitutos aceitos: o nome de um grupo ('queijo-derrete') ou uma
 * lista pronta (['Mussarela', 'Provolone']).
 */
function lerIngrediente(linha) {
  const [name, qty, unit, alts] = linha;
  return { name, qty, unit, alts: opcoesDe(alts) };
}

/** Macros por porção, somados a partir dos ingredientes. */
function macrosOf(recipe) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const linha of recipe.ing) {
    const { name, qty, unit } = lerIngrediente(linha);
    const m = macrosFor(name, guessCategory(name), qty, unit);
    total.kcal += m.kcal;
    total.protein += m.protein;
    total.carbs += m.carbs;
    total.fat += m.fat;
  }
  const s = Math.max(1, recipe.serv);
  return {
    kcal: Math.round(total.kcal / s),
    protein: Math.round(total.protein / s),
    carbs: Math.round(total.carbs / s),
    fat: Math.round(total.fat / s),
  };
}

/** Impressão digital do conteúdo: muda quando a receita muda no código. */
function hashOf(rec) {
  return createHash('sha1')
    .update(JSON.stringify([rec.name, rec.e, rec.d, rec.min, rec.serv, rec.tags, rec.steps, rec.ing]))
    .digest('hex')
    .slice(0, 16);
}

function gravarIngredientes(recipeId, rec) {
  for (const linha of rec.ing) {
    const { name, qty, unit, alts } = lerIngrediente(linha);
    run(
      'INSERT INTO recipe_ingredient (recipe_id, name, qty, unit, category, alts) VALUES (?,?,?,?,?,?)',
      recipeId, name, qty, unit, guessCategory(name), JSON.stringify(alts)
    );
  }
}

/**
 * Popula o catálogo global. Idempotente: roda a cada boot sem duplicar.
 * Receita que já existe e mudou no código é atualizada no lugar — o id continua
 * o mesmo, então o livro da casa, as notas e o histórico de preparos ficam de pé.
 * Nada fora de `source = 'catalog'` é tocado: receita criada pela casa é dela.
 */
export function seedRecipes() {
  const existing = new Map(
    all("SELECT id, slug, content_hash FROM recipe WHERE source = 'catalog'").map((r) => [r.slug, r])
  );
  let added = 0;
  let updated = 0;

  db.exec('BEGIN');
  try {
    for (const rec of CATALOG) {
      const hash = hashOf(rec);
      const m = macrosOf(rec);
      const atual = existing.get(rec.slug);

      if (atual) {
        if (atual.content_hash === hash) continue;
        run(
          `UPDATE recipe SET name = ?, emoji = ?, description = ?, minutes = ?, servings = ?,
             kcal = ?, protein = ?, carbs = ?, fat = ?, tags = ?, steps = ?, content_hash = ?
           WHERE id = ? AND source = 'catalog'`,
          rec.name, rec.e, rec.d, rec.min, rec.serv,
          m.kcal, m.protein, m.carbs, m.fat,
          JSON.stringify(rec.tags ?? []), JSON.stringify(rec.steps ?? []), hash,
          atual.id
        );
        run('DELETE FROM recipe_ingredient WHERE recipe_id = ?', atual.id);
        gravarIngredientes(atual.id, rec);
        updated++;
        continue;
      }

      const info = run(
        `INSERT INTO recipe (slug, name, emoji, description, minutes, servings, kcal, protein, carbs, fat, tags, steps, source, content_hash)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'catalog',?)`,
        rec.slug, rec.name, rec.e, rec.d, rec.min, rec.serv,
        m.kcal, m.protein, m.carbs, m.fat,
        JSON.stringify(rec.tags ?? []), JSON.stringify(rec.steps ?? []), hash
      );
      gravarIngredientes(Number(info.lastInsertRowid), rec);
      added++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const total = get("SELECT COUNT(*) AS n FROM recipe WHERE source = 'catalog'").n;
  return { added, updated, total };
}

export { CATALOG };

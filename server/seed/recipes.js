import { all, get, run, db } from '../db.js';
import { guessCategory, macrosFor } from '../lib/food.js';
import lotA from './recipes-a.js';
import lotB from './recipes-b.js';

const CATALOG = [...lotA, ...lotB];

/** Macros por porção, somados a partir dos ingredientes. */
function macrosOf(recipe) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const [name, qty, unit] of recipe.ing) {
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

/** Popula o catálogo global. Idempotente: roda a cada boot sem duplicar. */
export function seedRecipes() {
  const existing = new Set(all("SELECT slug FROM recipe WHERE source = 'catalog'").map((r) => r.slug));
  let added = 0;

  db.exec('BEGIN');
  try {
    for (const rec of CATALOG) {
      if (existing.has(rec.slug)) continue;
      const m = macrosOf(rec);
      const info = run(
        `INSERT INTO recipe (slug, name, emoji, description, minutes, servings, kcal, protein, carbs, fat, tags, steps, source)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'catalog')`,
        rec.slug, rec.name, rec.e, rec.d, rec.min, rec.serv,
        m.kcal, m.protein, m.carbs, m.fat,
        JSON.stringify(rec.tags ?? []), JSON.stringify(rec.steps ?? [])
      );
      const id = Number(info.lastInsertRowid);
      for (const [name, qty, unit] of rec.ing) {
        run(
          'INSERT INTO recipe_ingredient (recipe_id, name, qty, unit, category) VALUES (?,?,?,?,?)',
          id, name, qty, unit, guessCategory(name)
        );
      }
      added++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const total = get("SELECT COUNT(*) AS n FROM recipe WHERE source = 'catalog'").n;
  return { added, total };
}

export { CATALOG };

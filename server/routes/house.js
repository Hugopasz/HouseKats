import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { COLORS, randomTitle } from '../lib/fun.js';
import { targetsFor, DIETS, GOALS } from '../lib/nutrition.js';
import { senhaBarrou } from '../lib/senha.js';

const r = Router();

const str = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const numOrNull = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

function bad(res, msg) {
  return res.status(400).json({ error: msg });
}

/** Membro com metas estimadas e cor resolvida. */
export function decorateMember(m) {
  return {
    ...m,
    colorHex: COLORS[m.color]?.hex ?? COLORS.roxo.hex,
    colorSoft: COLORS[m.color]?.soft ?? COLORS.roxo.soft,
    dietLabel: DIETS[m.diet]?.label ?? 'Média',
    goalLabel: GOALS[m.goal]?.label ?? 'Manter',
    targets: targetsFor(m),
    isPet: m.kind === 'pet',
    isVisitor: !!m.temporary,
    visitDaysLeft: m.visit_until
      ? Math.round((new Date(m.visit_until + 'T00:00:00') - new Date(new Date().toISOString().slice(0,10) + 'T00:00:00')) / 86400000)
      : null,
    traveling: !!m.travel_until && m.travel_until >= new Date().toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------- estado
/**
 * Casa em criação é rascunho, não casa. Ela existe no banco porque os passos da
 * geladeira e das receitas precisam de um house_id para gravar, mas fica fora da
 * lista até o onboarding terminar, e some se for abandonada.
 */
r.get('/state', (_req, res) => {
  const rows = all(`
    SELECT h.*, (SELECT COUNT(*) FROM member WHERE house_id = h.id) AS members
    FROM house h ORDER BY h.id
  `);
  const houses = rows.filter((h) => h.onboarding_step === 'done');
  // o rascunho é o mais recente: é onde a pessoa estava de fato
  const draft = rows.filter((h) => h.onboarding_step !== 'done').at(-1) ?? null;
  res.json({ houses, draft, hasHouse: houses.length > 0 });
});

// ---------------------------------------------------------------- casas
r.post('/houses', (req, res) => {
  if (senhaBarrou(req, res)) return;
  const name = str(req.body?.name);
  if (!name) return bad(res, 'A casa precisa de um nome');
  const emoji = str(req.body?.emoji, '🏠');

  // só um rascunho por vez: começar outra criação descarta a anterior
  for (const d of all("SELECT id FROM house WHERE onboarding_step != 'done'")) {
    run('DELETE FROM house WHERE id = ?', d.id);
  }

  const info = run(
    "INSERT INTO house (name, emoji, onboarding_step) VALUES (?,?,'geladeira')",
    name, emoji
  );
  const id = Number(info.lastInsertRowid);
  logEvent(id, '🏠', `A casa ${name} foi criada`, 'casa');
  res.status(201).json(get('SELECT * FROM house WHERE id = ?', id));
});

/** Descarta a casa em criação, com tudo que já tinha entrado nela. */
r.delete('/draft', (_req, res) => {
  const rows = all("SELECT id, name FROM house WHERE onboarding_step != 'done'");
  for (const d of rows) run('DELETE FROM house WHERE id = ?', d.id);
  res.json({ ok: true, discarded: rows.length });
});

r.get('/houses/:id', (req, res) => {
  const house = get('SELECT * FROM house WHERE id = ?', Number(req.params.id));
  if (!house) return res.status(404).json({ error: 'Casa não encontrada' });
  const members = all('SELECT * FROM member WHERE house_id = ? ORDER BY id', house.id).map(decorateMember);
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    ...house,
    traveling: !!house.travel_until && house.travel_until >= today,
    members,
  });
});

r.patch('/houses/:id', (req, res) => {
  const id = Number(req.params.id);
  const house = get('SELECT * FROM house WHERE id = ?', id);
  if (!house) return res.status(404).json({ error: 'Casa não encontrada' });

  const fields = [];
  const values = [];
  for (const key of ['name', 'emoji', 'onboarding_step']) {
    if (req.body?.[key] !== undefined) { fields.push(`${key} = ?`); values.push(str(req.body[key], house[key])); }
  }
  if (req.body?.chores_unlocked !== undefined) {
    fields.push('chores_unlocked = ?'); values.push(req.body.chores_unlocked ? 1 : 0);
  }
  if (!fields.length) return res.json(house);

  run(`UPDATE house SET ${fields.join(', ')} WHERE id = ?`, ...values, id);
  res.json(get('SELECT * FROM house WHERE id = ?', id));
});

r.delete('/houses/:id', (req, res) => {
  if (senhaBarrou(req, res)) return;
  const id = Number(req.params.id);
  const house = get('SELECT * FROM house WHERE id = ?', id);
  if (!house) return res.status(404).json({ error: 'Casa não encontrada' });
  run('DELETE FROM house WHERE id = ?', id);
  res.json({ ok: true, deleted: house.name });
});

// ---------------------------------------------------------------- integrantes
r.post('/houses/:id/members', (req, res) => {
  const houseId = Number(req.params.id);
  const house = get('SELECT * FROM house WHERE id = ?', houseId);
  if (!house) return res.status(404).json({ error: 'Casa não encontrada' });

  const name = str(req.body?.name);
  if (!name) return bad(res, 'O integrante precisa de um nome');

  const used = all('SELECT title FROM member WHERE house_id = ?', houseId).map((m) => m.title);
  const b = req.body ?? {};
  const color = COLORS[b.color] ? b.color : 'roxo';

  // pet come mas não faz tarefa; visitante tem prazo e some depois
  const kind = b.kind === 'pet' ? 'pet' : 'pessoa';
  const temporary = kind === 'pessoa' && !!b.temporary;
  let visitUntil = null;
  if (temporary) {
    const dias = Math.max(1, Math.min(365, Number(b.visit_days) || 7));
    const ate = new Date();
    ate.setDate(ate.getDate() + dias);
    visitUntil = b.visit_until || ate.toISOString().slice(0, 10);
  }

  const info = run(
    `INSERT INTO member (house_id, name, emoji, title, age, weight_kg, height_cm, diet, goal, color,
                         kind, species, temporary, visit_until)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    houseId,
    name,
    str(b.emoji, kind === 'pet' ? '🐶' : '🐱'),
    str(b.title, kind === 'pet' ? 'Morador de quatro patas' : randomTitle(used)),
    numOrNull(b.age),
    numOrNull(b.weight_kg),
    numOrNull(b.height_cm),
    DIETS[b.diet] ? b.diet : 'media',
    GOALS[b.goal] ? b.goal : 'manter',
    color,
    kind,
    str(b.species, ''),
    temporary ? 1 : 0,
    visitUntil
  );
  const id = Number(info.lastInsertRowid);
  run('INSERT OR IGNORE INTO streak (member_id) VALUES (?)', id);

  const entrada = kind === 'pet'
    ? `${name} virou morador da casa 🐾`
    : temporary
      ? `${name} chegou para uma visita até ${visitUntil}`
      : `${name} entrou na casa`;
  logEvent(houseId, str(b.emoji, kind === 'pet' ? '🐶' : '🐱'), entrada, 'casa', id);

  res.status(201).json(decorateMember(get('SELECT * FROM member WHERE id = ?', id)));
});

r.patch('/members/:id', (req, res) => {
  const id = Number(req.params.id);
  const m = get('SELECT * FROM member WHERE id = ?', id);
  if (!m) return res.status(404).json({ error: 'Integrante não encontrado' });

  const b = req.body ?? {};
  const fields = [];
  const values = [];

  if (b.name !== undefined) { fields.push('name = ?'); values.push(str(b.name, m.name)); }
  if (b.emoji !== undefined) { fields.push('emoji = ?'); values.push(str(b.emoji, m.emoji)); }
  if (b.title !== undefined) { fields.push('title = ?'); values.push(str(b.title, m.title)); }
  if (b.age !== undefined) { fields.push('age = ?'); values.push(numOrNull(b.age)); }
  if (b.weight_kg !== undefined) { fields.push('weight_kg = ?'); values.push(numOrNull(b.weight_kg)); }
  if (b.height_cm !== undefined) { fields.push('height_cm = ?'); values.push(numOrNull(b.height_cm)); }
  if (b.diet !== undefined && DIETS[b.diet]) { fields.push('diet = ?'); values.push(b.diet); }
  if (b.goal !== undefined && GOALS[b.goal]) { fields.push('goal = ?'); values.push(b.goal); }
  if (b.color !== undefined && COLORS[b.color]) { fields.push('color = ?'); values.push(b.color); }
  // meta de calorias definida à mão; nulo volta para a estimativa do app
  if (b.custom_kcal !== undefined) {
    const k = numOrNull(b.custom_kcal);
    fields.push('custom_kcal = ?');
    values.push(k && k > 0 ? Math.round(k) : null);
  }
  if (b.travel_until !== undefined) { fields.push('travel_until = ?'); values.push(b.travel_until || null); }
  if (b.species !== undefined) { fields.push('species = ?'); values.push(str(b.species, '')); }
  if (b.visit_until !== undefined) { fields.push('visit_until = ?'); values.push(b.visit_until || null); }
  // deixar de ser visita mantém tudo: só tira o prazo de cima
  if (b.temporary !== undefined) {
    fields.push('temporary = ?');
    values.push(b.temporary ? 1 : 0);
    if (!b.temporary) { fields.push('visit_until = ?'); values.push(null); }
  }
  // visita nova pelo formulário: recalcula o prazo a partir dos dias
  if (b.visit_days !== undefined && b.temporary) {
    const dias = Math.max(1, Math.min(365, Number(b.visit_days) || 7));
    const ate = new Date();
    ate.setDate(ate.getDate() + dias);
    fields.push('visit_until = ?');
    values.push(ate.toISOString().slice(0, 10));
  }

  if (fields.length) run(`UPDATE member SET ${fields.join(', ')} WHERE id = ?`, ...values, id);
  res.json(decorateMember(get('SELECT * FROM member WHERE id = ?', id)));
});

r.delete('/members/:id', (req, res) => {
  const id = Number(req.params.id);
  const m = get('SELECT * FROM member WHERE id = ?', id);
  if (!m) return res.status(404).json({ error: 'Integrante não encontrado' });
  tx(() => {
    run('DELETE FROM member WHERE id = ?', id);
    logEvent(m.house_id, '👋', `${m.name} saiu da casa`, 'casa');
  });
  res.json({ ok: true });
});

// ---------------------------------------------------------------- log da casa
r.get('/houses/:id/log', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 60, 300);
  const rows = all(
    `SELECT l.*, m.name AS member_name, m.emoji AS member_emoji
     FROM log l LEFT JOIN member m ON m.id = l.member_id
     WHERE l.house_id = ? ORDER BY l.id DESC LIMIT ?`,
    Number(req.params.id), limit
  );
  res.json(rows);
});

export default r;

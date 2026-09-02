import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { insights, travelPlan } from '../lib/insights.js';
import { activeTravel } from '../lib/travel.js';
import { applyMove, recomputeStreak, today } from '../lib/fridge.js';

const r = Router();

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(n));
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------- insights
r.get('/houses/:id/insights', (req, res) => {
  const months = Math.max(1, Math.min(24, Number(req.query.months) || 6));
  res.json(insights(Number(req.params.id), months));
});

// ---------------------------------------------------------------- modo viagem
r.get('/houses/:id/travel', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.query.member ? Number(req.query.member) : null;
  const active = activeTravel(houseId, memberId);
  const upcoming = all(
    "SELECT t.*, m.name AS member_name FROM travel t LEFT JOIN member m ON m.id = t.member_id WHERE t.house_id = ? AND t.end_day >= date('now') ORDER BY t.start_day",
    houseId
  );
  res.json({ active, upcoming });
});

/** Prévia: o que fazer com a geladeira antes de sair. */
r.get('/houses/:id/travel/plan', (req, res) => {
  const days = Math.max(1, Math.min(180, Number(req.query.days) || 7));
  res.json(travelPlan(Number(req.params.id), days));
});

r.post('/houses/:id/travel', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const days = Math.max(1, Math.min(180, Number(b.days) || 7));
  const memberId = b.member_id ? Number(b.member_id) : null;   // nulo = casa toda
  const start = b.start_day || today();
  const end = b.end_day || addDays(days);

  const id = tx(() => {
    const info = run(
      'INSERT INTO travel (house_id, member_id, start_day, end_day, note) VALUES (?,?,?,?,?)',
      houseId, memberId, start, end, String(b.note ?? '')
    );
    if (memberId) {
      run('UPDATE member SET travel_until = ? WHERE id = ?', end, memberId);
      const who = get('SELECT name FROM member WHERE id = ?', memberId);
      logEvent(houseId, '✈️', `${who?.name ?? 'Alguém'} entrou em Modo Viagem até ${end}`, 'casa', memberId);
    } else {
      run("UPDATE house SET travel_until = ?, travel_started_at = ? WHERE id = ?", end, start, houseId);
      logEvent(houseId, '✈️', `A casa entrou em Modo Viagem até ${end}. Streaks e tarefas congeladas.`, 'casa');
    }
    return Number(info.lastInsertRowid);
  });

  // recalcula as streaks já congeladas
  for (const m of all('SELECT id FROM member WHERE house_id = ?', houseId)) recomputeStreak(m.id);

  res.status(201).json({ ...get('SELECT * FROM travel WHERE id = ?', id), plan: travelPlan(houseId, days) });
});

r.delete('/travel/:id', (req, res) => {
  const t = get('SELECT * FROM travel WHERE id = ?', Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Viagem não encontrada' });

  tx(() => {
    run('DELETE FROM travel WHERE id = ?', t.id);
    if (t.member_id) run('UPDATE member SET travel_until = NULL WHERE id = ?', t.member_id);
    else run('UPDATE house SET travel_until = NULL, travel_started_at = NULL WHERE id = ?', t.house_id);
    logEvent(t.house_id, '🏡', 'Modo Viagem encerrado. A casa voltou ao normal.', 'casa', t.member_id);
  });

  for (const m of all('SELECT id FROM member WHERE house_id = ?', t.house_id)) recomputeStreak(m.id);
  res.json({ ok: true });
});

/** Baixa em lote do que foi resolvido antes de viajar (consumido ou doado). */
r.post('/houses/:id/travel/resolve', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const memberId = b.member_id ? Number(b.member_id) : null;
  const action = ['consumido', 'estragou', 'ajuste'].includes(b.action) ? b.action : 'ajuste';
  const ids = (Array.isArray(b.item_ids) ? b.item_ids : []).map(Number).filter(Boolean);
  if (!ids.length) return res.status(400).json({ error: 'Escolha ao menos um item' });

  const names = tx(() => {
    const out = [];
    for (const id of ids) {
      const item = get('SELECT * FROM pantry_item WHERE id = ? AND house_id = ?', id, houseId);
      if (!item || item.qty <= 0) continue;
      applyMove({
        houseId, itemId: item.id, name: item.name, category: item.category,
        qty: item.qty, unit: item.unit, reason: action, loggedBy: memberId,
      });
      out.push(item.name);
    }
    const verb = action === 'consumido' ? 'consumiu' : action === 'estragou' ? 'descartou' : 'ajustou';
    const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
    logEvent(houseId, '🧳', `${who?.name ?? 'Alguém'} ${verb} ${out.length} itens antes da viagem`, 'geladeira', memberId);
    return out;
  });

  res.json({ ok: true, resolved: names.length });
});

export default r;

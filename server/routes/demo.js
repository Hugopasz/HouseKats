import { Router } from 'express';
import { buildDemo, clearDemos, PROFILES } from '../seed/demo.js';
import { get } from '../db.js';
import { senhaBarrou } from '../lib/senha.js';

const r = Router();

r.get('/demo/profiles', (_req, res) => {
  res.json(Object.values(PROFILES).map((p) => ({
    key: p.key, label: p.label, tag: p.tag, emoji: p.emoji, desc: p.desc,
    people: p.people.length, historyDays: p.historyDays,
  })));
});

/** Cria uma casa de exemplo cheia de dados, para ver o app funcionando. */
r.post('/demo', (req, res) => {
  if (senhaBarrou(req, res)) return;
  const key = String(req.body?.profile ?? '');
  if (!PROFILES[key]) return res.status(400).json({ error: 'Perfil inválido' });
  const out = buildDemo(key);
  res.status(201).json({ ...out, house: get('SELECT * FROM house WHERE id = ?', out.houseId) });
});

r.delete('/demo', (req, res) => {
  if (senhaBarrou(req, res)) return;
  res.json({ ok: true, removed: clearDemos() });
});

export default r;

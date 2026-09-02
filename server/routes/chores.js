import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import {
  BLOCK, calendar, choreStats, currentMonth, monthBoard, roundBlock,
  starsFor, suggestPlan, surveyProgress, today,
} from '../lib/chores.js';
import { CHORE_PRESETS, ROOM_PRESETS, SPECIAL_SUGGESTIONS } from '../seed/chores.js';
import { pick, REWARDS } from '../lib/fun.js';
import { MOEDAS, creditar } from '../lib/plaza.js';

const r = Router();

const SIZES = { pequeno: 2, medio: 3, grande: 4 };
const bad = (res, msg) => res.status(400).json({ error: msg });

// ---------------------------------------------------------------- setup
r.get('/chores/presets', (_req, res) => {
  res.json({ rooms: ROOM_PRESETS, chores: CHORE_PRESETS, specials: SPECIAL_SUGGESTIONS });
});

/** Estado do setup: cômodos, tarefas e quem já respondeu o questionário. */
r.get('/houses/:id/chores/setup', (req, res) => {
  const houseId = Number(req.params.id);
  const rooms = all('SELECT * FROM room WHERE house_id = ? ORDER BY id', houseId).map((room) => ({
    ...room,
    chores: all('SELECT * FROM chore WHERE room_id = ? AND is_special = 0 AND active = 1 ORDER BY name', room.id),
    avgDifficulty: get('SELECT ROUND(AVG(difficulty),1) AS d FROM room_vote WHERE room_id = ?', room.id)?.d ?? null,
  }));
  const survey = surveyProgress(houseId);
  const house = get('SELECT chores_unlocked FROM house WHERE id = ?', houseId);

  // o setup só fecha depois que todo mundo também escolheu a tarefa que não faz
  const membros = all("SELECT id, name, emoji FROM member WHERE house_id = ? AND kind = 'pessoa'", houseId);
  const vetos = all('SELECT member_id FROM chore_veto WHERE house_id = ?', houseId);
  const vetosFaltando = membros.filter((m) => !vetos.some((v) => v.member_id === m.id));

  res.json({
    unlocked: !!house?.chores_unlocked,
    rooms,
    survey,
    vetos: { total: vetos.length, faltando: vetosFaltando, completo: membros.length > 0 && !vetosFaltando.length },
    ready: rooms.length > 0 && survey.everyoneDone && membros.length > 0 && vetosFaltando.length === 0,
  });
});

/** Cria o cômodo já com as tarefas típicas dele. */
r.post('/houses/:id/rooms', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim();
  if (!name) return bad(res, 'O cômodo precisa de um nome');

  const size = SIZES[b.size] ? b.size : 'medio';
  const preset = b.preset && CHORE_PRESETS[b.preset] ? b.preset : null;

  const roomId = tx(() => {
    const info = run(
      'INSERT INTO room (house_id, name, emoji, size) VALUES (?,?,?,?)',
      houseId, name, String(b.emoji ?? '🚪'), size
    );
    const id = Number(info.lastInsertRowid);

    if (preset) {
      for (const c of CHORE_PRESETS[preset]) {
        run(
          'INSERT INTO chore (house_id, name, emoji, room_id) VALUES (?,?,?,?)',
          houseId, c.name, c.emoji, id
        );
      }
    }
    logEvent(houseId, b.emoji ?? '🚪', `${name} entrou no mapa da casa`, 'tarefas');
    return id;
  });

  res.status(201).json(get('SELECT * FROM room WHERE id = ?', roomId));
});

r.delete('/rooms/:id', (req, res) => {
  const room = get('SELECT * FROM room WHERE id = ?', Number(req.params.id));
  if (!room) return res.status(404).json({ error: 'Cômodo não encontrado' });
  run('DELETE FROM room WHERE id = ?', room.id);
  logEvent(room.house_id, '🚪', `${room.name} saiu do mapa da casa`, 'tarefas');
  res.json({ ok: true });
});

// ---------------------------------------------------------------- questionário
/** O questionário de um integrante: tempo e dificuldade de cada tarefa e cômodo. */
r.get('/houses/:id/survey', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = Number(req.query.member);
  if (!memberId) return bad(res, 'Informe o integrante');

  const rooms = all('SELECT * FROM room WHERE house_id = ? ORDER BY id', houseId).map((room) => ({
    ...room,
    myVote: get('SELECT difficulty FROM room_vote WHERE room_id = ? AND member_id = ?', room.id, memberId)?.difficulty ?? null,
    suggested: SIZES[room.size] ?? 3,
  }));

  const chores = all(
    `SELECT c.*, r.name AS room_name, r.emoji AS room_emoji
     FROM chore c LEFT JOIN room r ON r.id = c.room_id
     WHERE c.house_id = ? AND c.is_special = 0 AND c.active = 1
     ORDER BY r.id, c.name`,
    houseId
  ).map((c) => {
    const mine = get('SELECT minutes, difficulty FROM chore_vote WHERE chore_id = ? AND member_id = ?', c.id, memberId);
    const preset = Object.values(CHORE_PRESETS).flat().find((p) => p.name === c.name);
    return {
      ...c,
      myMinutes: mine?.minutes ?? null,
      myDifficulty: mine?.difficulty ?? null,
      suggestedMinutes: preset?.minutes ?? 15,
      suggestedDifficulty: preset?.difficulty ?? 3,
    };
  });

  const done = get('SELECT completed_at FROM survey_status WHERE member_id = ?', memberId)?.completed_at ?? null;
  res.json({ rooms, chores, completed: !!done, block: BLOCK });
});

r.post('/houses/:id/survey', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const memberId = Number(b.member_id);
  if (!memberId) return bad(res, 'Informe o integrante');

  tx(() => {
    for (const v of b.chores ?? []) {
      run(
        `INSERT INTO chore_vote (chore_id, member_id, minutes, difficulty) VALUES (?,?,?,?)
         ON CONFLICT(chore_id, member_id) DO UPDATE SET minutes = excluded.minutes, difficulty = excluded.difficulty`,
        Number(v.chore_id), memberId, roundBlock(Number(v.minutes) || 15),
        Math.max(1, Math.min(5, Number(v.difficulty) || 3))
      );
    }
    for (const v of b.rooms ?? []) {
      run(
        `INSERT INTO room_vote (room_id, member_id, difficulty) VALUES (?,?,?)
         ON CONFLICT(room_id, member_id) DO UPDATE SET difficulty = excluded.difficulty`,
        Number(v.room_id), memberId, Math.max(1, Math.min(5, Number(v.difficulty) || 3))
      );
    }
    if (b.complete) {
      run(
        `INSERT INTO survey_status (member_id, completed_at) VALUES (?, datetime('now'))
         ON CONFLICT(member_id) DO UPDATE SET completed_at = datetime('now')`,
        memberId
      );
      const who = get('SELECT name FROM member WHERE id = ?', memberId);
      logEvent(houseId, '📋', `${who?.name ?? 'Alguém'} respondeu o questionário de tarefas`, 'tarefas', memberId);
    }
  });

  // responder o questionário é o penúltimo passo: ainda falta escolher a tarefa
  // que ninguém quer, e é o veto que libera as Tarefinhas
  const progress = surveyProgress(houseId);
  if (progress.everyoneDone) {
    logEvent(houseId, '📋', 'Todo mundo respondeu o questionário. Falta escolher a tarefa vetada.', 'tarefas');
  }
  res.json(progress);
});

// ---------------------------------------------------------------- tarefas
r.get('/houses/:id/chores', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.query.member ? Number(req.query.member) : null;
  res.json(choreStats(houseId, { includeSpecial: !!memberId, ownerId: memberId }));
});

r.post('/houses/:id/chores', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim();
  if (!name) return bad(res, 'A tarefa precisa de um nome');

  const isSpecial = !!b.is_special;
  const ownerId = isSpecial && b.owner_id ? Number(b.owner_id) : null;
  if (isSpecial && !ownerId) return bad(res, 'Tarefa especial precisa de dono');

  // 0 = some quando for feita; N = volta sozinha N dias depois
  const repeatDays = isSpecial ? Math.max(0, Math.min(365, Number(b.repeat_days) || 0)) : 0;

  const info = run(
    'INSERT INTO chore (house_id, name, emoji, room_id, is_special, owner_id, repeat_days) VALUES (?,?,?,?,?,?,?)',
    houseId, name, String(b.emoji ?? (isSpecial ? '🔧' : '🧹')),
    b.room_id ? Number(b.room_id) : null, isSpecial ? 1 : 0, ownerId, repeatDays
  );
  const id = Number(info.lastInsertRowid);

  // tarefa especial não passa pelo questionário: o dono define os números
  if (isSpecial && ownerId) {
    run(
      'INSERT INTO chore_vote (chore_id, member_id, minutes, difficulty) VALUES (?,?,?,?)',
      id, ownerId, roundBlock(Number(b.minutes) || 15), Math.max(1, Math.min(5, Number(b.difficulty) || 3))
    );
    const who = get('SELECT name FROM member WHERE id = ?', ownerId);
    logEvent(
      houseId, '🔧',
      `${who?.name ?? 'Alguém'} anotou "${name}" nas tarefas especiais${repeatDays ? ` (repete a cada ${repeatDays} dias)` : ''}`,
      'tarefas', ownerId
    );
  }

  res.status(201).json(get('SELECT * FROM chore WHERE id = ?', id));
});

/** Trazer de volta agora uma especial que estava esperando a data. */
r.post('/chores/:id/revive', (req, res) => {
  const id = Number(req.params.id);
  const c = get('SELECT * FROM chore WHERE id = ? AND is_special = 1', id);
  if (!c) return res.status(404).json({ error: 'Tarefa não encontrada' });
  run('UPDATE chore SET active = 1, done = 0, next_at = NULL WHERE id = ?', id);
  res.json(get('SELECT * FROM chore WHERE id = ?', id));
});

r.delete('/chores/:id', (req, res) => {
  const c = get('SELECT * FROM chore WHERE id = ?', Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Tarefa não encontrada' });
  run('DELETE FROM chore WHERE id = ?', c.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- o motor
/** "Tenho X minutos": o app escolhe as tarefas, você só dá o tempo. */
r.get('/houses/:id/chores/plan', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.query.member ? Number(req.query.member) : null;
  const minutes = Math.max(BLOCK, Math.min(240, Number(req.query.minutes) || 20));
  res.json(suggestPlan(houseId, memberId, minutes));
});

/** Marca tarefas como feitas e credita as estrelinhas do mês. */
r.post('/houses/:id/chores/done', (req, res) => {
  const houseId = Number(req.params.id);
  const b = req.body ?? {};
  const memberId = Number(b.member_id);
  const ids = (Array.isArray(b.chore_ids) ? b.chore_ids : []).map(Number).filter(Boolean);
  if (!memberId || !ids.length) return bad(res, 'Escolha ao menos uma tarefa');

  const stats = choreStats(houseId, { includeSpecial: true, ownerId: memberId });

  const out = tx(() => {
    let stars = 0;
    let minutes = 0;
    const names = [];
    for (const id of ids) {
      const c = stats.find((x) => x.id === id);
      if (!c) continue;
      run(
        'INSERT INTO chore_done (house_id, chore_id, chore_name, member_id, minutes, stars) VALUES (?,?,?,?,?,?)',
        houseId, c.id, c.name, memberId, c.minutes, c.stars
      );
      // especial some da lista ao ser feita; se repete, volta na data marcada
      if (c.is_special) {
        const chore = get('SELECT repeat_days FROM chore WHERE id = ?', c.id);
        const dias = Number(chore?.repeat_days) || 0;
        if (dias > 0) {
          run(
            "UPDATE chore SET done = 1, active = 0, next_at = date('now', ? ) WHERE id = ?",
            `+${dias} day`, c.id
          );
        } else {
          run('UPDATE chore SET done = 1, active = 0, next_at = NULL WHERE id = ?', c.id);
        }
      }
      stars += c.stars;
      minutes += c.minutes;
      names.push(c.name);
    }
    const who = get('SELECT name FROM member WHERE id = ?', memberId);
    logEvent(
      houseId, '✨',
      `${who?.name ?? 'Alguém'} fez ${names.length === 1 ? names[0] : `${names.length} tarefas`} (+${Math.round(stars * 10) / 10} ⭐)`,
      'tarefas', memberId
    );
    // tarefa feita vira moeda para a praça, proporcional à dificuldade
    creditar(houseId, memberId, Math.round(stars * MOEDAS.tarefa * 10) / 10, 'tarefa', names.join(", "));
    return { stars: Math.round(stars * 10) / 10, minutes, count: names.length };
  });

  res.json({ ...out, board: monthBoard(houseId) });
});

// ---------------------------------------------------------------- placar
r.get('/houses/:id/chores/board', (req, res) => {
  res.json(monthBoard(Number(req.params.id), String(req.query.month || currentMonth())));
});

r.get('/houses/:id/chores/calendar', (req, res) => {
  res.json(calendar(Number(req.params.id), String(req.query.month || currentMonth())));
});

/** Highlights da aba Tarefinhas. */
r.get('/houses/:id/chores/dashboard', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.query.member ? Number(req.query.member) : null;
  const board = monthBoard(houseId);
  const me = board.rows.find((x) => x.id === memberId) ?? null;

  const doneToday = memberId
    ? get('SELECT COUNT(*) AS n, COALESCE(SUM(stars),0) AS s FROM chore_done WHERE member_id = ? AND day = ?', memberId, today())
    : { n: 0, s: 0 };

  // as que repetem voltam sozinhas quando a data chega. Sem agendador: a conta é
  // feita na hora de listar, que é a única hora em que alguém olha para elas.
  run(
    `UPDATE chore SET active = 1, done = 0, next_at = NULL
     WHERE house_id = ? AND is_special = 1 AND active = 0
       AND next_at IS NOT NULL AND next_at <= date('now')`,
    houseId
  );

  const specials = memberId
    ? all(
      `SELECT * FROM chore WHERE house_id = ? AND is_special = 1 AND owner_id = ?
         AND (active = 1 OR next_at IS NOT NULL) ORDER BY active DESC, next_at, id`,
      houseId, memberId
    ).map((c) => ({
      ...c,
      /** quantos dias faltam para ela voltar; null quando já está na lista */
      voltaEm: c.active
        ? null
        : Math.max(0, Math.round(
          (new Date(`${c.next_at}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000
        )),
    }))
    : [];

  const stale = choreStats(houseId)
    .filter((c) => c.neverDone || (c.daysSince ?? 0) >= 7)
    .sort((a, b) => (b.daysSince ?? 99) - (a.daysSince ?? 99))
    .slice(0, 5);

  const reward = get('SELECT r.*, m.name AS chosen_by_name FROM reward r LEFT JOIN member m ON m.id = r.chosen_by WHERE r.house_id = ? AND r.month = ?', houseId, currentMonth());

  res.json({
    board,
    me,
    today: { count: doneToday.n, stars: Math.round(doneToday.s * 10) / 10 },
    specials,
    stale,
    reward: reward ?? null,
  });
});

// ---------------------------------------------------------------- recompensa
r.get('/houses/:id/reward', (req, res) => {
  const month = String(req.query.month || currentMonth());
  const row = get(
    'SELECT r.*, m.name AS chosen_by_name, m.emoji AS chosen_by_emoji FROM reward r LEFT JOIN member m ON m.id = r.chosen_by WHERE r.house_id = ? AND r.month = ?',
    Number(req.params.id), month
  );
  res.json(row ?? null);
});

r.post('/houses/:id/reward', (req, res) => {
  const houseId = Number(req.params.id);
  const text = String(req.body?.text ?? '').trim() || pick(REWARDS);
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;
  const month = currentMonth();

  run(
    `INSERT INTO reward (house_id, month, text, chosen_by) VALUES (?,?,?,?)
     ON CONFLICT(house_id, month) DO UPDATE SET text = excluded.text, chosen_by = excluded.chosen_by`,
    houseId, month, text, memberId
  );
  const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  logEvent(houseId, '🎁', `${who?.name ?? 'A casa'} definiu a recompensa do mês: ${text}`, 'tarefas', memberId);
  res.json(get('SELECT * FROM reward WHERE house_id = ? AND month = ?', houseId, month));
});

export { starsFor };
export default r;

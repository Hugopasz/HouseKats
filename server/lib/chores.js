import { all, get } from '../db.js';
import { frozenDaysBetween } from './travel.js';

export const BLOCK = 5;               // tudo em blocos fechados de 5 minutos
export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const today = () => new Date().toISOString().slice(0, 10);

export const roundBlock = (m) => Math.max(BLOCK, Math.round(m / BLOCK) * BLOCK);

/**
 * Estrelinhas de uma tarefa: tempo em blocos, pesado pela dificuldade.
 * 5 min fácil ≈ 0,9 · 15 min média ≈ 3,5 · 30 min pesada ≈ 8,7
 */
export const starsFor = (minutes, difficulty) =>
  Math.round((minutes / BLOCK) * (0.7 + (difficulty ?? 3) * 0.15) * 10) / 10;

/**
 * Tarefa com os números que a casa combinou: média dos palpites de cada
 * integrante no questionário, arredondada em blocos de 5 minutos.
 */
export function choreStats(houseId, { includeSpecial = false, ownerId = null } = {}) {
  const rows = all(
    `SELECT c.*, r.name AS room_name, r.emoji AS room_emoji, r.size AS room_size,
            (SELECT AVG(minutes) FROM chore_vote WHERE chore_id = c.id) AS avg_minutes,
            (SELECT AVG(difficulty) FROM chore_vote WHERE chore_id = c.id) AS avg_difficulty,
            (SELECT COUNT(*) FROM chore_vote WHERE chore_id = c.id) AS votes,
            (SELECT AVG(difficulty) FROM room_vote WHERE room_id = c.room_id) AS room_difficulty,
            (SELECT MAX(day) FROM chore_done WHERE chore_id = c.id) AS last_done,
            (SELECT COUNT(*) FROM chore_done WHERE chore_id = c.id) AS done_count
     FROM chore c LEFT JOIN room r ON r.id = c.room_id
     WHERE c.house_id = ? AND c.active = 1
       AND (c.is_special = 0 ${includeSpecial ? 'OR c.owner_id = ?' : ''})
     ORDER BY c.is_special, r.name, c.name`,
    ...(includeSpecial ? [houseId, ownerId] : [houseId])
  );

  return rows.map((c) => {
    const minutes = roundBlock(c.avg_minutes ?? 15);
    // a dificuldade do cômodo entra com meio peso na dificuldade da tarefa
    const base = c.avg_difficulty ?? 3;
    const difficulty = Math.round(((base + (c.room_difficulty ?? base)) / 2) * 10) / 10;
    // dias de Modo Viagem não contam como atraso: ninguém sujou a casa vazia
    let daysSince = null;
    if (c.last_done) {
      const raw = Math.round((new Date(`${today()}T00:00:00`) - new Date(`${c.last_done}T00:00:00`)) / 86400000);
      daysSince = Math.max(0, raw - frozenDaysBetween(houseId, c.last_done, today()));
    }
    return {
      ...c,
      is_special: !!c.is_special,
      minutes,
      difficulty,
      stars: starsFor(minutes, difficulty),
      daysSince,
      neverDone: c.last_done === null,
    };
  });
}

/** Quem já respondeu o questionário. O setup só fecha quando todos responderem. */
export function surveyProgress(houseId) {
  // pets nao respondem questionario nem fazem tarefa
  const members = all("SELECT id, name, emoji FROM member WHERE house_id = ? AND kind = 'pessoa' ORDER BY id", houseId);
  const chores = all('SELECT id FROM chore WHERE house_id = ? AND is_special = 0 AND active = 1', houseId);
  const rooms = all('SELECT id FROM room WHERE house_id = ?', houseId);

  const status = members.map((m) => {
    const votes = get(
      `SELECT COUNT(*) AS n FROM chore_vote v
       JOIN chore c ON c.id = v.chore_id
       WHERE v.member_id = ? AND c.house_id = ? AND c.is_special = 0 AND c.active = 1`,
      m.id, houseId
    ).n;
    const roomVotes = get(
      `SELECT COUNT(*) AS n FROM room_vote v JOIN room r ON r.id = v.room_id
       WHERE v.member_id = ? AND r.house_id = ?`,
      m.id, houseId
    ).n;
    const done = get('SELECT completed_at FROM survey_status WHERE member_id = ?', m.id)?.completed_at ?? null;
    return {
      ...m,
      choreVotes: votes,
      roomVotes,
      completed: !!done,
      progress: chores.length ? Math.round((votes / chores.length) * 100) : 0,
    };
  });

  return {
    members: status,
    totalChores: chores.length,
    totalRooms: rooms.length,
    everyoneDone: status.length > 0 && status.every((s) => s.completed),
    pending: status.filter((s) => !s.completed).map((s) => s.name),
  };
}

/**
 * Motor do "tenho X minutos": você não escolhe a tarefa, escolhe o tempo.
 * Prioriza o que está atrasado há mais tempo e evita empilhar tudo no mesmo
 * cômodo, encaixando as tarefas nos blocos disponíveis.
 */
export function suggestPlan(houseId, memberId, minutes) {
  const budget = roundBlock(minutes);

  // a tarefa que a pessoa vetou nunca cai para ela; as que os outros vetaram
  // viram obrigação dela e entram na frente
  const meuVeto = memberId
    ? get('SELECT chore_id FROM chore_veto WHERE member_id = ?', memberId)?.chore_id ?? null
    : null;
  const vetadasPorOutros = new Set(
    all('SELECT chore_id FROM chore_veto WHERE house_id = ? AND member_id != ?', houseId, memberId ?? 0)
      .map((v) => v.chore_id)
  );

  const pool = choreStats(houseId)
    .filter((c) => c.minutes <= budget && c.id !== meuVeto)
    .map((c) => ({
      ...c,
      herdada: vetadasPorOutros.has(c.id),
      // nunca feita pesa como 21 dias de atraso; o resto é o atraso real
      urgency: c.neverDone ? 21 : Math.min(30, c.daysSince ?? 0),
    }));

  if (!pool.length) return { budget, plan: [], totalMinutes: 0, totalStars: 0, leftover: budget };

  const plan = [];
  const usedRooms = new Map();
  let left = budget;

  while (left >= BLOCK) {
    const options = pool.filter((c) => !plan.some((p) => p.id === c.id) && c.minutes <= left);
    if (!options.length) break;

    const best = options
      .map((c) => ({
        c,
        // atraso manda; tarefa herdada de quem vetou vem na frente;
        // repetir cômodo penaliza; sorte pequena para variar o dia
        score: c.urgency * 1.6
          + (c.herdada ? 8 : 0)
          - (usedRooms.get(c.room_id ?? 0) ?? 0) * 6
          + Math.random() * 3,
      }))
      .sort((a, b) => b.score - a.score)[0].c;

    plan.push(best);
    usedRooms.set(best.room_id ?? 0, (usedRooms.get(best.room_id ?? 0) ?? 0) + 1);
    left -= best.minutes;
  }

  return {
    budget,
    plan,
    totalMinutes: plan.reduce((s, c) => s + c.minutes, 0),
    totalStars: Math.round(plan.reduce((s, c) => s + c.stars, 0) * 10) / 10,
    leftover: left,
  };
}

/** Ranking do mês. As estrelinhas zeram quando o mês vira. */
export function monthBoard(houseId, month = currentMonth()) {
  const members = all("SELECT id, name, emoji, color FROM member WHERE house_id = ? AND kind = 'pessoa' ORDER BY id", houseId);
  const rows = members.map((m) => {
    const agg = get(
      `SELECT COALESCE(SUM(stars),0) AS stars, COALESCE(SUM(minutes),0) AS minutes, COUNT(*) AS tasks
       FROM chore_done WHERE house_id = ? AND member_id = ? AND month = ?`,
      houseId, m.id, month
    );
    return {
      ...m,
      stars: Math.round(agg.stars * 10) / 10,
      minutes: agg.minutes,
      tasks: agg.tasks,
    };
  }).sort((a, b) => b.stars - a.stars);

  const total = rows.reduce((s, r) => s + r.stars, 0);
  return { month, rows: rows.map((r, i) => ({ ...r, rank: i + 1 })), total: Math.round(total * 10) / 10 };
}

/**
 * Calendário: o que foi feito por dia, e o que ainda vai voltar.
 * As especiais que repetem entram pela data de retorno, então dá para olhar o
 * mês que vem e já saber que o filtro do purificador vence dia 2.
 */
export function calendar(houseId, month = currentMonth()) {
  const feitas = all(
    `SELECT d.*, m.name AS member_name, m.emoji AS member_emoji, m.color AS member_color
     FROM chore_done d JOIN member m ON m.id = d.member_id
     WHERE d.house_id = ? AND d.month = ?
     ORDER BY d.day DESC, d.id DESC`,
    houseId, month
  );

  const aRepetir = all(
    `SELECT c.id, c.name, c.emoji, c.repeat_days, c.next_at AS day,
            m.id AS member_id, m.name AS member_name, m.emoji AS member_emoji
     FROM chore c JOIN member m ON m.id = c.owner_id
     WHERE c.house_id = ? AND c.is_special = 1 AND c.active = 0
       AND c.next_at IS NOT NULL AND substr(c.next_at, 1, 7) = ?
     ORDER BY c.next_at, c.name`,
    houseId, month
  );

  return { feitas, aRepetir };
}

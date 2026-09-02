import { Router } from 'express';
import { all, get, run, logEvent, tx } from '../db.js';
import { choreStats, currentMonth } from '../lib/chores.js';

const r = Router();
const bad = (res, msg) => res.status(400).json({ error: msg });

// ---------------------------------------------------------------- tarefa vetada
/**
 * Cada integrante escolhe uma tarefa que não faz de jeito nenhum. Ela vira
 * responsabilidade dos outros, e em troca some da fila dessa pessoa. Duas
 * pessoas não podem vetar a mesma: vale a ordem de chegada.
 */
r.get('/houses/:id/vetos', (req, res) => {
  const houseId = Number(req.params.id);
  const rows = all(
    `SELECT v.*, m.name AS member_name, m.emoji AS member_emoji, c.name AS chore_name, c.emoji AS chore_emoji
     FROM chore_veto v
     JOIN member m ON m.id = v.member_id
     JOIN chore c ON c.id = v.chore_id
     WHERE v.house_id = ? ORDER BY v.created_at`,
    houseId
  );
  const membros = all("SELECT id, name, emoji FROM member WHERE house_id = ? AND kind = 'pessoa' ORDER BY id", houseId);
  res.json({
    vetos: rows,
    // tarefas já tomadas por outra pessoa não aparecem para escolher de novo
    tomadas: rows.map((v) => v.chore_id),
    faltam: membros.filter((m) => !rows.some((v) => v.member_id === m.id)),
    todosEscolheram: membros.length > 0 && rows.length === membros.length,
  });
});

r.post('/houses/:id/vetos', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = Number(req.body?.member_id);
  const choreId = Number(req.body?.chore_id);
  if (!memberId || !choreId) return bad(res, 'Escolha a tarefa que você não quer');

  const jaTomada = get('SELECT * FROM chore_veto WHERE house_id = ? AND chore_id = ?', houseId, choreId);
  if (jaTomada && jaTomada.member_id !== memberId) {
    const dono = get('SELECT name FROM member WHERE id = ?', jaTomada.member_id);
    return bad(res, `${dono?.name ?? 'Outra pessoa'} já escolheu essa. Pegue outra.`);
  }

  const chore = get('SELECT * FROM chore WHERE id = ? AND house_id = ?', choreId, houseId);
  if (!chore) return res.status(404).json({ error: 'Tarefa não encontrada' });

  tx(() => {
    run('DELETE FROM chore_veto WHERE member_id = ?', memberId);
    run('INSERT INTO chore_veto (house_id, member_id, chore_id) VALUES (?,?,?)', houseId, memberId, choreId);
    const who = get('SELECT name FROM member WHERE id = ?', memberId);
    logEvent(
      houseId, '🙅',
      `${who?.name ?? 'Alguém'} não faz ${chore.name} de jeito nenhum. Fica com o resto da casa.`,
      'tarefas', memberId
    );
  });

  // com o questionário respondido e todo mundo tendo vetado, libera as Tarefinhas
  const membros = all("SELECT id FROM member WHERE house_id = ? AND kind = 'pessoa'", houseId);
  const vetos = all('SELECT member_id FROM chore_veto WHERE house_id = ?', houseId);
  const respostas = all('SELECT member_id FROM survey_status WHERE completed_at IS NOT NULL');
  const todosResponderam = membros.every((m) => respostas.some((s) => s.member_id === m.id));

  if (todosResponderam && vetos.length >= membros.length) {
    const casa = get('SELECT chores_unlocked FROM house WHERE id = ?', houseId);
    if (!casa?.chores_unlocked) {
      run('UPDATE house SET chores_unlocked = 1 WHERE id = ?', houseId);
      logEvent(houseId, '🎉', 'Todo mundo escolheu. As Tarefinhas estão liberadas!', 'tarefas');
    }
  }

  res.status(201).json({ ok: true });
});

r.delete('/vetos/:memberId', (req, res) => {
  const memberId = Number(req.params.memberId);
  const v = get('SELECT * FROM chore_veto WHERE member_id = ?', memberId);
  if (v) run('DELETE FROM chore_veto WHERE member_id = ?', memberId);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- recomeçar
/** Zera as respostas do questionário e o veto, para a casa repensar tudo. */
r.post('/houses/:id/chores/reset', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;
  const tudo = !!req.body?.everyone;

  tx(() => {
    const alvos = tudo
      ? all('SELECT id, name FROM member WHERE house_id = ?', houseId)
      : all('SELECT id, name FROM member WHERE id = ?', memberId);

    for (const m of alvos) {
      run(
        `DELETE FROM chore_vote WHERE member_id = ? AND chore_id IN
          (SELECT id FROM chore WHERE house_id = ?)`,
        m.id, houseId
      );
      run(
        `DELETE FROM room_vote WHERE member_id = ? AND room_id IN
          (SELECT id FROM room WHERE house_id = ?)`,
        m.id, houseId
      );
      run('DELETE FROM survey_status WHERE member_id = ?', m.id);
      run('DELETE FROM chore_veto WHERE member_id = ?', m.id);
    }

    // com alguém pendente, as Tarefinhas voltam a esperar todo mundo responder
    run('UPDATE house SET chores_unlocked = 0 WHERE id = ?', houseId);

    const quem = tudo ? 'A casa' : (alvos[0]?.name ?? 'Alguém');
    logEvent(
      houseId, '🔄',
      `${quem} está repensando as escolhas das tarefinhas. O questionário recomeçou.`,
      'tarefas', tudo ? null : memberId
    );
  });

  res.json({ ok: true });
});

// ---------------------------------------------------------------- votação
/**
 * Recompensa do mês por votação: quem cria propõe três opções e a casa escolhe.
 * No empate, ganha quem tem crédito de desempate guardado; quem perdeu leva o
 * crédito para a próxima vez.
 */
r.get('/houses/:id/reward-poll', (req, res) => {
  const houseId = Number(req.params.id);
  const month = String(req.query.month || currentMonth());
  const memberId = req.query.member ? Number(req.query.member) : null;

  const poll = get('SELECT * FROM reward_poll WHERE house_id = ? AND month = ?', houseId, month);
  if (!poll) return res.json(null);

  const options = all('SELECT * FROM reward_option WHERE poll_id = ? ORDER BY id', poll.id).map((o) => ({
    ...o,
    votes: get('SELECT COUNT(*) AS n FROM reward_vote WHERE poll_id = ? AND option_id = ?', poll.id, o.id).n,
  }));
  const membros = all('SELECT id, name, emoji FROM member WHERE house_id = ? ORDER BY id', houseId);
  const votos = all('SELECT * FROM reward_vote WHERE poll_id = ?', poll.id);

  res.json({
    ...poll,
    options,
    totalVotes: votos.length,
    myVote: memberId ? (votos.find((v) => v.member_id === memberId)?.option_id ?? null) : null,
    pending: membros.filter((m) => !votos.some((v) => v.member_id === m.id)),
    everyoneVoted: membros.length > 0 && votos.length === membros.length,
  });
});

r.post('/houses/:id/reward-poll', (req, res) => {
  const houseId = Number(req.params.id);
  const opcoes = (Array.isArray(req.body?.options) ? req.body.options : [])
    .map((t) => String(t ?? '').trim())
    .filter(Boolean);
  if (opcoes.length !== 3) return bad(res, 'A votação precisa de exatamente três opções');

  const memberId = req.body?.member_id ? Number(req.body.member_id) : null;
  const month = currentMonth();

  const id = tx(() => {
    // recriar a votação do mês descarta a anterior
    const antiga = get('SELECT id FROM reward_poll WHERE house_id = ? AND month = ?', houseId, month);
    if (antiga) run('DELETE FROM reward_poll WHERE id = ?', antiga.id);

    const info = run(
      'INSERT INTO reward_poll (house_id, month, created_by) VALUES (?,?,?)',
      houseId, month, memberId
    );
    const pollId = Number(info.lastInsertRowid);
    for (const t of opcoes) run('INSERT INTO reward_option (poll_id, text) VALUES (?,?)', pollId, t);

    const who = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
    logEvent(
      houseId, '🗳️',
      `${who?.name ?? 'Alguém'} abriu a votação da recompensa do mês. Todo mundo precisa votar!`,
      'tarefas', memberId
    );
    return pollId;
  });

  res.status(201).json({ ok: true, poll_id: id });
});

r.post('/reward-poll/:id/vote', (req, res) => {
  const pollId = Number(req.params.id);
  const memberId = Number(req.body?.member_id);
  const optionId = Number(req.body?.option_id);
  if (!memberId || !optionId) return bad(res, 'Escolha uma opção');

  const poll = get('SELECT * FROM reward_poll WHERE id = ?', pollId);
  if (!poll) return res.status(404).json({ error: 'Votação não encontrada' });
  if (poll.status !== 'aberta') return bad(res, 'Essa votação já foi encerrada');

  run(
    `INSERT INTO reward_vote (poll_id, member_id, option_id) VALUES (?,?,?)
     ON CONFLICT(poll_id, member_id) DO UPDATE SET option_id = excluded.option_id`,
    pollId, memberId, optionId
  );

  // fecha sozinha quando o último integrante vota
  const membros = all("SELECT id FROM member WHERE house_id = ? AND kind = 'pessoa'", poll.house_id);
  const votos = all('SELECT * FROM reward_vote WHERE poll_id = ?', pollId);
  if (votos.length >= membros.length && membros.length > 0) fecharVotacao(pollId);

  res.json({ ok: true, encerrada: votos.length >= membros.length });
});

r.post('/reward-poll/:id/close', (req, res) => {
  const out = fecharVotacao(Number(req.params.id));
  if (!out) return res.status(404).json({ error: 'Votação não encontrada' });
  res.json(out);
});

/** Apura, resolve empate por crédito e grava a recompensa do mês. */
function fecharVotacao(pollId) {
  const poll = get('SELECT * FROM reward_poll WHERE id = ?', pollId);
  if (!poll) return null;

  const options = all('SELECT * FROM reward_option WHERE poll_id = ? ORDER BY id', pollId).map((o) => ({
    ...o,
    votes: all('SELECT * FROM reward_vote WHERE poll_id = ? AND option_id = ?', pollId, o.id),
  }));

  const maxVotos = Math.max(0, ...options.map((o) => o.votes.length));
  const empatadas = options.filter((o) => o.votes.length === maxVotos && maxVotos > 0);

  let vencedora = empatadas[0] ?? options[0];
  let houveEmpate = empatadas.length > 1;

  if (houveEmpate) {
    // quem tem crédito de desempate guardado decide desta vez
    const comCredito = empatadas
      .map((o) => ({
        o,
        credito: Math.max(
          0,
          ...o.votes.map((v) => get('SELECT credits FROM tiebreak_credit WHERE member_id = ?', v.member_id)?.credits ?? 0)
        ),
      }))
      .sort((a, b) => b.credito - a.credito);

    vencedora = comCredito[0].o;

    tx(() => {
      // ganhou por crédito: gasta o crédito. Os outros lados guardam um para a próxima.
      for (const v of vencedora.votes) {
        run(
          `INSERT INTO tiebreak_credit (member_id, credits) VALUES (?, 0)
           ON CONFLICT(member_id) DO UPDATE SET credits = MAX(0, credits - 1)`,
          v.member_id
        );
      }
      for (const o of empatadas.filter((x) => x.id !== vencedora.id)) {
        for (const v of o.votes) {
          run(
            `INSERT INTO tiebreak_credit (member_id, credits) VALUES (?, 1)
             ON CONFLICT(member_id) DO UPDATE SET credits = credits + 1`,
            v.member_id
          );
        }
      }
    });
  }

  tx(() => {
    run(
      "UPDATE reward_poll SET status = 'fechada', winner = ?, closed_at = datetime('now') WHERE id = ?",
      vencedora?.text ?? '', pollId
    );
    run(
      `INSERT INTO reward (house_id, month, text, chosen_by) VALUES (?,?,?,?)
       ON CONFLICT(house_id, month) DO UPDATE SET text = excluded.text`,
      poll.house_id, poll.month, vencedora?.text ?? '', poll.created_by
    );
    logEvent(
      poll.house_id, '🎁',
      houveEmpate
        ? `Deu empate! A recompensa do mês é "${vencedora?.text}". Quem perdeu escolhe no próximo desempate.`
        : `A casa votou: a recompensa do mês é "${vencedora?.text}"`,
      'tarefas'
    );
  });

  return { ok: true, winner: vencedora?.text ?? '', empate: houveEmpate };
}

// ---------------------------------------------------------------- humor
r.get('/houses/:id/moods', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = req.query.member ? Number(req.query.member) : null;
  const hoje = new Date().toISOString().slice(0, 10);

  const historico = all(
    `SELECT mo.*, m.name AS member_name FROM mood mo JOIN member m ON m.id = mo.member_id
     WHERE mo.house_id = ? ${memberId ? 'AND mo.member_id = ?' : ''}
     ORDER BY mo.day DESC LIMIT 60`,
    ...(memberId ? [houseId, memberId] : [houseId])
  );

  res.json({
    hoje: memberId ? (historico.find((h) => h.day === hoje) ?? null) : null,
    historico,
  });
});

r.post('/houses/:id/moods', (req, res) => {
  const houseId = Number(req.params.id);
  const memberId = Number(req.body?.member_id);
  const emoji = String(req.body?.emoji ?? '').trim();
  if (!memberId || !emoji) return bad(res, 'Escolha como você está hoje');

  const label = String(req.body?.label ?? '').trim();
  const note = String(req.body?.note ?? '').trim();

  run(
    `INSERT INTO mood (house_id, member_id, emoji, label, note) VALUES (?,?,?,?,?)
     ON CONFLICT(member_id, day) DO UPDATE SET emoji = excluded.emoji, label = excluded.label, note = excluded.note`,
    houseId, memberId, emoji, label, note
  );

  const who = get('SELECT name FROM member WHERE id = ?', memberId);
  logEvent(
    houseId, emoji,
    `${who?.name ?? 'Alguém'} está ${label || 'assim'} hoje${note ? `: ${note}` : ''}`,
    'humor', memberId
  );
  res.status(201).json({ ok: true });
});

// ---------------------------------------------------------------- fila filtrada
/** Tarefas que sobram para um integrante, já sem a que ele vetou. */
export function choresParaMembro(houseId, memberId) {
  const meuVeto = get('SELECT chore_id FROM chore_veto WHERE member_id = ?', memberId)?.chore_id ?? null;
  return choreStats(houseId).filter((c) => c.id !== meuVeto);
}

export default r;

import { useCallback, useEffect, useState } from 'react';
import {
  addChore, deleteChore, getChoreDashboard, getPantry, getSetup, getVetos, markDone, reviveChore,
  resetChorePrefs,
  type ChoreDashboard, type SetupState, type Veto,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Confirm, Field, Loading, Sheet } from '../components/ui';
import RewardPollSheet, { NewRewardPollSheet, useRewardPoll } from '../components/RewardPollSheet';
import ChoreSetup from './ChoreSetup';
import ChorePlan from './ChorePlan';
import ChoreCalendar from './ChoreCalendar';

type View = 'home' | 'setup' | 'plan' | 'calendar';

export default function Chores({ onGoFridge }: { onGoFridge: () => void }) {
  const { house, me, toast } = useApp();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [dash, setDash] = useState<ChoreDashboard | null>(null);
  const [pantryCount, setPantryCount] = useState<number | null>(null);
  const [view, setView] = useState<View>('home');
  const [pollOpen, setPollOpen] = useState(false);
  const [newPollOpen, setNewPollOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [meuVeto, setMeuVeto] = useState<Veto | null>(null);
  const { poll, aberto: pollAuto, setAberto: setPollAuto, reload: reloadPoll } = useRewardPoll();
  const [specialOpen, setSpecialOpen] = useState(false);

  const load = useCallback(async () => {
    if (!house || !me) return;
    const [s, p, v] = await Promise.all([getSetup(house.id), getPantry(house.id), getVetos(house.id)]);
    setMeuVeto(v.vetos.find((x) => x.member_id === me.id) ?? null);
    setSetup(s);
    setPantryCount(p.length);
    if (s.ready) setDash(await getChoreDashboard(house.id, me.id));
  }, [house, me]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar as tarefinhas')); }, [load, toast]);

  if (!house || !me) return null;
  if (!setup || pantryCount === null) return <Loading label="Organizando as tarefinhas…" />;

  // ---- gate: a geladeira vem primeiro
  // "view !== 'setup'" respeita quem apertou "prefiro começar pelas tarefas":
  // sem isso o gate voltava a se desenhar por cima e o botão não fazia nada.
  if (view !== 'setup' && !setup.ready && !setup.rooms.length && pantryCount === 0) {
    return (
      <div className="page stack-lg">
        <div>
          <h1>Tarefinhas</h1>
          <div className="small muted">Segundo momento da casa.</div>
        </div>

        <div className="card card--accent stack">
          <div style={{ fontSize: '2.6rem' }}>🔋</div>
          <h2>Sem energia não dá</h2>
          <div className="small muted">
            Antes de dividir tarefas, ajuste o Armário. Comida em ordem primeiro, e o resto
            fica muito mais fácil depois.
          </div>
          <button className="btn btn--primary btn--block" onClick={onGoFridge}>🧊 Configurar o Armário</button>
          <button className="btn btn--ghost btn--block" onClick={() => setView('setup')}>
            Prefiro começar pelas tarefas
          </button>
        </div>

        <div className="card stack">
          <div className="eyebrow">Depois vem</div>
          <div className="small muted">
            1. Mapear os cômodos da casa.<br />
            2. Todo mundo responde o questionário de tempo e dificuldade.
          </div>
        </div>
      </div>
    );
  }

  if (view === 'setup' || !setup.ready) {
    // com a casa já configurada, "Cômodos" abre o gerenciamento, não o wizard
    return <ChoreSetup manage={setup.ready} onDone={() => { setView('home'); load(); }} />;
  }
  if (view === 'plan') {
    return <ChorePlan onBack={() => { setView('home'); load(); }} />;
  }
  if (view === 'calendar') {
    return <ChoreCalendar onBack={() => setView('home')} />;
  }
  if (!dash) return <Loading label="Contando as estrelinhas…" />;

  const { board, today, specials, stale, reward } = dash;
  const mine = dash.me;
  const leader = board.rows[0];

  return (
    <div className="page stack-lg">
      <div className="row">
        <Avatar member={me} size="lg" />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="eyebrow">🧹 Tarefinhas</div>
          <h1 className="truncate" style={{ fontSize: '2rem' }}>{me.name}</h1>
          <div className="tiny muted">
            {mine ? `${mine.stars} ⭐ neste mês · ${mine.rank}º lugar` : 'Sem estrelinhas ainda'}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ ação principal */}
      <button className="card card--accent stack card--tap" onClick={() => setView('plan')}>
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>🧹</span>
          <span className="bold" style={{ fontSize: '1.3rem' }}>Fazer tarefas</span>
        </div>
        <div className="small muted" style={{ textAlign: 'left' }}>
          Você não escolhe a tarefa, só o tempo. O app monta a combinação ideal.
        </div>
      </button>

      {/* ------------------------------------------------ highlights */}
      <section className="stack">
        <div className="eyebrow">Seus highlights do mês</div>
        <div className="hl-grid">
          <div className="hl">
            <span className="hl__ico">⭐</span>
            <span className="hl__val">{mine?.stars ?? 0}</span>
            <span className="hl__lbl">estrelinhas</span>
          </div>
          <div className="hl">
            <span className="hl__ico">🏁</span>
            <span className="hl__val">{mine?.tasks ?? 0}</span>
            <span className="hl__lbl">tarefas feitas</span>
          </div>
          <div className="hl hl--wide">
            <span className="hl__ico">☀️</span>
            <span className="hl__val">
              {today.count === 0 ? 'Nada hoje ainda' : `${today.count} hoje · ${today.stars} ⭐`}
            </span>
            <span className="hl__lbl">
              {today.count === 0 ? 'que tal 10 minutinhos?' : 'mandou bem'}
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ recompensa por votação */}
      <button
        className={`card row card--tap ${poll?.status === 'aberta' && poll.myVote === null ? 'card--accent' : ''}`}
        onClick={() => (poll ? setPollOpen(true) : setNewPollOpen(true))}
      >
        <span style={{ fontSize: '1.7rem' }}>{poll?.status === 'aberta' ? '🗳️' : '🎁'}</span>
        <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
          <div className="eyebrow">Recompensa do mês</div>
          <div className="bold small">
            {poll?.status === 'aberta'
              ? (poll.myVote === null ? 'Votação aberta, falta o seu voto!' : 'Você já votou')
              : (reward?.text ?? 'Ninguém propôs ainda')}
          </div>
          <div className="tiny muted">
            {poll?.status === 'aberta'
              ? `${poll.totalVotes} de ${poll.totalVotes + poll.pending.length} votaram`
              : poll?.status === 'fechada'
                ? 'escolhida por votação da casa'
                : 'toque para abrir uma votação'}
          </div>
        </div>
        {poll?.status === 'aberta' && poll.myVote === null
          ? <span className="badge">vote</span>
          : <span className="accent bold">›</span>}
      </button>

      {poll && poll.status === 'fechada' && (
        <button className="btn btn--ghost btn--block tiny" style={{ minHeight: 34 }} onClick={() => setNewPollOpen(true)}>
          Abrir uma votação nova
        </button>
      )}

      {/* ------------------------------------------------ placar */}
      <section className="stack">
        <div className="row-between">
          <div className="eyebrow">Placar do mês</div>
          <span className="tiny muted">zera dia 1º</span>
        </div>
        <div className="card card--flat stack" style={{ gap: 10 }}>
          {board.rows.map((row) => {
            const pct = leader?.stars ? (row.stars / leader.stars) * 100 : 0;
            return (
              <div key={row.id} className="row" style={{ gap: 10 }}>
                <span style={{ width: 20, textAlign: 'center', flex: 'none' }} className="tiny bold muted">
                  {row.rank === 1 && row.stars > 0 ? '👑' : row.rank}
                </span>
                <Avatar emoji={row.emoji} size="sm" color={row.id === me.id ? 'var(--ac)' : 'var(--line-2)'} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row-between">
                    <span className={`small truncate ${row.id === me.id ? 'bold' : ''}`}>{row.name}</span>
                    <span className="tiny bold">{row.stars} ⭐</span>
                  </div>
                  <div className="bar" style={{ height: 6, marginTop: 3 }}>
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {board.total === 0 && (
            <div className="tiny muted center">Ninguém pontuou este mês. A disputa está aberta.</div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ especiais */}
      <section className="stack">
        <div className="row-between">
          <div className="eyebrow">🔧 Suas tarefas especiais</div>
          <button className="btn btn--ghost btn--sm" onClick={() => setSpecialOpen(true)}>＋</button>
        </div>
        {specials.length === 0 ? (
          <div className="card card--flat small muted center" style={{ padding: 18 }}>
            Coisas fora da rotina, só suas. Tipo consertar o liquidificador.
          </div>
        ) : (
          specials.map((s) => (
            <div key={s.id} className={`card row ${s.active ? '' : 'card--flat'}`} style={{ padding: 12, opacity: s.active ? 1 : 0.6 }}>
              <span style={{ fontSize: '1.4rem' }}>{s.active ? s.emoji : '🕒'}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small bold truncate">{s.name}</div>
                {(s.repeat_days > 0 || !s.active) && (
                  <div className="tiny muted">
                    {s.active
                      ? `repete a cada ${intervaloLabel(s.repeat_days)}`
                      : s.voltaEm === 0
                        ? 'volta hoje'
                        : `volta em ${s.voltaEm} ${s.voltaEm === 1 ? 'dia' : 'dias'}`}
                  </div>
                )}
              </div>
              {s.active ? (
                <button
                  className="btn btn--soft btn--sm"
                  onClick={async () => {
                    const res = await markDone(house.id, me.id, [s.id]);
                    toast(
                      s.repeat_days > 0
                        ? `Feito! +${res.stars} ⭐ · volta em ${intervaloLabel(s.repeat_days)}`
                        : `Feito! +${res.stars} ⭐`
                    );
                    load();
                  }}
                >
                  ✓ Feito
                </button>
              ) : (
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={async () => { await reviveChore(s.id); load(); }}
                >
                  Antecipar
                </button>
              )}
              <button
                className="btn btn--ghost btn--sm"
                onClick={async () => { await deleteChore(s.id); load(); }}
                aria-label="Apagar"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </section>

      {/* ------------------------------------------------ esquecidas */}
      {stale.length > 0 && (
        <section className="stack">
          <div className="eyebrow">Ninguém lembra dessas</div>
          <div className="card card--flat stack" style={{ gap: 8 }}>
            {stale.map((c) => (
              <div key={c.id} className="row">
                <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                <span className="grow small truncate">{c.name}</span>
                <span className={`badge ${c.neverDone ? 'badge--warn' : ''}`}>
                  {c.neverDone ? 'nunca' : `${c.daysSince}d`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ tarefa vetada */}
      {meuVeto && (
        <div className="card card--flat row">
          <span style={{ fontSize: '1.4rem' }}>🙅</span>
          <div className="grow small">
            Você não faz <b>{meuVeto.chore_name}</b>. Fica com o resto da casa.
          </div>
        </div>
      )}

      <div className="row">
        <button className="btn grow" onClick={() => setView('calendar')}>📅 Calendário</button>
        <button className="btn grow" onClick={() => setView('setup')}>⚙️ Cômodos</button>
      </div>

      <button className="btn btn--ghost btn--block tiny" style={{ minHeight: 36 }} onClick={() => setResetOpen(true)}>
        🔄 Repensar minhas escolhas
      </button>

      <SpecialSheet open={specialOpen} onClose={() => setSpecialOpen(false)} onSaved={load} />

      {/* aberta pelo card ou sozinha, quando há votação esperando seu voto */}
      <RewardPollSheet
        poll={poll}
        open={pollOpen || pollAuto}
        onClose={() => { setPollOpen(false); setPollAuto(false); }}
        onChanged={async () => { await reloadPoll(); await load(); }}
      />
      <NewRewardPollSheet
        open={newPollOpen}
        onClose={() => setNewPollOpen(false)}
        onCreated={async () => { await reloadPoll(); await load(); }}
      />

      <Confirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Repensar suas escolhas?"
        message="Suas respostas do questionário e a tarefa que você vetou são apagadas, e você refaz tudo. Fica registrado no log da casa."
        confirmLabel="Recomeçar"
        onConfirm={async () => {
          await resetChorePrefs(house.id, { member_id: me.id });
          toast('Bora repensar 🔄');
          setView('setup');
          await load();
        }}
      />
    </div>
  );
}

/** Intervalos de repetição das tarefas especiais. 0 = não repete. */
const INTERVALOS = [
  { dias: 0, label: 'Não repete' },
  { dias: 7, label: 'Semanal' },
  { dias: 15, label: 'Quinzenal' },
  { dias: 30, label: 'Mensal' },
  { dias: 60, label: 'A cada 2 meses' },
  { dias: 90, label: 'Trimestral' },
  { dias: 180, label: 'Semestral' },
  { dias: 365, label: 'Anual' },
];

/** Dentro da frase, "a cada um mês" soa pior do que os intervalos por extenso. */
const POR_EXTENSO: Record<number, string> = {
  7: 'uma semana',
  15: 'quinze dias',
  30: 'um mês',
  60: 'dois meses',
  90: 'três meses',
  180: 'seis meses',
  365: 'um ano',
};

function intervaloLabel(dias: number) {
  return POR_EXTENSO[dias] ?? `${dias} dias`;
}

// ---------------------------------------------------------------- especiais
function SpecialSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { house, me, toast } = useApp();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [difficulty, setDifficulty] = useState(3);
  const [repeat, setRepeat] = useState(0);
  const [ideas, setIdeas] = useState<string[]>([]);

  useEffect(() => {
    if (open) import('../lib/api').then((m) => m.getChorePresets().then((p) => setIdeas(p.specials)).catch(() => {}));
  }, [open]);

  if (!house || !me) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nova tarefa especial"
      subtitle="Fora da rotina, só sua"
      footer={
        <button
          className="btn btn--primary btn--block"
          disabled={!name.trim()}
          onClick={async () => {
            await addChore(house.id, {
              name: name.trim(), is_special: true, owner_id: me.id, minutes, difficulty, emoji: '🔧',
              repeat_days: repeat,
            });
            toast('Anotado 🔧');
            setName('');
            setRepeat(0);
            onSaved();
            onClose();
          }}
        >
          Adicionar
        </button>
      }
    >
      <div className="stack-lg">
        <Field label="O que precisa ser feito?">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Consertar o liquidificador" autoFocus maxLength={60} />
        </Field>

        <Field label="Quanto tempo leva?">
          <div className="wrap">
            {[5, 10, 15, 20, 30, 45, 60].map((t) => (
              <button key={t} className={`chip ${minutes === t ? 'chip--on' : ''}`} onClick={() => setMinutes(t)}>{t} min</button>
            ))}
          </div>
        </Field>

        <Field label="Quão chata é?">
          <div className="wrap">
            {[1, 2, 3, 4, 5].map((d) => (
              <button key={d} className={`chip ${difficulty === d ? 'chip--on' : ''}`} onClick={() => setDifficulty(d)}>
                {['moleza', 'tranquilo', 'normal', 'chato', 'pesado'][d - 1]}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Se repete?"
          hint={repeat === 0
            ? 'Some da lista quando você marcar como feita.'
            : `Some quando for feita e volta sozinha ${intervaloLabel(repeat)} depois.`}
        >
          <div className="wrap">
            {INTERVALOS.map((i) => (
              <button
                key={i.dias}
                className={`chip ${repeat === i.dias ? 'chip--on' : ''}`}
                onClick={() => setRepeat(i.dias)}
              >
                {i.label}
              </button>
            ))}
          </div>
        </Field>

        {ideas.length > 0 && (
          <div className="stack" style={{ gap: 6 }}>
            <div className="eyebrow">Ideias</div>
            <div className="wrap">
              {ideas.slice(0, 6).map((s) => (
                <button key={s} className="chip" onClick={() => setName(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addRoom, deleteRoom, getChorePresets, getSetup, getSurvey, postSurvey,
  type RoomPreset, type SetupState, type SurveyChore, type SurveyRoom,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Confirm, Field, Loading, Sheet } from '../components/ui';
import ChoreVeto from './ChoreVeto';

const TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 45, 60];
const SIZES: { value: 'pequeno' | 'medio' | 'grande'; label: string }[] = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
];
const DIFF_LABEL = ['', 'moleza', 'tranquilo', 'normal', 'chato', 'pesado'];

/**
 * Preparação das Tarefinhas em dois passos: mapear os cômodos e depois todo
 * mundo responder o questionário. Só libera quando o último integrante manda.
 */
export default function ChoreSetup({
  onDone, manage = false,
}: {
  onDone: () => void;
  /** true = a casa já está configurada e o usuário veio só mexer nos cômodos. */
  manage?: boolean;
}) {
  const { house, me, toast } = useApp();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [step, setStep] = useState<'rooms' | 'survey' | 'veto'>('rooms');
  const [justFinished, setJustFinished] = useState(false);

  // Onde a pessoa parou só é decidido na primeira carga. Depois disso quem manda
  // é ela: adicionar um cômodo recarrega o setup, e antes isso teletransportava
  // todo mundo para o questionário no meio da montagem da casa.
  const jaPosicionou = useRef(false);

  const load = useCallback(async () => {
    if (!house) return;
    const s = await getSetup(house.id);
    setSetup(s);

    if (!manage && !jaPosicionou.current) {
      jaPosicionou.current = true;
      if (s.rooms.length) {
        const mine = s.survey.members.find((m) => m.id === me?.id);
        const jaVetei = !s.vetos?.faltando.some((f) => f.id === me?.id);
        // respondeu mas ainda não vetou: o passo que falta é o do veto
        if (!mine?.completed) setStep('survey');
        else if (!jaVetei) setStep('veto');
      }
    }
    return s;
  }, [house, me, manage]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar')); }, [load, toast]);

  if (!house || !me) return null;
  if (!setup) return <Loading label="Montando o mapa da casa…" />;

  // a tela de parabéns é o fecho do setup inicial, não um beco sem saída
  if (setup.ready && justFinished) {
    return (
      <div className="page stack-lg">
        <div className="card card--accent stack center" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <h2>Tudo pronto!</h2>
          <div className="small muted">Todo mundo respondeu. As Tarefinhas estão liberadas.</div>
          <button className="btn btn--primary btn--block" onClick={onDone}>Bora começar</button>
        </div>
      </div>
    );
  }

  // Você fez a sua parte, mas as Tarefinhas só abrem com a casa inteira dentro.
  // Sem esta tela o app devolvia a pessoa para os cômodos, sem explicar nada.
  const euRespondi = setup.survey.members.find((m) => m.id === me.id)?.completed;
  const euVetei = !setup.vetos?.faltando.some((f) => f.id === me.id);
  if (!manage && !setup.ready && euRespondi && euVetei && setup.rooms.length > 0) {
    return <Esperando setup={setup} onRevisar={() => setStep('rooms')} onVoltar={onDone} />;
  }

  if (step === 'veto') {
    return (
      <ChoreVeto
        onBack={() => setStep('survey')}
        onDone={async () => {
          const s = await load();
          if (s?.ready) setJustFinished(true);
          else onDone();
        }}
      />
    );
  }

  if (step === 'survey') {
    return (
      <SurveyStep
        setup={setup}
        onBack={() => setStep('rooms')}
        onSent={async () => {
          await load();
          // agora falta só escolher a tarefa que você não faz
          setStep('veto');
        }}
      />
    );
  }

  return (
    <RoomsStep
      setup={setup}
      manage={manage || setup.ready}
      onReload={load}
      onNext={() => setStep('survey')}
      onBack={onDone}
    />
  );
}

// ---------------------------------------------------------------- 1. cômodos
function RoomsStep({
  setup, onReload, onNext, onBack, manage,
}: {
  setup: SetupState;
  onReload: () => Promise<SetupState | undefined>;
  onNext: () => void;
  onBack: () => void;
  manage: boolean;
}) {
  const { house, me, toast } = useApp();
  const [presets, setPresets] = useState<RoomPreset[]>([]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => { getChorePresets().then((p) => setPresets(p.rooms)).catch(() => {}); }, []);

  if (!house) return null;
  const used = new Set(setup.rooms.map((r) => r.name.toLowerCase()));

  // cômodo adicionado depois do setup traz tarefas que ninguém estimou ainda
  const mine = setup.survey.members.find((m) => m.id === me?.id);
  const pendentes = setup.survey.totalChores - (mine?.choreVotes ?? 0);

  return (
    <div className="page stack-lg">
      {manage && (
        <div className="row-between">
          <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
          <span className="bold">Cômodos</span>
          <span style={{ width: 60 }} />
        </div>
      )}

      <div>
        {!manage && <div className="eyebrow">Tarefinhas · passo 1 de 3</div>}
        <h1>Cômodos da casa</h1>
        <div className="small muted">
          Cada cômodo já vem com as tarefas típicas dele. O tamanho vira um palpite de dificuldade
          que a casa ajusta no questionário.
        </div>
      </div>

      <div className="wrap">
        {presets.map((p) => (
          <button
            key={p.key}
            className="chip"
            disabled={used.has(p.name.toLowerCase())}
            onClick={async () => {
              await addRoom(house.id, { name: p.name, emoji: p.emoji, size: 'medio', preset: p.key });
              await onReload();
              toast(`${p.emoji} ${p.name} adicionado`);
            }}
          >
            {p.emoji} {p.name}
          </button>
        ))}
        <button className="chip chip--soft" onClick={() => setAdding(true)}>＋ Outro</button>
      </div>

      <section className="stack">
        {setup.rooms.map((room) => (
          <div key={room.id} className="card row" style={{ padding: 12 }}>
            <span style={{ fontSize: '1.7rem', flex: 'none' }}>{room.emoji}</span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="bold small">{room.name}</div>
              <div className="tiny muted">
                {room.chores.length} {room.chores.length === 1 ? 'tarefa' : 'tarefas'} · {room.size}
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => setRemoving({ id: room.id, name: room.name })}>✕</button>
          </div>
        ))}
        {!setup.rooms.length && (
          <div className="card card--flat center small muted" style={{ padding: 24 }}>
            Escolha os cômodos que existem na sua casa.
          </div>
        )}
      </section>

      {manage && pendentes > 0 && (
        <div className="card card--accent stack">
          <div className="bold small">
            {pendentes} {pendentes === 1 ? 'tarefa nova ainda sem sua estimativa' : 'tarefas novas ainda sem sua estimativa'}
          </div>
          <div className="tiny muted">
            Até você responder, elas usam o palpite padrão do app em vez da média da casa.
          </div>
        </div>
      )}

      <button className="btn btn--primary btn--lg btn--block" disabled={!setup.rooms.length} onClick={onNext}>
        {manage
          ? (pendentes > 0 ? 'Estimar as tarefas novas' : 'Revisar minhas estimativas')
          : 'Continuar para o questionário'}
      </button>

      <NewRoomSheet
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={async () => { setAdding(false); await onReload(); }}
      />

      <Confirm
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remover ${removing?.name}?`}
        message="As tarefas desse cômodo saem junto, com o histórico delas."
        confirmLabel="Remover"
        danger
        onConfirm={async () => { if (removing) { await deleteRoom(removing.id); await onReload(); } }}
      />
    </div>
  );
}

function NewRoomSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { house, meta, toast } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🚪');
  const [size, setSize] = useState<'pequeno' | 'medio' | 'grande'>('medio');
  const [preset, setPreset] = useState<string>('geral');
  const [presets, setPresets] = useState<RoomPreset[]>([]);

  useEffect(() => { if (open) getChorePresets().then((p) => setPresets(p.rooms)).catch(() => {}); }, [open]);
  if (!house || !meta) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Novo cômodo"
      footer={
        <button
          className="btn btn--primary btn--block"
          disabled={!name.trim()}
          onClick={async () => {
            await addRoom(house.id, { name: name.trim(), emoji, size, preset });
            toast(`${emoji} ${name.trim()} adicionado`);
            setName('');
            onSaved();
          }}
        >
          Adicionar
        </button>
      }
    >
      <div className="stack-lg">
        <Field label="Nome">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Quarto 2" autoFocus />
        </Field>
        <Field label="Ícone">
          <div className="grid-pick">
            {meta.roomEmojis.map((e) => (
              <button key={e} className={`pick ${emoji === e ? 'pick--on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
        </Field>
        <Field label="Tamanho" hint="Vira o palpite inicial de dificuldade do cômodo.">
          <div className="wrap">
            {SIZES.map((s) => (
              <button key={s.value} className={`chip ${size === s.value ? 'chip--on' : ''}`} onClick={() => setSize(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Trazer as tarefas de" hint="O app já cadastra as tarefas típicas desse tipo de cômodo.">
          <div className="wrap">
            {presets.map((p) => (
              <button key={p.key} className={`chip ${preset === p.key ? 'chip--on' : ''}`} onClick={() => setPreset(p.key)}>
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- 2. questionário
function SurveyStep({
  setup, onBack, onSent,
}: {
  setup: SetupState;
  onBack: () => void;
  onSent: () => void;
}) {
  const { house, me, toast } = useApp();
  const [rooms, setRooms] = useState<SurveyRoom[]>([]);
  const [chores, setChores] = useState<SurveyChore[]>([]);
  const [answers, setAnswers] = useState<Record<number, { minutes: number; difficulty: number }>>({});
  const [roomAnswers, setRoomAnswers] = useState<Record<number, number>>({});
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!house || !me) return;
    getSurvey(house.id, me.id).then((s) => {
      setRooms(s.rooms);
      setChores(s.chores);
      setAnswers(Object.fromEntries(s.chores.map((c) => [
        c.id,
        { minutes: c.myMinutes ?? c.suggestedMinutes, difficulty: c.myDifficulty ?? c.suggestedDifficulty },
      ])));
      setRoomAnswers(Object.fromEntries(s.rooms.map((r) => [r.id, r.myVote ?? r.suggested])));
      setTouched(new Set(s.chores.filter((c) => c.myMinutes != null).map((c) => c.id)));
    }).catch(() => toast('Não deu para abrir o questionário'));
  }, [house, me, toast]);

  if (!house || !me) return null;

  const send = async () => {
    setSending(true);
    try {
      await postSurvey(house.id, {
        member_id: me.id,
        complete: true,
        chores: Object.entries(answers).map(([id, v]) => ({ chore_id: Number(id), ...v })),
        rooms: Object.entries(roomAnswers).map(([id, difficulty]) => ({ room_id: Number(id), difficulty })),
      });
      onSent();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para enviar');
    } finally {
      setSending(false);
    }
  };

  // agrupa por cômodo, na ordem em que vieram
  const groups: { room: string; emoji: string; items: SurveyChore[] }[] = [];
  for (const c of chores) {
    const key = c.room_name ?? 'Outras';
    let g = groups.find((x) => x.room === key);
    if (!g) { g = { room: key, emoji: c.room_emoji ?? '🏠', items: [] }; groups.push(g); }
    g.items.push(c);
  }

  const others = setup.survey.members.filter((m) => m.id !== me.id);

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Cômodos</button>
        <span className="tiny muted">passo 2 de 3</span>
      </div>

      <div>
        <h1>Na sua opinião…</h1>
        <div className="small muted">
          Quanto tempo cada tarefa leva e quão chata ela é. O app já preencheu um palpite, então
          <b> mude só o que você discorda</b>. No fim, vale a média da casa.
        </div>
      </div>

      {others.length > 0 && (
        <div className="card card--flat row" style={{ gap: 8 }}>
          {others.map((m) => (
            <div key={m.id} className="row tiny" style={{ gap: 5 }}>
              <Avatar emoji={m.emoji} size="sm" color={m.completed ? 'var(--ok)' : 'var(--line-2)'} />
              <span className={m.completed ? 'bold' : 'muted'}>{m.name}</span>
              <span>{m.completed ? '✅' : '⏳'}</span>
            </div>
          ))}
        </div>
      )}

      <section className="stack">
        <div className="eyebrow">Dificuldade de cada cômodo</div>
        {rooms.map((room) => (
          <div key={room.id} className="card stack" style={{ padding: 12, gap: 8 }}>
            <div className="row">
              <span style={{ fontSize: '1.3rem' }}>{room.emoji}</span>
              <span className="bold small grow">{room.name}</span>
              <span className="tiny muted">{DIFF_LABEL[roomAnswers[room.id] ?? 3]}</span>
            </div>
            <Dots value={roomAnswers[room.id] ?? 3} onPick={(n) => setRoomAnswers((a) => ({ ...a, [room.id]: n }))} />
          </div>
        ))}
      </section>

      {groups.map((g) => (
        <section key={g.room} className="stack">
          <div className="eyebrow">{g.emoji} {g.room}</div>
          {g.items.map((c) => {
            const a = answers[c.id] ?? { minutes: c.suggestedMinutes, difficulty: c.suggestedDifficulty };
            return (
              <div key={c.id} className={`card stack ${touched.has(c.id) ? 'card--accent' : ''}`} style={{ padding: 12, gap: 8 }}>
                <div className="row">
                  <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                  <span className="bold small grow">{c.name}</span>
                  <span className="tiny muted">{a.minutes} min · {DIFF_LABEL[Math.round(a.difficulty)]}</span>
                </div>

                <div className="wrap" style={{ gap: 5 }}>
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      className={`chip ${a.minutes === t ? 'chip--on' : ''}`}
                      style={{ padding: '5px 9px', fontSize: '.76rem' }}
                      onClick={() => {
                        setAnswers((p) => ({ ...p, [c.id]: { ...a, minutes: t } }));
                        setTouched((s) => new Set(s).add(c.id));
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <Dots
                  value={Math.round(a.difficulty)}
                  onPick={(n) => {
                    setAnswers((p) => ({ ...p, [c.id]: { ...a, difficulty: n } }));
                    setTouched((s) => new Set(s).add(c.id));
                  }}
                />
              </div>
            );
          })}
        </section>
      ))}

      <div className="tiny muted">
        Tempos em blocos fechados de 5 minutos. É assim que o app monta as combinações depois.
      </div>

      <button className="btn btn--primary btn--lg btn--block" disabled={sending} onClick={send}>
        {sending ? 'Enviando…' : 'Enviar minhas respostas'}
      </button>
    </div>
  );
}

/** Escala de dificuldade de 1 a 5. */
function Dots({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <div className="row" style={{ gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          aria-label={`${n} de 5`}
          style={{
            flex: 1, height: 30, borderRadius: 8,
            background: n <= value ? 'var(--ac)' : 'var(--surface-2)',
            border: '1px solid var(--line)',
            opacity: n <= value ? 1 : 0.7,
            transition: 'background .12s ease',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- esperando a casa
/**
 * Quem já respondeu e já vetou fica aqui até o resto da casa terminar. As
 * Tarefinhas usam a média de todo mundo, então não dá para liberar pela metade.
 */
function Esperando({
  setup, onRevisar, onVoltar,
}: {
  setup: SetupState;
  onRevisar: () => void;
  onVoltar: () => void;
}) {
  const { house, me, toast } = useApp();
  if (!house || !me) return null;

  // quem falta pode estar devendo o questionário, o veto, ou os dois
  const pendentes = setup.survey.members
    .filter((m) => !m.completed || setup.vetos?.faltando.some((f) => f.id === m.id))
    .map((m) => ({
      ...m,
      falta: !m.completed
        ? (setup.vetos?.faltando.some((f) => f.id === m.id) ? 'questionário e tarefa vetada' : 'questionário')
        : 'tarefa vetada',
    }));

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onVoltar}>‹ Voltar</button>
        <span className="tiny muted">quase lá</span>
      </div>

      <div className="card card--accent stack center" style={{ textAlign: 'center', gap: 8 }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <h2>Você já fez a sua parte</h2>
        <div className="small muted">
          As Tarefinhas usam a média da casa inteira, então elas só abrem quando todo mundo
          responder. Avise a galera!
        </div>
      </div>

      <section className="stack">
        <div className="eyebrow">Falta</div>
        {pendentes.map((m) => (
          <div key={m.id} className="card row" style={{ padding: 12 }}>
            <Avatar emoji={m.emoji} size="md" color="var(--line-2)" />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="bold small">{m.name}</div>
              <div className="tiny muted">precisa responder: {m.falta}</div>
            </div>
            <span className="badge badge--warn">⏳</span>
          </div>
        ))}
      </section>

      <section className="stack">
        <div className="eyebrow">O que você já fez</div>
        <div className="card card--flat stack" style={{ gap: 8 }}>
          <div className="row small">
            <span>✅</span>
            <span className="grow">Estimou {setup.survey.totalChores} tarefas e {setup.rooms.length} cômodos</span>
          </div>
          <div className="row small">
            <span>✅</span>
            <span className="grow">Escolheu a tarefa que você não faz</span>
          </div>
        </div>
      </section>

      <button className="btn btn--block" onClick={onRevisar}>
        ⚙️ Revisar cômodos e respostas
      </button>

      <button
        className="btn btn--ghost btn--block tiny"
        style={{ minHeight: 36 }}
        onClick={() => {
          navigator.clipboard?.writeText(`Falta você responder o questionário das Tarefinhas no House Kats! ${window.location.origin}`)
            .then(() => toast('Recado copiado, é só colar no grupo'))
            .catch(() => toast('Copie o endereço do app e mande para a casa'));
        }}
      >
        📋 Copiar um recado para a casa
      </button>
    </div>
  );
}

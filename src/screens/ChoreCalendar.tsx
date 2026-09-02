import { useEffect, useMemo, useState } from 'react';
import { getCalendar, type CalendarEntry, type CalendarRepeat } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Empty, Loading } from '../components/ui';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const shift = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
};

/** Quanto dá para avançar: um ano cobre até a repetição anual mais distante. */
const LIMITE_FUTURO = shift(monthKey(new Date()), 12);

const INTERVALO: Record<number, string> = {
  7: 'toda semana', 15: 'a cada quinze dias', 30: 'todo mês', 60: 'a cada dois meses',
  90: 'a cada três meses', 180: 'a cada seis meses', 365: 'todo ano',
};

/** Calendário do mês: o que cada integrante fez, e o que ainda vai voltar. */
export default function ChoreCalendar({ onBack }: { onBack: () => void }) {
  const { house, me } = useApp();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [feitas, setFeitas] = useState<CalendarEntry[] | null>(null);
  const [aRepetir, setARepetir] = useState<CalendarRepeat[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!house) return;
    setFeitas(null);
    getCalendar(house.id, month)
      .then((c) => { setFeitas(c.feitas); setARepetir(c.aRepetir); })
      .catch(() => { setFeitas([]); setARepetir([]); });
  }, [house, month]);

  const filtered = useMemo(
    () => (feitas ?? []).filter((e) => !onlyMine || e.member_id === me?.id),
    [feitas, onlyMine, me]
  );

  const repeticoes = useMemo(
    () => aRepetir.filter((r) => !onlyMine || r.member_id === me?.id),
    [aRepetir, onlyMine, me]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.day) ?? [];
      list.push(e);
      map.set(e.day, list);
    }
    return map;
  }, [filtered]);

  const repeatByDay = useMemo(() => {
    const map = new Map<string, CalendarRepeat[]>();
    for (const r of repeticoes) {
      const list = map.get(r.day) ?? [];
      list.push(r);
      map.set(r.day, list);
    }
    return map;
  }, [repeticoes]);

  if (!house || !me) return null;
  if (!feitas) return <Loading label="Abrindo o calendário…" />;

  const [year, mon] = month.split('-').map(Number);
  const first = new Date(year, mon - 1, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const startPad = first.getDay();
  const todayKey = new Date().toISOString().slice(0, 10);

  const cells: (string | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];

  const dayEntries = pickedDay ? byDay.get(pickedDay) ?? [] : [];
  const dayRepeats = pickedDay ? repeatByDay.get(pickedDay) ?? [] : [];
  const totalStars = Math.round(filtered.reduce((s, e) => s + e.stars, 0) * 10) / 10;

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Calendário</span>
        <span style={{ width: 60 }} />
      </div>

      <div className="row-between">
        <button className="btn btn--sm" onClick={() => setMonth((m) => shift(m, -1))}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div className="bold">{MONTHS[mon - 1]} de {year}</div>
          <div className="tiny muted">
            {filtered.length} tarefas · {totalStars} ⭐
            {repeticoes.length > 0 && ` · ${repeticoes.length} voltando`}
          </div>
        </div>
        {/* dá para avançar porque as repetições caem em meses que ainda não chegaram */}
        <button
          className="btn btn--sm"
          onClick={() => setMonth((m) => shift(m, 1))}
          disabled={month >= LIMITE_FUTURO}
        >
          ›
        </button>
      </div>

      <div className="wrap">
        <button className={`chip ${!onlyMine ? 'chip--on' : ''}`} onClick={() => setOnlyMine(false)}>🏠 A casa toda</button>
        <button className={`chip ${onlyMine ? 'chip--on' : ''}`} onClick={() => setOnlyMine(true)}>{me.emoji} Só as minhas</button>
      </div>

      <div className="card card--flat">
        <div className="cal-grid cal-grid--head">
          {WEEKDAYS.map((d, i) => <div key={i} className="cal-wd">{d}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (!day) return <div key={`p${i}`} />;
            const list = byDay.get(day) ?? [];
            const volta = repeatByDay.get(day) ?? [];
            const num = Number(day.slice(-2));
            const people = [...new Map(list.map((e) => [e.member_id, e])).values()];
            return (
              <button
                key={day}
                className={[
                  'cal-day',
                  list.length ? 'cal-day--on' : '',
                  volta.length ? 'cal-day--volta' : '',
                  day === todayKey ? 'cal-day--today' : '',
                  pickedDay === day ? 'cal-day--sel' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setPickedDay(pickedDay === day ? null : day)}
              >
                <span className="cal-day__n">{num}</span>
                <span className="cal-day__dots">
                  {people.slice(0, 3).map((p) => (
                    <i key={p.member_id} style={{ background: 'var(--ac)', opacity: p.member_id === me.id ? 1 : 0.45 }} />
                  ))}
                  {volta.slice(0, 2).map((r) => <i key={`v${r.id}`} className="cal-dot--volta" />)}
                </span>
              </button>
            );
          })}
        </div>
        {repeticoes.length > 0 && (
          <div className="row tiny muted" style={{ marginTop: 8, justifyContent: 'center', gap: 6 }}>
            <i className="cal-dot--volta" style={{ width: 6, height: 6, borderRadius: 999, display: 'inline-block' }} />
            <span>tarefa especial voltando</span>
          </div>
        )}
      </div>

      {pickedDay && (
        <section className="stack">
          <div className="eyebrow">
            {Number(pickedDay.slice(-2))} de {MONTHS[mon - 1]}
          </div>

          {dayRepeats.map((r) => (
            <div key={`r${r.id}`} className="card row card--accent" style={{ padding: 10 }}>
              <span style={{ fontSize: '1.3rem', flex: 'none' }}>🕒</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small bold truncate">{r.name}</div>
                <div className="tiny muted">
                  volta para {r.member_name} {r.member_emoji}
                  {INTERVALO[r.repeat_days] ? ` · ${INTERVALO[r.repeat_days]}` : ''}
                </div>
              </div>
              <span className="badge">volta</span>
            </div>
          ))}

          {dayEntries.length === 0 && dayRepeats.length === 0 ? (
            <div className="card card--flat small muted center" style={{ padding: 18 }}>Nada foi feito nesse dia.</div>
          ) : (
            dayEntries.map((e) => (
              <div key={e.id} className="card row" style={{ padding: 10 }}>
                <Avatar emoji={e.member_emoji} size="sm" color={e.member_id === me.id ? 'var(--ac)' : 'var(--line-2)'} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small bold truncate">{e.chore_name}</div>
                  <div className="tiny muted">{e.member_name} · {e.minutes} min</div>
                </div>
                <span className="badge">{e.stars} ⭐</span>
              </div>
            ))
          )}
        </section>
      )}

      {/* lista corrida do que volta, para não depender de achar o dia no grid */}
      {repeticoes.length > 0 && (
        <section className="stack">
          <div className="eyebrow">🕒 Voltam neste mês</div>
          {repeticoes.map((r) => (
            <button
              key={r.id}
              className="card row card--tap"
              style={{ padding: 10 }}
              onClick={() => setPickedDay(r.day)}
            >
              <span className="badge" style={{ flex: 'none' }}>{Number(r.day.slice(-2))}</span>
              <div className="grow" style={{ minWidth: 0, textAlign: 'left' }}>
                <div className="small bold truncate">{r.name}</div>
                <div className="tiny muted">
                  {r.member_emoji} {r.member_name}
                  {INTERVALO[r.repeat_days] ? ` · ${INTERVALO[r.repeat_days]}` : ''}
                </div>
              </div>
              <span className="accent bold">›</span>
            </button>
          ))}
        </section>
      )}

      {!filtered.length && !repeticoes.length && (
        <Empty emoji="🗓️" title="Mês em branco" text="Assim que alguém fizer uma tarefa, ela aparece aqui." />
      )}
    </div>
  );
}

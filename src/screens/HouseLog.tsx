import { useEffect, useState } from 'react';
import { getLog, type LogEntry } from '../lib/api';
import { useApp } from '../lib/store';
import { Empty, Loading } from '../components/ui';

/** Agrupa o log por dia, com rotulos amigaveis. */
function dayLabel(iso: string) {
  const d = iso.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return 'Hoje';
  if (d === yest) return 'Ontem';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const timeLabel = (iso: string) => iso.slice(11, 16);

export default function HouseLog({ onBack }: { onBack?: () => void }) {
  const { house } = useApp();
  const [entries, setEntries] = useState<LogEntry[] | null>(null);

  useEffect(() => {
    if (!house) return;
    getLog(house.id, 120).then(setEntries).catch(() => setEntries([]));
  }, [house]);

  if (!entries) return <Loading label="Lendo o diário da casa…" />;

  const groups: { day: string; items: LogEntry[] }[] = [];
  for (const e of entries) {
    const label = dayLabel(e.created_at);
    const last = groups[groups.length - 1];
    if (last?.day === label) last.items.push(e);
    else groups.push({ day: label, items: [e] });
  }

  return (
    <div className="page stack-lg">
      {onBack && <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>‹ Voltar</button>}
      <div>
        <h1>Log da casa</h1>
        <div className="small muted">Tudo que acontece por aqui, em ordem.</div>
      </div>

      {!entries.length && <Empty emoji="🍃" title="Nada aconteceu ainda" text="Assim que a casa se mexer, aparece aqui." />}

      {groups.map((g) => (
        <section key={g.day} className="stack">
          <div className="eyebrow">{g.day}</div>
          <div className="card card--flat stack" style={{ padding: 6 }}>
            {g.items.map((e) => (
              <div key={e.id} className="row" style={{ padding: '9px 10px' }}>
                <span style={{ fontSize: '1.2rem', width: 26, textAlign: 'center', flex: 'none' }}>{e.icon}</span>
                <span className="grow small">{e.message}</span>
                <span className="tiny muted" style={{ flex: 'none' }}>{timeLabel(e.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

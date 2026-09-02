import { useCallback, useEffect, useState } from 'react';
import {
  endTravel, getTravel, getTravelPlan, resolveTravelItems, startTravel,
  type PantryItem, type Travel as TravelRow, type TravelPlan,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Confirm, Field, Loading } from '../components/ui';

const DAYS = [3, 5, 7, 10, 15, 30];
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));

const BUCKETS: { key: 'consumir' | 'congelar' | 'doar'; emoji: string; title: string; hint: string; action: 'consumido' | 'ajuste' }[] = [
  { key: 'consumir', emoji: '🍽️', title: 'Come antes de sair', hint: 'Não sobrevive à viagem', action: 'consumido' },
  { key: 'congelar', emoji: '🧊', title: 'Manda pro congelador', hint: 'Aguenta congelado', action: 'ajuste' },
  { key: 'doar', emoji: '🤝', title: 'Doa ou dá pra alguém', hint: 'Estraga rápido e não congela bem', action: 'ajuste' },
];

/**
 * Modo Viagem: congela streaks e tarefas enquanto a casa está vazia e diz o que
 * fazer com a geladeira antes de sair.
 */
export default function Travel({ onBack }: { onBack: () => void }) {
  const { house, me, toast, refresh } = useApp();
  const [active, setActive] = useState<TravelRow | null | undefined>(undefined);
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [ending, setEnding] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!house) return;
    const t = await getTravel(house.id);
    setActive(t.active);
    const p = await getTravelPlan(house.id, t.active
      ? Math.max(1, Math.round((new Date(t.active.end_day).getTime() - Date.now()) / 86400000))
      : days);
    setPlan(p);
  }, [house, days]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar')); }, [load, toast]);

  if (!house || !me) return null;
  if (active === undefined || !plan) return <Loading label="Olhando o armário…" />;

  const toggle = (id: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const resolve = async (items: PantryItem[], action: 'consumido' | 'ajuste') => {
    const ids = items.filter((i) => picked.has(i.id)).map((i) => i.id);
    if (!ids.length) return;
    await resolveTravelItems(house.id, { item_ids: ids, action, member_id: me.id });
    toast(`${ids.length} ${ids.length === 1 ? 'item resolvido' : 'itens resolvidos'}`);
    setPicked(new Set());
    load();
  };

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Modo Viagem</span>
        <span style={{ width: 60 }} />
      </div>

      {/* ------------------------------------------------ viagem em curso */}
      {active ? (
        <div className="card card--accent stack">
          <div style={{ fontSize: '2.4rem' }}>✈️</div>
          <h2>A casa está viajando</h2>
          <div className="small muted">
            Até <b>{active.end_day.split('-').reverse().join('/')}</b>. Streaks de alimentação
            congeladas e tarefas sem acumular atraso. Ninguém perde nada enquanto está fora.
          </div>
          <button className="btn btn--block" onClick={() => setEnding(true)}>🏡 Voltamos, encerrar</button>
        </div>
      ) : (
        <div className="card stack">
          <div style={{ fontSize: '2.2rem' }}>🧳</div>
          <h2>Vai sair de casa?</h2>
          <div className="small muted">
            Diga quantos dias e o app mostra o que fazer com o armário. Enquanto durar,
            as streaks e as tarefas ficam congeladas.
          </div>

          <Field label="Quantos dias fora?">
            <div className="wrap">
              {DAYS.map((d) => (
                <button key={d} className={`chip ${days === d ? 'chip--on' : ''}`} onClick={() => setDays(d)}>
                  {d} dias
                </button>
              ))}
            </div>
          </Field>

          <button
            className="btn btn--primary btn--block"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await startTravel(house.id, { days });
                toast('Modo Viagem ligado ✈️');
                await refresh();
                await load();
              } finally {
                setBusy(false);
              }
            }}
          >
            Ativar Modo Viagem
          </button>
        </div>
      )}

      {/* ------------------------------------------------ plano da geladeira */}
      <div className="card card--flat row">
        <span style={{ fontSize: '1.6rem' }}>{plan.atRisk ? '⚠️' : '👍'}</span>
        <div className="grow small">
          {plan.atRisk
            ? <><b>{plan.atRisk} de {plan.total} itens</b> não sobrevivem a {plan.days} dias fora.</>
            : <>Nada corre risco em {plan.days} dias. Pode viajar tranquilo.</>}
        </div>
      </div>

      {BUCKETS.map((b) => {
        const items = plan[b.key];
        if (!items.length) return null;
        const anyPicked = items.some((i) => picked.has(i.id));
        return (
          <section key={b.key} className="stack">
            <div className="row-between">
              <div className="eyebrow">{b.emoji} {b.title}</div>
              <span className="tiny muted">{items.length}</span>
            </div>
            <div className="card card--flat stack" style={{ gap: 6 }}>
              <div className="tiny muted">{b.hint}</div>
              {items.map((it) => (
                <button
                  key={it.id}
                  className="row"
                  style={{ padding: '6px 0', textAlign: 'left' }}
                  onClick={() => toggle(it.id)}
                >
                  <span className={`check ${picked.has(it.id) ? 'check--on' : ''}`} style={{ width: 22, height: 22 }}>
                    {picked.has(it.id) ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: '1.1rem' }}>{it.emoji}</span>
                  <span className="grow small truncate">{it.name}</span>
                  <span className="tiny muted">
                    {fmt(it.qty)} {it.unit}
                    {it.daysLeft != null && ` · ${it.daysLeft}d`}
                  </span>
                </button>
              ))}
              {anyPicked && (
                <button className="btn btn--soft btn--sm btn--block" onClick={() => resolve(items, b.action)}>
                  {b.key === 'consumir' ? 'Marcar como consumido' : 'Dar baixa dos marcados'}
                </button>
              )}
            </div>
          </section>
        );
      })}

      {plan.sobrevive.length > 0 && (
        <section className="stack">
          <div className="eyebrow">✅ Esses aguentam</div>
          <div className="card card--flat wrap">
            {plan.sobrevive.map((it) => (
              <span key={it.id} className="chip tiny">{it.emoji} {it.name}</span>
            ))}
          </div>
        </section>
      )}

      <Confirm
        open={ending}
        onClose={() => setEnding(false)}
        title="Encerrar o Modo Viagem?"
        message="Streaks e tarefas voltam a contar normalmente a partir de hoje."
        confirmLabel="Voltamos!"
        onConfirm={async () => {
          if (!active) return;
          await endTravel(active.id);
          toast('Bem-vindos de volta 🏡');
          await refresh();
          await load();
        }}
      />
    </div>
  );
}

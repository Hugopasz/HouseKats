import { useCallback, useEffect, useState } from 'react';
import { getPlan, markDone, type Plan } from '../lib/api';
import { useApp } from '../lib/store';
import { Empty } from '../components/ui';

const TIMES = [5, 10, 15, 20, 30, 45, 60, 90];

/**
 * O motor das Tarefinhas: você informa o tempo, o app escolhe as tarefas.
 * Prioriza o que está mais atrasado e evita empilhar tudo no mesmo cômodo.
 */
export default function ChorePlan({ onBack }: { onBack: () => void }) {
  const { house, me, toast } = useApp();
  const [minutes, setMinutes] = useState(15);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState<{ stars: number; count: number } | null>(null);

  const fetchPlan = useCallback(async (mins: number) => {
    if (!house || !me) return;
    setLoading(true);
    try {
      setPlan(await getPlan(house.id, me.id, mins));
      setDone(new Set());
    } catch {
      toast('Não deu para montar o plano');
    } finally {
      setLoading(false);
    }
  }, [house, me, toast]);

  useEffect(() => { fetchPlan(minutes); }, [fetchPlan, minutes]);

  if (!house || !me) return null;

  const finish = async () => {
    const ids = plan?.plan.filter((c) => done.has(c.id)).map((c) => c.id) ?? [];
    if (!ids.length) return;
    const res = await markDone(house.id, me.id, ids);
    setFinished({ stars: res.stars, count: res.count });
  };

  // ---- resultado
  if (finished) {
    return (
      <div className="page stack-lg">
        <div className="card card--accent stack center" style={{ textAlign: 'center', gap: 10 }}>
          <div style={{ fontSize: '3.4rem' }} className="pop">✨</div>
          <h1>+{finished.stars} ⭐</h1>
          <div className="muted">
            {finished.count} {finished.count === 1 ? 'tarefa concluída' : 'tarefas concluídas'}. A casa agradece.
          </div>
          <button className="btn btn--primary btn--block" onClick={onBack}>Voltar</button>
          <button className="btn btn--ghost btn--block" onClick={() => { setFinished(null); fetchPlan(minutes); }}>
            Bora de novo
          </button>
        </div>
      </div>
    );
  }

  const chosen = plan?.plan.filter((c) => done.has(c.id)) ?? [];
  const chosenStars = Math.round(chosen.reduce((s, c) => s + c.stars, 0) * 10) / 10;

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Tenho tempo para…</span>
        <span style={{ width: 60 }} />
      </div>

      <div className="card stack">
        <div className="eyebrow">Quanto tempo você tem?</div>
        <div className="wrap">
          {TIMES.map((t) => (
            <button key={t} className={`chip ${minutes === t ? 'chip--on' : ''}`} onClick={() => setMinutes(t)}>
              {t} min
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="center" style={{ padding: 30 }}><div className="spinner" /></div>}

      {!loading && plan && plan.plan.length === 0 && (
        <Empty
          emoji="🤷"
          title="Nada cabe nesse tempo"
          text="As tarefas cadastradas levam mais do que isso. Escolha um tempo maior."
        />
      )}

      {!loading && plan && plan.plan.length > 0 && (
        <>
          <div className="card card--accent stack" style={{ gap: 6 }}>
            <div className="row-between">
              <span className="eyebrow">Seu plano</span>
              <span className="tiny bold accent">{plan.totalStars} ⭐ em jogo</span>
            </div>
            <div className="small muted">
              {plan.totalMinutes} de {plan.budget} minutos
              {plan.leftover > 0 && ` · sobram ${plan.leftover} para respirar`}
            </div>
          </div>

          <div className="stack">
            {plan.plan.map((c) => {
              const on = done.has(c.id);
              return (
                <button
                  key={c.id}
                  className={`card row card--tap ${on ? 'card--accent' : ''}`}
                  style={{ padding: 12, gap: 10 }}
                  onClick={() => setDone((s) => {
                    const n = new Set(s);
                    if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                    return n;
                  })}
                >
                  <span className={`check ${on ? 'check--on' : ''}`}>{on ? '✓' : ''}</span>
                  <span style={{ fontSize: '1.5rem', flex: 'none' }}>{c.emoji}</span>
                  <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                    <div className="bold small truncate">{c.name}</div>
                    <div className="tiny muted">
                      {c.room_name ? `${c.room_emoji} ${c.room_name} · ` : ''}{c.minutes} min · {c.stars} ⭐
                      {c.neverDone ? ' · nunca feita' : c.daysSince != null ? ` · há ${c.daysSince} dias` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button className="btn btn--ghost btn--block" onClick={() => fetchPlan(minutes)}>
            🔄 Me dá outra combinação
          </button>

          <button className="btn btn--primary btn--lg btn--block" disabled={!chosen.length} onClick={finish}>
            {chosen.length ? `Concluir ${chosen.length} e ganhar ${chosenStars} ⭐` : 'Marque o que você fez'}
          </button>

          <div className="tiny muted center">
            Marque só o que realmente deu tempo. O resto continua na fila para a próxima.
          </div>
        </>
      )}
    </div>
  );
}

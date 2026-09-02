import { useEffect, useState } from 'react';
import { getInsights, type Insights as InsightsData } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Empty, Loading } from '../components/ui';
import HouseLog from './HouseLog';

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
};

const RANGES = [3, 6, 12];

/** Padrões de gasto e de gosto da casa. */
export default function Insights() {
  const { house } = useApp();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<InsightsData | null>(null);
  const [verLog, setVerLog] = useState(false);

  useEffect(() => {
    if (!house) return;
    setData(null);
    getInsights(house.id, months).then(setData).catch(() => setData(null));
  }, [house, months]);

  if (!house) return null;
  if (verLog) return <HouseLog onBack={() => setVerLog(false)} />;
  if (!data) return <Loading label="Cruzando os números da casa…" />;

  const hasData = data.totalSpent > 0 || data.mealsLogged > 0;
  const maxMonth = Math.max(1, ...data.spendByMonth.map((m) => m.total));
  const maxCat = Math.max(1, ...data.spendByCategory.map((c) => c.total));
  const maxDelivery = Math.max(1, ...data.deliveryByMonth.map((m) => m.total));
  const maxEaten = Math.max(1, ...data.eatenByCategory.map((c) => c.times));

  return (
    <div className="page stack-lg">
      <div>
        <h1>Padrões da casa</h1>
        <div className="small muted">O que vocês compram, comem e desperdiçam.</div>
      </div>

      <div className="wrap">
        {RANGES.map((m) => (
          <button key={m} className={`chip ${months === m ? 'chip--on' : ''}`} onClick={() => setMonths(m)}>
            {m} meses
          </button>
        ))}
      </div>

      {!hasData && (
        <Empty
          emoji="📊"
          title="Ainda sem histórico"
          text="Registre compras e consumos por alguns dias e os padrões aparecem aqui sozinhos."
        />
      )}

      {hasData && (
        <>
          {/* ---------------------------------------- resumo */}
          <div className="hl-grid">
            <div className="hl">
              <span className="hl__ico">💸</span>
              <span className="hl__val">{brl(data.totalSpent)}</span>
              <span className="hl__lbl">gasto em {data.months} meses</span>
            </div>
            <div className="hl">
              <span className="hl__ico">🍽️</span>
              <span className="hl__val">{brl(data.costPerPersonDay)}</span>
              <span className="hl__lbl">por pessoa, por dia</span>
            </div>
            <div className="hl hl--wide">
              <span className="hl__ico">{data.wastePct > 15 ? '😬' : data.wastePct > 5 ? '🙂' : '🌱'}</span>
              <span className="hl__val">
                {data.spoiledCount === 0
                  ? 'Nada foi pro lixo'
                  : data.wastePct < 1
                    ? 'Quase nada vai pro lixo'
                    : `${data.wastePct}% vai pro lixo`}
              </span>
              <span className="hl__lbl">
                {data.spoiledCount === 0
                  ? 'nenhum item estragou no período'
                  : `${data.spoiledCount} ${data.spoiledCount === 1 ? 'item estragou' : 'itens estragaram'} no período`}
                {data.spoiledCount > 0 && (data.wastePct <= 5 ? ' · vocês aproveitam bem' : data.wastePct > 15 ? ' · dá para melhorar' : '')}
              </span>
            </div>
          </div>

          {/* ---------------------------------------- gasto por mês */}
          {data.spendByMonth.length > 1 && (
            <section className="stack">
              <div className="eyebrow">Gasto por mês</div>
              <div className="card card--flat">
                <div className="chart">
                  {data.spendByMonth.map((m) => (
                    <div key={m.month} className="chart__col">
                      <span className="chart__val">{Math.round(m.total)}</span>
                      <div className="chart__bar" style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }} />
                      <span className="chart__lbl">{monthLabel(m.month)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ---------------------------------------- mercado x delivery */}
          {data.spendBySource.length > 0 && (
            <section className="stack">
              <div className="eyebrow">Mercado ou delivery</div>

              <div className="card stack">
                <div className="split">
                  {data.spendBySource.map((s) => (
                    <div
                      key={s.reason}
                      className="split__part"
                      style={{ width: `${s.pct}%`, background: s.color }}
                      title={`${s.label}: ${brl(s.total)}`}
                    />
                  ))}
                </div>

                <div className="stack" style={{ gap: 8 }}>
                  {data.spendBySource.map((s) => (
                    <div key={s.reason} className="row-between">
                      <span className="small">
                        <span className="split__dot" style={{ background: s.color }} />
                        {s.emoji} {s.label}
                      </span>
                      <span className="tiny">
                        <b>{brl(s.total)}</b>
                        <span className="muted"> · {s.pct}% · {s.items} {s.items === 1 ? 'item' : 'itens'}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="tiny muted">
                  {data.deliveryTotal === 0
                    ? 'Nenhum delivery no período. A casa está toda no mercado.'
                    : data.deliveryPct >= 40
                      ? `Delivery já é ${data.deliveryPct}% do que entra em casa. Costuma sair bem mais caro por porção.`
                      : `Delivery é ${data.deliveryPct}% do total. O mercado ainda segura a maior parte.`}
                </div>
              </div>

              {data.deliveryByMonth.length > 1 && data.deliveryTotal > 0 && (
                <div className="card card--flat stack" style={{ gap: 8 }}>
                  <div className="tiny muted">Delivery por mês</div>
                  <div className="chart">
                    {data.deliveryByMonth.map((m) => (
                      <div key={m.month} className="chart__col">
                        <span className="chart__val">{Math.round(m.total)}</span>
                        <div
                          className="chart__bar chart__bar--alt"
                          style={{ height: `${Math.max(4, (m.total / maxDelivery) * 100)}%` }}
                        />
                        <span className="chart__lbl">{monthLabel(m.month)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ---------------------------------------- gasto por categoria */}
          {data.spendByCategory.length > 0 && (
            <section className="stack">
              <div className="eyebrow">Onde o dinheiro vai</div>
              <div className="card card--flat stack" style={{ gap: 10 }}>
                {data.spendByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="row-between">
                      <span className="small">{c.emoji} {c.label}</span>
                      <span className="tiny bold">{brl(c.total)}</span>
                    </div>
                    <div className="bar" style={{ height: 7, marginTop: 4 }}>
                      <div className="bar__fill" style={{ width: `${(c.total / maxCat) * 100}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------- gostos */}
          {data.eatenByCategory.length > 0 && (
            <section className="stack">
              <div className="eyebrow">O que a casa realmente come</div>
              <div className="card card--flat stack" style={{ gap: 10 }}>
                {data.eatenByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="row-between">
                      <span className="small">{c.emoji} {c.label}</span>
                      <span className="tiny muted">{c.times} registros</span>
                    </div>
                    <div className="bar" style={{ height: 7, marginTop: 4 }}>
                      <div className="bar__fill" style={{ width: `${(c.times / maxEaten) * 100}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------- compras frequentes */}
          {data.topBought.length > 0 && (
            <section className="stack">
              <div className="eyebrow">Sempre na sacola</div>
              <div className="card card--flat stack" style={{ gap: 8 }}>
                {data.topBought.map((t) => (
                  <div key={t.name} className="row">
                    <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                    <span className="grow small truncate">{t.name}</span>
                    <span className="tiny muted">{t.times}x · {brl(t.spent)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------- desperdício */}
          {data.wasted.length > 0 && (
            <section className="stack">
              <div className="eyebrow">O que costuma estragar</div>
              <div className="card card--flat stack" style={{ gap: 8 }}>
                {data.wasted.map((w) => (
                  <div key={w.name} className="row">
                    <span style={{ fontSize: '1.2rem' }}>{w.emoji}</span>
                    <span className="grow small truncate">{w.name}</span>
                    <span className="badge badge--warn">{w.times}x</span>
                  </div>
                ))}
                <div className="tiny muted">Vale comprar menos ou cozinhar mais cedo esses aí.</div>
              </div>
            </section>
          )}

          {/* ---------------------------------------- receitas */}
          {data.topCooked.length > 0 && (
            <section className="stack">
              <div className="eyebrow">Pratos que vocês repetem</div>
              <div className="card card--flat stack" style={{ gap: 8 }}>
                {data.topCooked.map((t) => (
                  <div key={t.name} className="row">
                    <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                    <span className="grow small truncate">{t.name}</span>
                    {t.comfort && <span className="badge">🏅</span>}
                    <span className="tiny muted">{t.times}x</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.topRated.length > 0 && (
            <section className="stack">
              <div className="eyebrow">As melhores notas</div>
              <div className="card card--flat stack" style={{ gap: 8 }}>
                {data.topRated.map((t) => (
                  <div key={t.name} className="row">
                    <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                    <span className="grow small truncate">{t.name}</span>
                    <span className="tiny bold">{t.stars} ⭐</span>
                    <span className="tiny muted">({t.votes})</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------- por integrante */}
          <section className="stack">
            <div className="eyebrow">Por integrante</div>
            {data.byMember.map((m) => (
              <div key={m.id} className="card row" style={{ padding: 12 }}>
                <Avatar emoji={m.emoji} size="md" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold small">{m.name}</div>
                  <div className="tiny muted">
                    {m.meals} refeições · {m.purchases} compras · {m.chores} tarefas
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div className="tiny bold">{brl(m.spent)}</div>
                  <div className="tiny muted">{m.stars} ⭐</div>
                </div>
              </div>
            ))}
          </section>

          <div className="tiny muted">
            Números calculados a partir do histórico real de movimentos da casa. Preços aparecem só
            onde alguém anotou.
          </div>
        </>
      )}

      <button className="card card--tap row" onClick={() => setVerLog(true)}>
        <span style={{ fontSize: '1.7rem' }}>📜</span>
        <div className="grow" style={{ textAlign: 'left' }}>
          <div className="bold small">Log da casa</div>
          <div className="tiny muted">Tudo que aconteceu por aqui, em ordem</div>
        </div>
        <span className="accent bold">›</span>
      </button>
    </div>
  );
}

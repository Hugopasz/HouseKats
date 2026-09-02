import { useCallback, useEffect, useState } from 'react';
import {
  deleteDrink, getDrinkCatalog, getDrinks, logDrink,
  type DrinkCatalogItem, type DrinkDay,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Field, Loading, Sheet } from '../components/ui';

const ml = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} L` : `${n} ml`);

const TIPO_LABEL: Record<string, { label: string; emoji: string }> = {
  agua: { label: 'Água', emoji: '💧' },
  cha: { label: 'Chá', emoji: '🍵' },
  suco: { label: 'Suco', emoji: '🧃' },
  leite: { label: 'Leite', emoji: '🥛' },
  cafe: { label: 'Café', emoji: '☕' },
  doce: { label: 'Doces', emoji: '🥤' },
  alcool: { label: 'Álcool', emoji: '🍺' },
  outro: { label: 'Outros', emoji: '🥛' },
};

/**
 * Gestor de líquidos. O foco é a água do dia, mas tudo que se bebe entra na
 * conta: cada bebida hidrata um tanto, e algumas ainda aumentam a meta.
 */
export default function Drinks({ onBack }: { onBack: () => void }) {
  const { house, me, toast } = useApp();
  const [dia, setDia] = useState<DrinkDay | null>(null);
  const [catalogo, setCatalogo] = useState<DrinkCatalogItem[]>([]);
  const [copos, setCopos] = useState<{ ml: number; label: string; emoji: string }[]>([]);
  const [escolhida, setEscolhida] = useState<DrinkCatalogItem | null>(null);
  const [daGeladeira, setDaGeladeira] = useState<DrinkDay['naGeladeira'][number] | null>(null);

  const load = useCallback(async () => {
    if (!house || !me) return;
    setDia(await getDrinks(house.id, me.id));
  }, [house, me]);

  useEffect(() => {
    getDrinkCatalog().then((c) => { setCatalogo(c.bebidas); setCopos(c.copos); }).catch(() => {});
    load().catch(() => toast('Não deu para carregar'));
  }, [load, toast]);

  if (!house || !me) return null;
  if (!dia) return <Loading label="Contando os goles…" />;

  const beber = async (nome: string, volume: number, itemId?: number) => {
    try {
      const r = await logDrink(house.id, { member_id: me.id, name: nome, ml: volume, item_id: itemId ?? null });
      setDia(r.resumo);
      toast(
        r.debt_ml > 0
          ? `${ml(r.water_ml)} de água, mas +${ml(r.debt_ml)} na meta`
          : `+${ml(r.water_ml)} de água 💧`
      );
      setEscolhida(null);
      setDaGeladeira(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para registrar');
    }
  };

  const maxHist = Math.max(1, ...dia.historico.map((h) => Math.max(h.agua, h.meta)));

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Líquidos</span>
        <span style={{ width: 60 }} />
      </div>

      {/* ------------------------------------------------ copo do dia */}
      <div className="card card--accent stack" style={{ gap: 10 }}>
        <div className="row-between">
          <span className="eyebrow">Água de hoje</span>
          <span className={`tiny bold ${dia.pct >= 100 ? 'accent' : 'muted'}`}>{dia.pct}%</span>
        </div>

        <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: '2.6rem', fontWeight: 800, lineHeight: 1 }}>
            {ml(dia.agua)}
          </span>
          <span className="muted">de {ml(dia.meta.total)}</span>
        </div>

        <div className="copo">
          <div className="copo__agua" style={{ height: `${Math.min(100, dia.pct)}%` }} />
        </div>
        <div className="small bold center">
          {dia.falta > 0 ? `faltam ${ml(dia.falta)}` : 'meta batida! 🎉'}
        </div>

        {dia.meta.extra > 0 && (
          <div className="tiny muted">
            Café, álcool e bebida doce puxam água do corpo, então sua meta subiu{' '}
            <b>{ml(dia.meta.extra)}</b> hoje.
          </div>
        )}
      </div>

      {/* ------------------------------------------------ avisos simpáticos */}
      {dia.avisos.map((a) => (
        <div key={a.kind} className="card stack" style={{ gap: 4 }}>
          <div className="row">
            <span style={{ fontSize: '1.5rem' }}>{a.emoji}</span>
            <span className="bold small grow">{a.titulo}</span>
          </div>
          <div className="tiny muted">{a.texto}</div>
        </div>
      ))}

      {/* ------------------------------------------------ registrar */}
      <section className="stack">
        <div className="eyebrow">Bebi agora</div>
        <div className="wrap">
          {catalogo.slice(0, 10).map((b) => (
            <button key={b.key} className="chip" onClick={() => setEscolhida(b)}>
              {b.emoji} {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ da geladeira */}
      {dia.naGeladeira.length > 0 && (
        <section className="stack">
          <div className="eyebrow">Beber do armário</div>
          <div className="tiny muted">Sai do estoque de verdade e conta como consumo.</div>
          {dia.naGeladeira.map((it) => (
            <button
              key={it.id}
              className="card row card--tap"
              style={{ padding: 12 }}
              onClick={() => setDaGeladeira(it)}
            >
              <span style={{ fontSize: '1.4rem' }}>{it.emoji}</span>
              <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                <div className="bold small truncate">{it.name}</div>
                <div className="tiny muted">
                  tem {ml(it.disponivelMl)} · hidrata {Math.round(it.hydration * 100)}%
                </div>
              </div>
              <span className="accent bold">›</span>
            </button>
          ))}
        </section>
      )}

      {/* ------------------------------------------------ de onde veio */}
      {dia.porTipo.length > 0 && (
        <section className="stack">
          <div className="eyebrow">De onde veio sua hidratação</div>
          <div className="card card--flat stack" style={{ gap: 10 }}>
            {dia.porTipo.map((t) => {
              const info = TIPO_LABEL[t.kind] ?? TIPO_LABEL.outro;
              return (
                <div key={t.kind}>
                  <div className="row-between">
                    <span className="small">{info.emoji} {info.label}</span>
                    <span className="tiny muted">{ml(t.ml)} → {ml(t.water)} de água</span>
                  </div>
                  <div className="bar" style={{ height: 6, marginTop: 4 }}>
                    <div className="bar__fill" style={{ width: `${(t.water / Math.max(1, dia.agua)) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ semana */}
      {dia.historico.length > 1 && (
        <section className="stack">
          <div className="eyebrow">Últimos dias</div>
          <div className="card card--flat">
            <div className="chart">
              {dia.historico.map((hh) => (
                <div key={hh.day} className="chart__col">
                  <span className="chart__val">{Math.round(hh.agua / 100) / 10}L</span>
                  <div
                    className="chart__bar"
                    style={{
                      height: `${Math.max(4, (hh.agua / maxHist) * 100)}%`,
                      opacity: hh.pct >= 100 ? 1 : 0.55,
                    }}
                  />
                  <span className="chart__lbl">{hh.day.slice(8, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ hoje */}
      {dia.goles.length > 0 && (
        <section className="stack">
          <div className="row-between">
            <div className="eyebrow">Registrado hoje</div>
            <span className="tiny muted">{ml(dia.volume)} no total</span>
          </div>
          <div className="card card--flat stack" style={{ gap: 6 }}>
            {dia.goles.map((g) => (
              <div key={g.id} className="row">
                <span style={{ fontSize: '1.1rem' }}>
                  {catalogo.find((c) => c.key === g.drink_key)?.emoji ?? '🥤'}
                </span>
                <span className="grow small truncate">{g.name}</span>
                <span className="tiny muted">
                  {ml(g.ml)}{g.debt_ml > 0 && <span className="accent"> +{ml(g.debt_ml)}</span>}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ minHeight: 28, padding: '2px 6px' }}
                  onClick={async () => { await deleteDrink(g.id); await load(); }}
                  aria-label="Apagar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="tiny muted">
        As porcentagens de hidratação são estimativas de uso doméstico. Beber água segue sendo o
        jeito mais direto de bater a meta.
      </div>

      {/* ------------------------------------------------ quanto? */}
      <Sheet
        open={!!escolhida || !!daGeladeira}
        onClose={() => { setEscolhida(null); setDaGeladeira(null); }}
        title={escolhida ? `${escolhida.emoji} ${escolhida.label}` : `${daGeladeira?.emoji} ${daGeladeira?.name}`}
        subtitle="Quanto você bebeu?"
      >
        <div className="stack-lg">
          <div className="wrap">
            {copos.map((c) => (
              <button
                key={c.ml}
                className="btn"
                onClick={() => beber(
                  escolhida?.label ?? daGeladeira!.name,
                  daGeladeira ? Math.min(c.ml, daGeladeira.disponivelMl) : c.ml,
                  daGeladeira?.id
                )}
              >
                {c.emoji} {c.label} · {c.ml} ml
              </button>
            ))}
          </div>

          {escolhida && (
            <div className="card card--flat stack" style={{ gap: 4 }}>
              <div className="small">
                Hidrata <b>{Math.round(escolhida.hydration * 100)}%</b> do volume.
              </div>
              {escolhida.debt > 0 && (
                <div className="tiny muted">
                  E adiciona <b>{Math.round(escolhida.debt * 100)}%</b> do volume à sua meta de água,
                  para compensar o efeito no corpo.
                </div>
              )}
            </div>
          )}

          {daGeladeira && (
            <div className="tiny muted">
              Vai sair do armário: sobram {ml(daGeladeira.disponivelMl)} depois disso.
            </div>
          )}

          <div className="row tiny muted">
            <Avatar member={me} size="sm" />
            <span>Registrando para {me.name}</span>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

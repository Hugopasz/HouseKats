import { useCallback, useEffect, useState } from 'react';
import {
  addLeftover, getLeftovers, removePantryItems, toggleFreeze,
  type PantryItem,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Confirm, Empty, Field, Loading, Sheet } from '../components/ui';

const PRAZOS = [1, 2, 3, 4, 5, 7];

/**
 * Sobras: comida já pronta guardada na geladeira, com prazo curto. Passou do
 * prazo, o app avisa para jogar fora em vez de deixar a pessoa descobrir pelo
 * cheiro.
 */
export default function Leftovers({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const { house, me, toast } = useApp();
  const [ativas, setAtivas] = useState<PantryItem[] | null>(null);
  const [vencidas, setVencidas] = useState<PantryItem[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [descartando, setDescartando] = useState<PantryItem | null>(null);

  const load = useCallback(async () => {
    if (!house) return;
    const r = await getLeftovers(house.id);
    setAtivas(r.ativas);
    setVencidas(r.vencidas);
  }, [house]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar as sobras')); }, [load, toast]);

  if (!house || !me) return null;
  if (!ativas) return <Loading label="Olhando os potes…" />;

  const darBaixa = async (s: PantryItem, motivo: 'consumido' | 'estragou') => {
    await removePantryItems(house.id, {
      loggedBy: me.id,
      reason: motivo,
      lines: [{ item_id: s.id, qty: s.qty }],
      consumers: motivo === 'consumido' ? [me.id] : undefined,
    });
    toast(motivo === 'consumido' ? 'Comeu tudo 🍽️' : 'Foi para o lixo 🗑️');
    await load();
    onChanged();
  };

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Sobras</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setAdicionando(true)}>＋</button>
      </div>

      {/* ------------------------------------------------ o que passou do prazo */}
      {vencidas.length > 0 && (
        <section className="stack">
          <div className="card card--accent stack" style={{ gap: 8 }}>
            <div className="row">
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <div className="grow">
                <div className="bold">
                  {vencidas.length === 1 ? 'Uma sobra passou do prazo' : `${vencidas.length} sobras passaram do prazo`}
                </div>
                <div className="tiny muted">Melhor jogar fora sem cheirar.</div>
              </div>
            </div>
            {vencidas.map((s) => (
              <div key={s.id} className="row" style={{ gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>🍲</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small bold truncate">{s.name}</div>
                  <div className="tiny muted">
                    venceu há {Math.abs(s.daysLeft ?? 0)} {Math.abs(s.daysLeft ?? 0) === 1 ? 'dia' : 'dias'}
                  </div>
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => setDescartando(s)}>🗑️ Jogar fora</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ sobras boas */}
      <section className="stack">
        <div className="row-between">
          <div className="eyebrow">No armário</div>
          <span className="tiny muted">{ativas.length} {ativas.length === 1 ? 'pote' : 'potes'}</span>
        </div>

        {!ativas.length && !vencidas.length && (
          <Empty
            emoji="🍲"
            title="Nenhuma sobra guardada"
            text="Sobrou comida do almoço? Guarde aqui e diga quantos dias ela aguenta. O app avisa quando o prazo virar."
            action={<button className="btn btn--primary" onClick={() => setAdicionando(true)}>Guardar uma sobra</button>}
          />
        )}

        {ativas.map((s) => (
          <div key={s.id} className="card stack" style={{ padding: 12, gap: 10 }}>
            <div className="row">
              <span style={{ fontSize: '1.6rem', flex: 'none' }}>{s.frozen ? '❄️' : '🍲'}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="bold small truncate">{s.name}</div>
                <div className="tiny muted">
                  {s.qty} {s.qty === 1 ? 'porção' : 'porções'}
                  {s.daysLeft != null && ` · ${s.daysLeft === 0 ? 'come hoje' : `${s.daysLeft} ${s.daysLeft === 1 ? 'dia' : 'dias'}`}`}
                  {s.frozen ? ' · congelada' : ''}
                </div>
              </div>
              <span className={`badge ${s.status === 'urgente' ? 'badge--danger' : s.status === 'atencao' ? 'badge--warn' : ''}`}>
                {s.frozen ? '❄️' : s.status === 'urgente' ? 'come logo' : 'ok'}
              </span>
            </div>

            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn--sm grow" onClick={() => darBaixa(s, 'consumido')}>🍽️ Comi</button>
              <button
                className="btn btn--sm grow"
                onClick={async () => {
                  await toggleFreeze(s.id, !s.frozen, me.id);
                  toast(s.frozen ? 'Tirou do congelador' : 'Foi para o congelador ❄️');
                  await load();
                  onChanged();
                }}
              >
                {s.frozen ? '💧 Descongelar' : '❄️ Congelar'}
              </button>
              <button className="btn btn--sm btn--danger" onClick={() => setDescartando(s)}>🗑️</button>
            </div>
          </div>
        ))}
      </section>

      <div className="tiny muted">
        Sobras contam como comida disponível na casa, igual ao resto do armário.
      </div>

      <NovaSobra
        open={adicionando}
        onClose={() => setAdicionando(false)}
        onSaved={async () => { setAdicionando(false); await load(); onChanged(); }}
      />

      <Confirm
        open={!!descartando}
        onClose={() => setDescartando(null)}
        title={`Jogar fora ${descartando?.name}?`}
        message="Entra no histórico como desperdício, o que ajuda a casa a comprar melhor depois."
        confirmLabel="Jogar fora"
        danger
        onConfirm={() => descartando && darBaixa(descartando, 'estragou')}
      />
    </div>
  );
}

// ---------------------------------------------------------------- guardar sobra
function NovaSobra({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { house, me, toast } = useApp();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(2);
  const [dias, setDias] = useState(3);
  const [frozen, setFrozen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!house || !me) return null;

  const salvar = async () => {
    setSaving(true);
    try {
      await addLeftover(house.id, {
        name: name.trim(), qty, days: dias, frozen, member_id: me.id,
      });
      toast(`${name.trim()} guardado 🍲`);
      setName(''); setQty(2); setDias(3); setFrozen(false);
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Guardar sobra"
      subtitle="O que sobrou da refeição"
      footer={
        <button className="btn btn--primary btn--block" disabled={!name.trim() || saving} onClick={salvar}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      }
    >
      <div className="stack-lg">
        <Field label="O que sobrou?">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lasanha de domingo"
            autoFocus
            maxLength={40}
          />
        </Field>

        <Field label="Quantas porções?">
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="bold grow center" style={{ fontSize: '1.2rem' }}>{qty}</span>
            <button className="btn btn--soft" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
          </div>
        </Field>

        <Field label="Aguenta quantos dias?" hint="Passou disso, o app avisa para jogar fora.">
          <div className="wrap">
            {PRAZOS.map((d) => (
              <button key={d} className={`chip ${dias === d ? 'chip--on' : ''}`} onClick={() => setDias(d)}>
                {d} {d === 1 ? 'dia' : 'dias'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Vai para onde?">
          <div className="wrap">
            <button className={`chip ${!frozen ? 'chip--on' : ''}`} onClick={() => setFrozen(false)}>🧊 Geladeira</button>
            <button className={`chip ${frozen ? 'chip--on' : ''}`} onClick={() => setFrozen(true)}>❄️ Congelador</button>
          </div>
          {frozen && <div className="tiny muted">No congelador o prazo estica bastante.</div>}
        </Field>
      </div>
    </Sheet>
  );
}

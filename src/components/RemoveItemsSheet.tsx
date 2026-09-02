import { useEffect, useMemo, useState } from 'react';
import { removePantryItems, type PantryItem, type RemoveReason } from '../lib/api';
import { useApp } from '../lib/store';
import { STEP, fmtQty } from '../lib/units';
import { Field, Sheet } from './ui';

const REASONS: { value: RemoveReason; label: string; emoji: string }[] = [
  { value: 'consumido', label: 'Consumido', emoji: '🍽️' },
  { value: 'estragou', label: 'Estragou', emoji: '🗑️' },
  { value: 'ajuste', label: 'Ajuste', emoji: '⚖️' },
];

const fmt = fmtQty;

export default function RemoveItemsSheet({
  open, onClose, onSaved, pantry,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  pantry: PantryItem[];
}) {
  const { house, me, toast } = useApp();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<RemoveReason>('consumido');
  const [consumers, setConsumers] = useState<number[]>([]);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  // ao abrir, quem está usando o app já entra como consumidor
  useEffect(() => {
    if (open && me) setConsumers([me.id]);
    if (!open) { setPicked({}); setQ(''); setReason('consumido'); }
  }, [open, me]);

  const bump = (it: PantryItem, dir: 1 | -1) => {
    setPicked((p) => {
      const step = STEP[it.unit] ?? 1;
      const next = Math.min(it.qty, Math.max(0, +(((p[it.id] ?? 0) + dir * step).toFixed(3))));
      const out = { ...p };
      if (next <= 0) delete out[it.id];
      else out[it.id] = next;
      return out;
    });
  };

  const takeAll = (it: PantryItem) =>
    setPicked((p) => ({ ...p, [it.id]: p[it.id] === it.qty ? 0 : it.qty }));

  const lines = useMemo(
    () => Object.entries(picked).filter(([, v]) => v > 0).map(([k, v]) => ({ item_id: Number(k), qty: v })),
    [picked]
  );

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    const withPick = pantry.filter((p) => picked[p.id] > 0);
    const rest = pantry.filter((p) => !picked[p.id] && (!n || p.name.toLowerCase().includes(n)));
    return [...withPick, ...rest];
  }, [pantry, q, picked]);

  const toggleConsumer = (id: number) =>
    setConsumers((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const save = async () => {
    if (!house || !me || !lines.length) return;
    setSaving(true);
    try {
      const res = await removePantryItems(house.id, {
        loggedBy: me.id,
        reason,
        lines,
        consumers: reason === 'consumido' ? consumers : undefined,
      });
      toast(`${res.removed} ${res.removed === 1 ? 'item atualizado' : 'itens atualizados'}`);
      setPicked({});
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para dar baixa');
    } finally {
      setSaving(false);
    }
  };

  if (!house) return null;
  const canSave = lines.length > 0 && (reason !== 'consumido' || consumers.length > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Dar baixa"
      subtitle="Toque nos itens que saíram"
      footer={
        <button className="btn btn--primary btn--block" disabled={!canSave || saving} onClick={save}>
          {saving ? 'Salvando…' : lines.length ? `Dar baixa em ${lines.length} ${lines.length === 1 ? 'item' : 'itens'}` : 'Escolha um item'}
        </button>
      }
    >
      <div className="stack-lg">
        <Field label="Motivo">
          <div className="wrap">
            {REASONS.map((rr) => (
              <button
                key={rr.value}
                type="button"
                className={`chip ${reason === rr.value ? 'chip--on' : ''}`}
                onClick={() => setReason(rr.value)}
              >
                {rr.emoji} {rr.label}
              </button>
            ))}
          </div>
        </Field>

        {reason === 'consumido' && (
          <Field label="Quem consumiu?" hint="Marcou outra pessoa? Ela recebe um aviso para confirmar ou contestar.">
            <div className="wrap">
              {house.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`chip ${consumers.includes(m.id) ? 'chip--on' : ''}`}
                  onClick={() => toggleConsumer(m.id)}
                >
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
            {consumers.length > 1 && (
              <div className="tiny muted">Dividido igualmente entre {consumers.length} pessoas.</div>
            )}
          </Field>
        )}

        {pantry.length > 6 && (
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Buscar item" />
        )}

        <div className="stack" style={{ gap: 8 }}>
          {filtered.map((it) => {
            const take = picked[it.id] ?? 0;
            return (
              <div key={it.id} className={`card row ${take > 0 ? 'card--accent' : ''}`} style={{ padding: 10, gap: 8 }}>
                <span style={{ fontSize: '1.4rem', flex: 'none' }}>{it.emoji}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold small truncate">{it.name}</div>
                  <div className="tiny muted">
                    tem {fmt(it.qty)} {it.unit}
                    {take > 0 && <span className="accent bold"> · saindo {fmt(take)} {it.unit}</span>}
                  </div>
                </div>
                <div className="row" style={{ gap: 4, flex: 'none' }}>
                  <button className="btn btn--sm" onClick={() => bump(it, -1)} disabled={!take} aria-label="Menos">−</button>
                  <button className="btn btn--sm btn--soft" onClick={() => bump(it, 1)} aria-label="Mais">+</button>
                  <button className="btn btn--sm btn--ghost" onClick={() => takeAll(it)} title="Tudo">tudo</button>
                </div>
              </div>
            );
          })}
          {!filtered.length && <div className="small muted center" style={{ padding: 20 }}>Nada por aqui.</div>}
        </div>
      </div>
    </Sheet>
  );
}

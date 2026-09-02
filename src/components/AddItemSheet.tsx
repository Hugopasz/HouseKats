import { useEffect, useState } from 'react';
import {
  addPantryItem, searchHouseFoods,
  type Category, type FoodSuggestion, type Origin, type Unit,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Field, Sheet } from './ui';

const ORIGINS: { value: Origin; label: string; emoji: string }[] = [
  { value: 'comprado', label: 'Mercado', emoji: '🛒' },
  { value: 'delivery', label: 'Delivery', emoji: '🛵' },
  { value: 'ganho', label: 'Ganho', emoji: '🎁' },
  { value: 'ajuste', label: 'Ajuste', emoji: '⚖️' },
];

/** Mercado e delivery custam dinheiro; ganho e ajuste, não. */
const TEM_PRECO: Origin[] = ['comprado', 'delivery'];

export default function AddItemSheet({
  open, onClose, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { house, me, meta, toast } = useApp();
  const temPet = !!house?.members.some((m) => m.isPet);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('proteina');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<Unit>('un');
  const [origin, setOrigin] = useState<Origin>('comprado');
  const [price, setPrice] = useState('');
  const [forMember, setForMember] = useState<number | null>(null);
  const [expires, setExpires] = useState('');
  const [frozen, setFrozen] = useState(false);
  const [hints, setHints] = useState<FoodSuggestion[]>([]);
  const [touchedCat, setTouchedCat] = useState(false);
  const [saving, setSaving] = useState(false);

  // sugestoes conforme digita; a primeira que casa define categoria e unidade
  useEffect(() => {
    if (!open || !house) return;
    let alive = true;
    const t = setTimeout(() => {
      searchHouseFoods(house.id, name).then((s) => {
        if (!alive) return;
        setHints(s);
        const exact = s.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
        if (exact && !touchedCat) {
          setCategory(exact.category);
          setUnit(exact.unit);
        }
      }).catch(() => {});
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [name, open, touchedCat, house]);

  const reset = () => {
    setName(''); setQty('1'); setUnit('un'); setPrice(''); setExpires('');
    setForMember(null); setTouchedCat(false); setCategory('proteina'); setOrigin('comprado'); setFrozen(false);
  };

  const pickHint = (h: FoodSuggestion) => {
    setName(h.name);
    setCategory(h.category);
    setUnit(h.unit);
    setTouchedCat(false);
  };

  const save = async (andAnother: boolean) => {
    // no onboarding a geladeira é cadastrada antes de existir integrante
    if (!house) return;
    setSaving(true);
    try {
      await addPantryItem(house.id, {
        name: name.trim(),
        category,
        qty: Number(qty.replace(',', '.')),
        unit,
        origin,
        price: TEM_PRECO.includes(origin) && price ? Number(price.replace(',', '.')) : null,
        for_member_id: forMember,
        expires_at: expires || null,
        frozen,
        loggedBy: me?.id ?? null,
      });
      toast(`${name.trim()} no armário!`);
      onSaved();
      if (andAnother) reset();
      else { reset(); onClose(); }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para adicionar');
    } finally {
      setSaving(false);
    }
  };

  if (!meta || !house) return null;
  const valid = name.trim().length > 0 && Number(qty.replace(',', '.')) > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Adicionar ao armário"
      subtitle="O que chegou em casa?"
      footer={
        <>
          <button className="btn grow" disabled={!valid || saving} onClick={() => save(true)}>
            Salvar e outro
          </button>
          <button className="btn btn--primary grow" disabled={!valid || saving} onClick={() => save(false)}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="stack-lg">
        <Field label="O que é?">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Peito de frango"
            autoFocus
            maxLength={40}
          />
          {hints.length > 0 && (
            <div className="wrap" style={{ marginTop: 4 }}>
              {hints.slice(0, 6).map((h) => (
                <button key={h.name} type="button" className="chip" onClick={() => pickHint(h)}>
                  {h.emoji} {h.name}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Quanto?">
          <div className="row">
            <input
              className="input grow"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="1"
            />
            <select className="select" style={{ width: 110 }} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {meta.units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Categoria">
          <div className="wrap">
            {(Object.entries(meta.categories) as [Category, { label: string; emoji: string }][])
              // a categoria Pet só faz sentido se a casa tiver bichinho
              .filter(([key]) => key !== 'pet' || temPet)
              .map(([key, c]) => (
              <button
                key={key}
                type="button"
                className={`chip ${category === key ? 'chip--on' : ''}`}
                onClick={() => { setCategory(key); setTouchedCat(true); }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="De onde veio?">
          <div className="wrap">
            {ORIGINS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${origin === o.value ? 'chip--on' : ''}`}
                onClick={() => setOrigin(o.value)}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </Field>

        {TEM_PRECO.includes(origin) && (
          <Field label="Preço (opcional)" hint="Alimenta a análise de gastos da casa.">
            <div className="row">
              <span className="bold muted">R$</span>
              <input
                className="input grow"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0,00"
              />
            </div>
          </Field>
        )}

        {/* some no onboarding, quando ainda não há ninguém cadastrado */}
        {house.members.length > 0 && (
          <Field label="Para quem é?" hint="Opcional. Serve para o app já sugerir quem consumiu na hora de dar baixa.">
            <div className="wrap">
              <button
                type="button"
                className={`chip ${forMember === null ? 'chip--on' : ''}`}
                onClick={() => setForMember(null)}
              >
                🏠 A casa toda
              </button>
              {house.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`chip ${forMember === m.id ? 'chip--on' : ''}`}
                  onClick={() => setForMember(m.id)}
                >
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Onde vai guardar?">
          <div className="wrap">
            <button type="button" className={`chip ${!frozen ? 'chip--on' : ''}`} onClick={() => setFrozen(false)}>
              🧊 Geladeira
            </button>
            <button type="button" className={`chip ${frozen ? 'chip--on' : ''}`} onClick={() => setFrozen(true)}>
              ❄️ Congelador
            </button>
          </div>
          {frozen && <div className="tiny muted">Congelado, o app estica bastante o prazo de validade.</div>}
        </Field>

        <Field label="Validade (opcional)" hint="Em branco, o app estima pelo tipo do alimento.">
          <input className="input" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>

        {me && (
          <div className="row tiny muted">
            <Avatar member={me} size="sm" />
            <span>Lançado por {me.name}</span>
          </div>
        )}
      </div>
    </Sheet>
  );
}

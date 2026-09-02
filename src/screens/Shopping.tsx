import { useCallback, useEffect, useState } from 'react';
import {
  addShoppingItem, closeShopping, createShopping, deleteShoppingItem,
  getShopping, patchShoppingItem, previewShopping,
  type ShoppingList, type ShoppingPreview,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Confirm, Empty, Field, Loading, Sheet } from '../components/ui';

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));

const DAY_OPTIONS = [3, 7, 15, 30];

export default function Shopping({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const { house, me, toast } = useApp();
  const [list, setList] = useState<ShoppingList | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    if (!house) return;
    setList(await getShopping(house.id));
  }, [house]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar a lista')); }, [load, toast]);

  if (!house || !me) return null;
  if (list === undefined) return <Loading label="Procurando a lista…" />;

  const toggle = async (id: number, checked: boolean) => {
    setList((l) => (l ? { ...l, items: l.items.map((it) => (it.id === id ? { ...it, checked } : it)) } : l));
    setList(await patchShoppingItem(id, { checked }));
  };

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Lista de compras</span>
        <span style={{ width: 60 }} />
      </div>

      {!list && (
        <Empty
          emoji="🛒"
          title="Nenhuma lista aberta"
          text="O app monta a lista a partir do livro de receitas da casa, descontando o que já tem no armário."
          action={<button className="btn btn--primary btn--lg" onClick={() => setGenerating(true)}>Gerar lista</button>}
        />
      )}

      {list && (
        <>
          <div className="card card--accent stack" style={{ gap: 4 }}>
            <div className="eyebrow">Lista aberta</div>
            <h2>{list.title}</h2>
            <div className="small muted">
              {list.checkedCount} de {list.items.length} no carrinho
            </div>
            <div className="row-between" style={{ marginTop: 4 }}>
              <span className="tiny muted">
                {list.total > 0 ? `${brl(list.total)} anotados` : 'nada anotado ainda'}
              </span>
              <span className="tiny bold accent">~{brl(list.previsto)} no total</span>
            </div>
            <div className="bar" style={{ marginTop: 8 }}>
              <div className="bar__fill" style={{ width: `${(list.checkedCount / Math.max(1, list.items.length)) * 100}%` }} />
            </div>
          </div>

          <div className="card card--flat">
            {list.items.map((it) => (
              <div key={it.id} className={`shop-item ${it.checked ? 'shop-item--done' : ''}`}>
                <button className={`check ${it.checked ? 'check--on' : ''}`} onClick={() => toggle(it.id, !it.checked)}>
                  {it.checked ? '✓' : ''}
                </button>
                <span style={{ fontSize: '1.2rem', flex: 'none' }}>{it.emoji}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small bold truncate shop-item__name">{it.name}</div>
                  <div className="tiny muted">
                    {it.note ? `${it.note} · ` : ''}~{brl(it.estimate ?? 0)}
                  </div>
                </div>

                {/* quantidade editável: quase nunca dá para comprar o valor exato */}
                <input
                  className="input"
                  style={{ width: 58, minHeight: 38, padding: '6px 6px', textAlign: 'right' }}
                  inputMode="decimal"
                  title="Quantidade"
                  defaultValue={fmt(it.qty)}
                  onBlur={async (e) => {
                    const v = Number(e.target.value.replace(',', '.'));
                    if (!Number.isFinite(v) || v === it.qty) return;
                    setList(await patchShoppingItem(it.id, { qty: Math.max(0, v) }));
                  }}
                />
                <span className="tiny muted" style={{ width: 26, flex: 'none' }}>{it.unit}</span>

                <input
                  className="input"
                  style={{ width: 76, minHeight: 38, padding: '6px 8px', textAlign: 'right' }}
                  inputMode="decimal"
                  placeholder="R$"
                  defaultValue={it.price ?? ''}
                  onBlur={async (e) => {
                    const v = e.target.value.replace(',', '.');
                    if (String(it.price ?? '') === v) return;
                    setList(await patchShoppingItem(it.id, { price: v === '' ? null : Number(v) }));
                  }}
                />
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ flex: 'none', minHeight: 32, padding: '2px 6px' }}
                  onClick={async () => setList(await deleteShoppingItem(it.id))}
                  aria-label="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
            {!list.items.length && <div className="small muted center" style={{ padding: 20 }}>Lista vazia.</div>}
          </div>

          <div className="row">
            <button className="btn grow" onClick={() => setAdding(true)}>＋ Item</button>
            <button className="btn btn--primary grow" onClick={() => setClosing(true)}>✅ Fechar lista</button>
          </div>
          <button className="btn btn--ghost btn--block" onClick={() => setGenerating(true)}>
            🔄 Gerar uma lista nova (substitui esta)
          </button>
        </>
      )}

      <GenerateSheet
        open={generating}
        onClose={() => setGenerating(false)}
        onCreated={async (l) => { setList(l); setGenerating(false); onChanged(); }}
      />

      <AddItemSheet
        open={adding}
        listId={list?.id ?? 0}
        onClose={() => setAdding(false)}
        onAdded={(l) => { setList(l); setAdding(false); }}
      />

      <Confirm
        open={closing}
        onClose={() => setClosing(false)}
        title="Fechar a lista?"
        message={`Os ${list?.checkedCount ?? 0} itens marcados entram no armário como comprados, com os preços que você anotou.`}
        confirmLabel="Fechar e guardar"
        onConfirm={async () => {
          if (!list) return;
          const res = await closeShopping(list.id, { stock: true, member_id: me.id });
          toast(res.stocked ? `${res.stocked} itens guardados no armário` : 'Lista fechada');
          setList(null);
          onChanged();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- gerar
function GenerateSheet({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (l: ShoppingList) => void;
}) {
  const { house, me, toast } = useApp();
  const [days, setDays] = useState(7);
  const [members, setMembers] = useState<number[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [includeExpiring, setIncludeExpiring] = useState(true);
  const [preview, setPreview] = useState<ShoppingPreview | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && house) setMembers(house.members.map((m) => m.id));
  }, [open, house]);

  useEffect(() => {
    if (!open || !house || !members.length) return;
    let alive = true;
    const t = setTimeout(() => {
      previewShopping(house.id, { days, members, onlyFavorites, includeExpiring })
        .then((p) => alive && setPreview(p))
        .catch(() => {});
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [open, house, days, members, onlyFavorites, includeExpiring]);

  if (!house || !me) return null;

  const create = async () => {
    setBusy(true);
    try {
      const l = await createShopping(house.id, { days, members, onlyFavorites, includeExpiring, created_by: me.id });
      toast(`Lista com ${l.items.length} itens criada`);
      onCreated(l);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para gerar');
    } finally {
      setBusy(false);
    }
  };

  const noRecipes = preview?.empty === 'sem-receitas';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Gerar lista de compras"
      subtitle="Baseada no livro de receitas da casa"
      footer={
        <button className="btn btn--primary btn--block" disabled={busy || !preview?.items.length} onClick={create}>
          {busy ? 'Gerando…' : preview?.items.length ? `Criar lista com ${preview.items.length} itens` : 'Sem itens'}
        </button>
      }
    >
      <div className="stack-lg">
        <Field label="Para quantos dias?">
          <div className="wrap">
            {DAY_OPTIONS.map((d) => (
              <button key={d} className={`chip ${days === d ? 'chip--on' : ''}`} onClick={() => setDays(d)}>
                {d} dias
              </button>
            ))}
          </div>
        </Field>

        <Field label="Quem vai comer?" hint="A quantidade sai do perfil de dieta de cada um.">
          <div className="wrap">
            {house.members.map((m) => (
              <button
                key={m.id}
                className={`chip ${members.includes(m.id) ? 'chip--on' : ''}`}
                onClick={() => setMembers((c) => (c.includes(m.id) ? c.filter((x) => x !== m.id) : [...c, m.id]))}
              >
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Ajustes">
          <div className="stack" style={{ gap: 8 }}>
            <button
              className={`opt ${onlyFavorites ? 'opt--on' : ''}`}
              onClick={() => setOnlyFavorites((v) => !v)}
            >
              <span className="opt__emoji">⭐</span>
              <span className="grow">
                <span className="opt__title">Só as favoritas</span>
                <div className="tiny muted">
                  Usa apenas receitas com nota 4 ou 5 da casa. A lista fica menor e mais certeira,
                  mas repete mais os mesmos pratos.
                </div>
              </span>
              {onlyFavorites && <span className="accent bold">✓</span>}
            </button>

            <button
              className={`opt ${includeExpiring ? 'opt--on' : ''}`}
              onClick={() => setIncludeExpiring((v) => !v)}
            >
              <span className="opt__emoji">⏳</span>
              <span className="grow">
                <span className="opt__title">Repor o que está vencendo</span>
                <div className="tiny muted">
                  Junta na lista o que já está no armário e vence em até 3 dias, para você
                  substituir antes de estragar.
                </div>
              </span>
              {includeExpiring && <span className="accent bold">✓</span>}
            </button>
          </div>
        </Field>

        {noRecipes && (
          <div className="card card--accent stack">
            <div className="bold">O livro de receitas está vazio</div>
            <div className="small muted">
              Aprove alguns pratos na descoberta primeiro. É deles que sai a lista.
            </div>
          </div>
        )}

        {preview && !noRecipes && (
          <>
            <div className="card stack" style={{ gap: 6 }}>
              <div className="eyebrow">Prévia</div>
              <div className="small">
                <b>{preview.totalMeals} refeições</b> em {preview.days} dias
                {' '}({preview.mealsPerDay}/dia para {members.length} {members.length === 1 ? 'pessoa' : 'pessoas'})
              </div>
              <div className="wrap" style={{ marginTop: 4 }}>
                {preview.recipes.slice(0, 8).map((r) => (
                  <span key={r.id} className="chip tiny">
                    {r.emoji} {r.name} · {r.meals}
                  </span>
                ))}
              </div>
            </div>

            {preview.orcamento && (
              <div className="card card--accent stack" style={{ gap: 4 }}>
                <div className="eyebrow">Vai custar mais ou menos</div>
                <div style={{ fontFamily: 'var(--ff-display)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {brl(preview.orcamento.total)}
                </div>
                <div className="tiny muted">
                  Estimativa com preços médios de mercado ({preview.orcamento.atualizadaEm}), só para
                  dar ordem de grandeza. O preço real depende do mercado e da marca.
                </div>
              </div>
            )}

            <section className="stack" style={{ gap: 4 }}>
              <div className="eyebrow">{preview.items.length} itens</div>
              {preview.items.map((it) => (
                <div key={it.name} className="row small">
                  <span style={{ width: 22 }}>{it.emoji}</span>
                  <span className="grow truncate">{it.name}</span>
                  <span className="tiny muted">{fmt(it.qty)} {it.unit}</span>
                  <span className="tiny bold" style={{ minWidth: 54, textAlign: 'right' }}>
                    ~{brl(it.estimate ?? 0)}
                  </span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- item avulso
function AddItemSheet({
  open, listId, onClose, onAdded,
}: {
  open: boolean;
  listId: number;
  onClose: () => void;
  onAdded: (l: ShoppingList) => void;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('un');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Adicionar item"
      subtitle="Coisas que não vêm das receitas"
      footer={
        <button
          className="btn btn--primary btn--block"
          disabled={!name.trim()}
          onClick={async () => {
            const l = await addShoppingItem(listId, { name: name.trim(), qty: Number(qty.replace(',', '.')) || 1, unit });
            setName(''); setQty('1');
            onAdded(l);
          }}
        >
          Adicionar
        </button>
      }
    >
      <div className="stack">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Papel higiênico" autoFocus />
        <div className="row">
          <input className="input grow" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.,]/g, ''))} />
          <select className="select" style={{ width: 110 }} value={unit} onChange={(e) => setUnit(e.target.value)}>
            {['un', 'g', 'kg', 'ml', 'l', 'pacote'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
    </Sheet>
  );
}

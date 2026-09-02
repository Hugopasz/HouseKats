import { useCallback, useEffect, useState } from 'react';
import {
  deletePantryItem, getBook, getDashboard, getDiscover, getDrinks, getLeftovers, getPantry, getShopping,
  patchPantryItem, toggleFreeze,
  type Category, type Dashboard, type PantryItem, type ShoppingList, type Unit,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Empty, Field, Loading, Sheet } from '../components/ui';
import AddItemSheet from '../components/AddItemSheet';
import RemoveItemsSheet from '../components/RemoveItemsSheet';
import ClaimsSheet, { useClaims } from '../components/ClaimsSheet';
import Discover from './Discover';
import RecipeBook from './RecipeBook';
import Shopping from './Shopping';
import Leftovers from './Leftovers';
import Drinks from './Drinks';

type View = 'home' | 'discover' | 'book' | 'shopping' | 'leftovers' | 'liquidos';

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));
const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

const STATUS_BADGE: Record<string, { cls: string; text: (d: number) => string }> = {
  vencido: { cls: 'badge--danger', text: () => 'vencido' },
  urgente: { cls: 'badge--danger', text: (d) => (d === 0 ? 'vence hoje' : d === 1 ? 'vence amanhã' : `${d} dias`) },
  atencao: { cls: 'badge--warn', text: (d) => `${d} dias` },
};

export default function Fridge() {
  const { me, house, toast } = useApp();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [pantry, setPantry] = useState<PantryItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [view, setView] = useState<View>('home');
  const [shopping, setShopping] = useState<ShoppingList | null>(null);
  const [bookCount, setBookCount] = useState(0);
  const [leftoverCount, setLeftoverCount] = useState(0);
  const [agua, setAgua] = useState<{ pct: number; falta: number } | null>(null);
  const [discoverLeft, setDiscoverLeft] = useState<number | null>(null);
  const { claims, open: claimsOpen, setOpen: setClaimsOpen, reload: reloadClaims } = useClaims();

  const load = useCallback(async () => {
    if (!house || !me) return;
    const [d, p, s, b, disc, lft, drk] = await Promise.all([
      getDashboard(house.id, me.id),
      getPantry(house.id),
      getShopping(house.id),
      getBook(house.id, me.id),
      getDiscover(house.id, me.id),
      getLeftovers(house.id),
      getDrinks(house.id, me.id),
    ]);
    setDash(d);
    setPantry(p);
    setShopping(s);
    setBookCount(b.length);
    setDiscoverLeft(disc.done ? 0 : disc.cards.length);
    setLeftoverCount(lft.ativas.length);
    setAgua({ pct: drk.pct, falta: drk.falta });
  }, [house, me]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar o armário')); }, [load, toast]);

  if (!me || !house) return null;

  if (view === 'discover') return <Discover onBack={() => { setView('home'); load(); }} onChanged={load} />;
  if (view === 'book') return <RecipeBook onBack={() => { setView('home'); load(); }} onChanged={load} />;
  if (view === 'shopping') return <Shopping onBack={() => { setView('home'); load(); }} onChanged={load} />;
  if (view === 'leftovers') return <Leftovers onBack={() => { setView('home'); load(); }} onChanged={load} />;
  if (view === 'liquidos') return <Drinks onBack={() => { setView('home'); load(); }} />;

  if (!dash || !pantry) return <Loading label="Abrindo o armário…" />;

  const meals = dash.meals;
  const mine = dash.me;

  // agrupa o estoque por categoria, na ordem em que aparecem
  const groups: { key: Category; label: string; emoji: string; items: PantryItem[] }[] = [];
  for (const it of pantry) {
    let g = groups.find((x) => x.key === it.category);
    if (!g) {
      g = { key: it.category, label: it.categoryLabel, emoji: it.categoryEmoji, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }

  return (
    <div className="page stack-lg">
      {/* ------------------------------------------------ saudação */}
      <div className="row">
        <Avatar member={me} size="lg" />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="eyebrow">🧊 Armário</div>
          <h1 className="truncate" style={{ fontSize: '2rem' }}>{me.name}</h1>
          <div className="tiny muted truncate">{me.title}</div>
        </div>
      </div>

      {/* ------------------------------------------------ pendências */}
      {claims.length > 0 && (
        <button className="card card--accent row card--tap" onClick={() => setClaimsOpen(true)}>
          <span style={{ fontSize: '1.6rem' }}>🔔</span>
          <div className="grow" style={{ textAlign: 'left' }}>
            <div className="bold small">
              {claims.length} lançamento{claims.length === 1 ? '' : 's'} esperando você
            </div>
            <div className="tiny muted">Alguém marcou um consumo no seu nome</div>
          </div>
          <span className="accent bold">›</span>
        </button>
      )}

      {/* ------------------------------------------------ destaque de refeições */}
      <div className="card card--accent stack" style={{ gap: 6 }}>
        <div className="eyebrow">Você tem comida para</div>
        <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1 }}>
            {meals?.meals ?? 0}
          </span>
          <span className="bold">refeições</span>
        </div>
        {meals && meals.meals > 0 ? (
          <div className="small muted">
            Cerca de <b>{fmt(meals.days)} dias</b> para a casa. O que acaba primeiro é{' '}
            <b className="accent">{meals.bottleneckLabel}</b>.
          </div>
        ) : (
          <div className="small muted">O armário está vazio. Bora abastecer?</div>
        )}

        {/* o que dá para cozinhar agora, do livro da casa */}
        {dash.cozinhaveis.some((c) => c.total > 0) && (
          <button className="cozinhaveis" onClick={() => setView('book')}>
            {dash.cozinhaveis.map((c) => (
              <span key={c.key} className={`cozinhavel ${c.n === 0 ? 'cozinhavel--off' : ''}`}>
                <span className="cozinhavel__n">{c.n}</span>
                <span className="cozinhavel__lbl">{c.emoji} {c.label}</span>
              </span>
            ))}
          </button>
        )}
      </div>

      {/* ------------------------------------------------ highlights */}
      {mine && (
        <section className="stack">
          <div className="eyebrow">Seus highlights de hoje</div>
          <div className="hl-grid">
            <div className="hl">
              <span className="hl__ico">🔥</span>
              <span className="hl__val">{mine.streak.current}</span>
              <span className="hl__lbl">
                {mine.streak.current === 1 ? 'dia de streak' : 'dias de streak'}
                {mine.streak.best > mine.streak.current ? ` · recorde ${mine.streak.best}` : ''}
              </span>
            </div>
            <div className="hl">
              <span className="hl__ico">🛒</span>
              <span className="hl__val">{brl(dash.spentMonth)}</span>
              <span className="hl__lbl">gasto no mês</span>
            </div>

            <div className="hl hl--wide">
              {([
                ['Energia', mine.nutrition.kcal, mine.targets.kcal, 'kcal', mine.pct.kcal, '🔥'],
                ['Proteína', mine.nutrition.protein, mine.targets.protein, 'g', mine.pct.protein, '🥩'],
                ['Carboidrato', mine.nutrition.carbs, mine.targets.carbs, 'g', mine.pct.carbs, '🍚'],
                ['Gordura', mine.nutrition.fat, mine.targets.fat, 'g', mine.pct.fat, '🥑'],
              ] as [string, number, number, string, number, string][]).map(([nome, feito, meta, un, pct, ico], i) => (
                <div key={nome} style={{ marginTop: i ? 10 : 0 }}>
                  <div className="row-between">
                    <span className="hl__lbl">{ico} {nome} · {feito} de {meta} {un}</span>
                    <span className={`tiny bold ${pct > 130 ? 'muted' : 'accent'}`}>{pct}%</span>
                  </div>
                  <div className="bar" style={{ marginTop: 5 }}>
                    <div className="bar__fill" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              ))}
              <div className="tiny muted" style={{ marginTop: 10 }}>
                {mine.nutrition.count === 0
                  ? 'Nenhum consumo registrado hoje. O streak conta constância, não perfeição.'
                  : `${mine.nutrition.count} registro${mine.nutrition.count === 1 ? '' : 's'} hoje. Refeições fora de casa não entram na conta.`}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ vencendo */}
      {dash.expiring.length > 0 && (
        <section className="stack">
          <div className="eyebrow">Usa logo isso aqui</div>
          <div className="card card--flat stack" style={{ gap: 8 }}>
            {dash.expiring.map((it) => {
              const s = STATUS_BADGE[it.status];
              return (
                <div key={it.id} className="row">
                  <span style={{ fontSize: '1.3rem' }}>{it.emoji}</span>
                  <span className="grow small truncate">{it.name}</span>
                  {s && <span className={`badge ${s.cls}`}>{s.text(it.daysLeft ?? 0)}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ liquidos */}
      <button
        className={`card card--tap row ${agua && agua.pct >= 100 ? 'card--accent' : ''}`}
        onClick={() => setView('liquidos')}
      >
        <span style={{ fontSize: '1.7rem' }}>💧</span>
        <div className="grow" style={{ textAlign: 'left' }}>
          <div className="bold small">Líquidos</div>
          <div className="tiny muted">
            {agua === null
              ? '…'
              : agua.falta > 0
                ? `Faltam ${agua.falta >= 1000 ? `${(agua.falta / 1000).toFixed(1).replace('.', ',')} L` : `${agua.falta} ml`} de água hoje`
                : 'Meta de água batida hoje!'}
          </div>
        </div>
        {agua !== null && <span className={`badge ${agua.pct >= 100 ? 'badge--ok' : ''}`}>{agua.pct}%</span>}
      </button>

      {/* ------------------------------------------------ ações */}
      <div className="row">
        <button className="btn btn--primary btn--lg grow" onClick={() => setAdding(true)}>➕ Adicionar</button>
        <button className="btn btn--lg grow" onClick={() => setRemoving(true)} disabled={!pantry.length}>➖ Dar baixa</button>
      </div>

      {/* ------------------------------------------------ lista de compras aberta */}
      {shopping && (
        <button className="card card--accent stack card--tap" style={{ gap: 6 }} onClick={() => setView('shopping')}>
          <div className="row-between">
            <span className="eyebrow">🛒 Lista aberta</span>
            <span className="tiny bold accent">{shopping.checkedCount}/{shopping.items.length}</span>
          </div>
          <div className="bold" style={{ textAlign: 'left' }}>{shopping.title}</div>
          <div className="bar">
            <div className="bar__fill" style={{ width: `${(shopping.checkedCount / Math.max(1, shopping.items.length)) * 100}%` }} />
          </div>
        </button>
      )}

      {/* ------------------------------------------------ receitas e compras */}
      <section className="stack">
        <div className="eyebrow">Cozinha</div>

        {!shopping && (
          <button className="card card--tap row" onClick={() => setView('shopping')}>
            <span style={{ fontSize: '1.7rem' }}>🛒</span>
            <div className="grow" style={{ textAlign: 'left' }}>
              <div className="bold small">Gerar lista de compras</div>
              <div className="tiny muted">Por refeições, dias e pessoas, descontando o que já tem</div>
            </div>
            <span className="accent bold">›</span>
          </button>
        )}

        <button className="card card--tap row" onClick={() => setView('discover')}>
          <span style={{ fontSize: '1.7rem' }}>🎲</span>
          <div className="grow" style={{ textAlign: 'left' }}>
            <div className="bold small">Descobrir receitas</div>
            <div className="tiny muted">
              {discoverLeft === null ? '…' : discoverLeft > 0
                ? `${discoverLeft} ${discoverLeft === 1 ? 'prato esperando' : 'pratos esperando'} sua opinião hoje`
                : 'Sua leva de hoje acabou. Volta amanhã'}
            </div>
          </div>
          {discoverLeft ? <span className="badge">{discoverLeft}</span> : <span className="accent bold">›</span>}
        </button>

        <button className="card card--tap row" onClick={() => setView('book')}>
          <span style={{ fontSize: '1.7rem' }}>📖</span>
          <div className="grow" style={{ textAlign: 'left' }}>
            <div className="bold small">Meu livro de receitas</div>
            <div className="tiny muted">
              {bookCount ? `${bookCount} ${bookCount === 1 ? 'receita aprovada' : 'receitas aprovadas'} pela casa` : 'Nenhuma receita ainda'}
            </div>
          </div>
          <span className="accent bold">›</span>
        </button>

        <button
          className={`card card--tap row ${dash.leftoversExpired.length ? 'card--accent' : ''}`}
          onClick={() => setView('leftovers')}
        >
          <span style={{ fontSize: '1.7rem' }}>🍲</span>
          <div className="grow" style={{ textAlign: 'left' }}>
            <div className="bold small">Sobras</div>
            <div className="tiny muted">
              {dash.leftoversExpired.length
                ? `${dash.leftoversExpired.length} passou do prazo, hora de jogar fora`
                : leftoverCount
                  ? `${leftoverCount} ${leftoverCount === 1 ? 'pote guardado' : 'potes guardados'}`
                  : 'Guarde o que sobrou da refeição'}
            </div>
          </div>
          {dash.leftoversExpired.length
            ? <span className="badge badge--danger">🚨 {dash.leftoversExpired.length}</span>
            : <span className="accent bold">›</span>}
        </button>
      </section>

      {/* ------------------------------------------------ estoque */}
      <section className="stack">
        <div className="row-between">
          <div className="eyebrow">No armário</div>
          <span className="tiny muted">{pantry.length} {pantry.length === 1 ? 'item' : 'itens'}</span>
        </div>

        {!pantry.length && (
          <Empty
            emoji="🧊"
            title="Armário vazio"
            text="Cadastre o que já tem em casa para o app calcular refeições, compras e nutrientes."
            action={<button className="btn btn--primary" onClick={() => setAdding(true)}>Adicionar o primeiro item</button>}
          />
        )}

        {groups.map((g) => (
          <div key={g.key} className="stack" style={{ gap: 8 }}>
            <div className="row tiny muted bold" style={{ marginTop: 4 }}>
              <span>{g.emoji}</span><span>{g.label}</span>
            </div>
            {g.items.map((it) => {
              const s = STATUS_BADGE[it.status];
              const owner = house.members.find((m) => m.id === it.for_member_id);
              return (
                <button key={it.id} className="card card--tap row" style={{ padding: 12 }} onClick={() => setEditing(it)}>
                  <span style={{ fontSize: '1.5rem', flex: 'none' }}>{it.emoji}</span>
                  <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                    <div className="bold small truncate">
                      {it.frozen && <span title="congelado">❄️ </span>}
                      {it.name}
                    </div>
                    <div className="tiny muted">
                      {fmt(it.qty)} {it.unit} · {it.macros.kcal} kcal
                      {owner ? ` · ${owner.emoji} ${owner.name}` : ''}
                    </div>
                  </div>
                  {it.frozen
                    ? <span className="badge" style={{ flex: 'none' }}>congelado</span>
                    : s && <span className={`badge ${s.cls}`} style={{ flex: 'none' }}>{s.text(it.daysLeft ?? 0)}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </section>

      {/* ------------------------------------------------ sheets */}
      <AddItemSheet open={adding} onClose={() => setAdding(false)} onSaved={load} />
      <RemoveItemsSheet open={removing} onClose={() => setRemoving(false)} onSaved={load} pantry={pantry} />
      <ClaimsSheet
        claims={claims}
        forceOpen={claimsOpen}
        onClose={() => setClaimsOpen(false)}
        onResolved={() => { reloadClaims(); load(); }}
      />
      <EditItemSheet item={editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}

// ---------------------------------------------------------------- editar item
function EditItemSheet({
  item, onClose, onSaved,
}: {
  item: PantryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { meta, me, toast } = useApp();
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<Unit>('un');
  const [category, setCategory] = useState<Category>('outro');
  const [expires, setExpires] = useState('');

  useEffect(() => {
    if (!item) return;
    setQty(String(item.qty));
    setUnit(item.unit);
    setCategory(item.category);
    setExpires(item.expires_at ?? '');
  }, [item]);

  if (!item || !meta) return null;

  const save = async () => {
    try {
      await patchPantryItem(item.id, {
        qty: Number(qty.replace(',', '.')),
        unit,
        category,
        expires_at: expires || null,
      });
      toast('Item atualizado');
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para salvar');
    }
  };

  const remove = async () => {
    await deletePantryItem(item.id);
    toast('Item removido do armário');
    onSaved();
    onClose();
  };

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      title={`${item.emoji} ${item.name}`}
      subtitle="Correções rápidas"
      footer={
        <>
          <button className="btn btn--danger" onClick={remove}>🗑️</button>
          <button className="btn btn--primary grow" onClick={save}>Salvar</button>
        </>
      }
    >
      <div className="stack-lg">
        <button
          className={`btn btn--block ${item.frozen ? 'btn--soft' : ''}`}
          onClick={async () => {
            await toggleFreeze(item.id, !item.frozen, me?.id ?? null);
            toast(item.frozen ? 'Tirou do congelador' : 'Foi para o congelador ❄️');
            onSaved();
            onClose();
          }}
        >
          {item.frozen ? '💧 Tirar do congelador' : '❄️ Mandar para o congelador'}
        </button>
        {item.frozen && (
          <div className="tiny muted" style={{ marginTop: -12 }}>
            Congelado desde {item.expires_at ? 'que foi guardado' : 'hoje'}. Ao descongelar, o prazo
            volta ao normal.
          </div>
        )}
        <Field label="Quantidade">
          <div className="row">
            <input
              className="input grow"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d.,]/g, ''))}
            />
            <select className="select" style={{ width: 110 }} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              {meta.units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Categoria">
          <div className="wrap">
            {(Object.entries(meta.categories) as [Category, { label: string; emoji: string }][]).map(([key, c]) => (
              <button key={key} type="button" className={`chip ${category === key ? 'chip--on' : ''}`} onClick={() => setCategory(key)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Validade"
          hint={item.expiry_source === 'auto' ? 'Estimada pelo app a partir do tipo do alimento.' : 'Definida por você.'}
        >
          <input className="input" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>

        <div className="tiny muted">
          Macros atuais: {item.macros.kcal} kcal · {item.macros.protein} g proteína · {item.macros.carbs} g carbo · {item.macros.fat} g gordura
        </div>
      </div>
    </Sheet>
  );
}

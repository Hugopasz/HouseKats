import { useCallback, useEffect, useState } from 'react';
import {
  addToBook, checkRecipe, cookRecipe, getBook, getCatalog, rateRecipe, removeFromBook,
  type BookRecipe, type CatalogRecipe, type CookCheck,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Confirm, Empty, Loading, Sheet } from '../components/ui';

/** Estrelinhas clicáveis. A nota entra no peso da lista de compras. */
function Stars({ value, onPick, size = 'md' }: { value: number; onPick?: (n: number) => void; size?: 'sm' | 'md' }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= value ? 'star--on' : ''} ${onPick ? 'star--tap' : ''}`}
          style={{ fontSize: size === 'sm' ? '.9rem' : undefined, cursor: onPick ? 'pointer' : 'default' }}
          onClick={onPick ? () => onPick(n) : undefined}
          role={onPick ? 'button' : undefined}
          aria-label={onPick ? `${n} estrelas` : undefined}
        >
          ⭐
        </span>
      ))}
    </span>
  );
}

export default function RecipeBook({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const { house, me, toast } = useApp();
  const [book, setBook] = useState<BookRecipe[] | null>(null);
  const [open, setOpen] = useState<BookRecipe | null>(null);
  const [browsing, setBrowsing] = useState(false);

  const load = useCallback(async () => {
    if (!house || !me) return;
    const b = await getBook(house.id, me.id);
    setBook(b);
    setOpen((cur) => (cur ? b.find((x) => x.hr_id === cur.hr_id) ?? null : null));
  }, [house, me]);

  useEffect(() => { load().catch(() => toast('Não deu para abrir o livro')); }, [load, toast]);

  if (!house || !me) return null;
  if (!book) return <Loading label="Abrindo o livro…" />;

  const comfort = book.filter((b) => b.comfort);
  const rest = book.filter((b) => !b.comfort);

  const rate = async (b: BookRecipe, stars: number) => {
    await rateRecipe(b.hr_id, me.id, stars);
    toast(`${stars} ⭐ em ${b.name}`);
    await load();
  };

  return (
    <div className="page stack-lg">
      <div className="row-between">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
        <span className="bold">Livro de receitas</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setBrowsing(true)}>＋</button>
      </div>

      {!book.length && (
        <Empty
          emoji="📖"
          title="Livro vazio"
          text="Aprove pratos na descoberta ou busque direto no catálogo."
          action={<button className="btn btn--primary" onClick={() => setBrowsing(true)}>Buscar receitas</button>}
        />
      )}

      {comfort.length > 0 && (
        <section className="stack">
          <div className="row-between">
            <div className="eyebrow">🏅 Pratos Conforto</div>
            <span className="tiny muted">{comfort.length} de 5</span>
          </div>
          {comfort.map((b) => <RecipeRow key={b.hr_id} b={b} onOpen={() => setOpen(b)} onRate={(n) => rate(b, n)} />)}
        </section>
      )}

      {rest.length > 0 && (
        <section className="stack">
          <div className="row-between">
            <div className="eyebrow">Aprovadas pela casa</div>
            <span className="tiny muted">{rest.length}</span>
          </div>
          {rest.map((b) => <RecipeRow key={b.hr_id} b={b} onOpen={() => setOpen(b)} onRate={(n) => rate(b, n)} />)}
        </section>
      )}

      {book.length > 0 && (
        <div className="tiny muted">
          Cozinhou 10 vezes? A receita ganha o selo 🏅 Prato Conforto. Só cabem 5, e o top se
          reorganiza sozinho conforme vocês cozinham.
        </div>
      )}

      <RecipeSheet
        recipe={open}
        onClose={() => setOpen(null)}
        onChanged={async () => { await load(); onChanged(); }}
        onRate={rate}
      />
      <CatalogSheet
        open={browsing}
        onClose={() => setBrowsing(false)}
        onChanged={async () => { await load(); onChanged(); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- linha
function RecipeRow({ b, onOpen, onRate }: { b: BookRecipe; onOpen: () => void; onRate: (n: number) => void }) {
  return (
    <div className={`card row ${b.comfort ? 'card--accent' : ''}`} style={{ padding: 12, gap: 10 }}>
      <button className="row grow" onClick={onOpen} style={{ textAlign: 'left', gap: 10, minWidth: 0 }}>
        <span style={{ fontSize: '1.8rem', flex: 'none' }}>{b.emoji}</span>
        <span className="grow" style={{ minWidth: 0 }}>
          <span className="bold small truncate" style={{ display: 'block' }}>{b.name}</span>
          <span className="tiny muted">
            {b.minutes} min · {b.kcal} kcal
            {b.times_cooked > 0 && ` · feito ${b.times_cooked}x`}
            {b.canCook ? ' · ✅ dá para fazer' : b.missing.length ? ` · faltam ${b.missing.length}` : ''}
          </span>
        </span>
      </button>
      <div style={{ flex: 'none', textAlign: 'right' }}>
        <Stars value={b.my_stars ?? 0} onPick={onRate} size="sm" />
        {b.avg_stars != null && <div className="tiny muted">casa {b.avg_stars}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- detalhe
function RecipeSheet({
  recipe, onClose, onChanged, onRate,
}: {
  recipe: BookRecipe | null;
  onClose: () => void;
  onChanged: () => void;
  onRate: (b: BookRecipe, n: number) => void;
}) {
  const { house, me, toast } = useApp();
  const [cooking, setCooking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [eaters, setEaters] = useState<number[]>([]);
  const [guests, setGuests] = useState(0);
  const [falta, setFalta] = useState<CookCheck | null>(null);

  // ao abrir, quem está usando o app já entra como quem vai comer
  useEffect(() => {
    if (recipe && me) { setEaters([me.id]); setGuests(0); }
  }, [recipe, me]);

  const naMesa = eaters.length + guests;

  // confere o estoque a cada mudança na mesa: aumentar o prato pode faltar
  useEffect(() => {
    if (!recipe || naMesa === 0) { setFalta(null); return; }
    let valeu = true;
    checkRecipe(recipe.hr_id, naMesa).then((c) => { if (valeu) setFalta(c); }).catch(() => {});
    return () => { valeu = false; };
  }, [recipe, naMesa]);

  if (!recipe || !house || !me) return null;

  const cook = async (deduct: boolean) => {
    setCooking(true);
    try {
      const res = await cookRecipe(recipe.hr_id, { member_id: me.id, deduct, eaters, guests });
      toast(
        res.comfort && res.times_cooked === 10
          ? `🏅 ${recipe.name} virou Prato Conforto!`
          : res.faltou.length
            ? `Feito ${res.times_cooked}x · faltou ${res.faltou.map((f) => f.name).join(', ')}`
            : `Feito ${res.times_cooked}x${res.deducted.length ? ` · ${res.deducted.length} ingredientes baixados` : ''}`
      );
      onChanged();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para registrar');
    } finally {
      setCooking(false);
    }
  };

  return (
    <>
      <Sheet
        open={!!recipe}
        onClose={onClose}
        title={`${recipe.emoji} ${recipe.name}`}
        subtitle={`${recipe.minutes} min · ${recipe.servings} porções`}
        footer={
          <>
            <button className="btn" disabled={cooking} onClick={() => cook(false)}>Só marcar</button>
            <button className="btn btn--primary grow" disabled={cooking} onClick={() => cook(true)}>
              👨‍🍳 Fiz e usei os ingredientes
            </button>
          </>
        }
      >
        <div className="stack-lg">
          {recipe.comfort && (
            <div className="card card--accent row">
              <span style={{ fontSize: '1.6rem' }}>🏅</span>
              <div className="grow small">
                <b>Prato Conforto</b> da casa · feito {recipe.times_cooked} vezes
              </div>
            </div>
          )}

          <div className="row-between">
            <span className="small muted">Sua nota</span>
            <Stars value={recipe.my_stars ?? 0} onPick={(n) => onRate(recipe, n)} />
          </div>
          {recipe.avg_stars != null && (
            <div className="tiny muted" style={{ marginTop: -12 }}>
              Média da casa: {recipe.avg_stars} ⭐ ({recipe.rating_count} {recipe.rating_count === 1 ? 'voto' : 'votos'})
            </div>
          )}

          <div className="hl-grid">
            <div className="hl"><span className="hl__ico">🔥</span><span className="hl__val">{recipe.kcal}</span><span className="hl__lbl">kcal/porção</span></div>
            <div className="hl"><span className="hl__ico">🥩</span><span className="hl__val">{recipe.protein} g</span><span className="hl__lbl">proteína</span></div>
          </div>

          <section className="stack" style={{ gap: 6 }}>
            <div className="eyebrow">Quem vai comer?</div>
            <div className="wrap">
              {house.members.filter((m) => !m.isPet).map((m) => (
                <button
                  key={m.id}
                  className={`chip ${eaters.includes(m.id) ? 'chip--on' : ''}`}
                  onClick={() => setEaters((c) => (c.includes(m.id) ? c.filter((x) => x !== m.id) : [...c, m.id]))}
                >
                  {m.emoji} {m.name}
                </button>
              ))}

              {/* visita não tem perfil: é só mais uma boca na mesa */}
              <button className="chip chip--soft" onClick={() => setGuests((g) => Math.min(20, g + 1))}>
                ＋ Visita
              </button>
              {guests > 0 && (
                <button className="chip chip--on" onClick={() => setGuests((g) => g - 1)}>
                  🍽️ {guests} {guests === 1 ? 'visita' : 'visitas'} ✕
                </button>
              )}
            </div>
            <div className="tiny muted">
              É assim que o prato entra nos seus nutrientes do dia e nos padrões da casa. Visita
              aumenta a receita, mas o prato dela não entra na conta de ninguém.
            </div>

            {naMesa > 0 && (
              <div className="card card--accent stack" style={{ gap: 4, padding: 12 }}>
                <div className="bold small">
                  Rende para {naMesa} {naMesa === 1 ? 'pessoa' : 'pessoas'}
                </div>
                <div className="tiny muted">
                  A receita original é de {recipe.servings}{' '}
                  {recipe.servings === 1 ? 'porção' : 'porções'}, então os ingredientes entram{' '}
                  <b>
                    {naMesa === recipe.servings
                      ? 'na medida da receita'
                      : `× ${(naMesa / recipe.servings).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}`}
                  </b>.
                </div>
                <div className="wrap" style={{ marginTop: 4 }}>
                  {recipe.ingredients.slice(0, 5).map((ing) => {
                    const escalado = (ing.qty * naMesa) / Math.max(1, recipe.servings);
                    return (
                      <span key={ing.name} className="chip tiny">
                        {ing.name} · {Math.round(escalado * 100) / 100} {ing.unit}
                      </span>
                    );
                  })}
                  {recipe.ingredients.length > 5 && (
                    <span className="chip tiny">+{recipe.ingredients.length - 5}</span>
                  )}
                </div>
              </div>
            )}

            {/* aviso ao vivo: aumentar a mesa pode fazer faltar o que antes bastava */}
            {falta && !falta.ok && (
              <div className="card stack" style={{ gap: 6, padding: 12, borderColor: 'var(--warn)' }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                  <span className="bold small grow">
                    Não dá para {naMesa} {naMesa === 1 ? 'pessoa' : 'pessoas'} com o que tem
                  </span>
                </div>
                {falta.faltando.map((f) => (
                  <div key={f.name} className="row tiny" style={{ gap: 6 }}>
                    <span className="grow truncate">{f.name}</span>
                    <span className="muted">
                      {f.motivo === 'nao-tem'
                        ? `precisa ${f.precisa} ${f.unit}, não tem`
                        : `precisa ${f.precisa} ${f.unit}, tem ${f.tem}`}
                    </span>
                  </div>
                ))}
                <div className="tiny muted">
                  Dá para fazer assim mesmo: o app baixa o que existe e não inventa o resto.
                </div>
              </div>
            )}

            {falta?.ok && naMesa > 0 && (
              <div className="tiny accent bold">✅ Tem tudo para {naMesa} {naMesa === 1 ? 'pessoa' : 'pessoas'}.</div>
            )}
          </section>

          <section className="stack" style={{ gap: 6 }}>
            <div className="eyebrow">Ingredientes</div>
            {recipe.ingredients.map((ing) => {
              // com a mesa montada vale a conta escalada; sem ela, a checagem por nome
              const curto = falta
                ? falta.faltando.some((f) => f.name === ing.name)
                : recipe.missing.includes(ing.name);
              const qtd = naMesa > 0
                ? Math.round((ing.qty * naMesa) / Math.max(1, recipe.servings) * 100) / 100
                : ing.qty;
              return (
                <div key={ing.name} className="row small">
                  <span style={{ width: 16 }}>{curto ? '⚠️' : '✓'}</span>
                  <span className={`grow ${curto ? 'muted' : ''}`}>{ing.name}</span>
                  <span className="tiny muted">{qtd} {ing.unit}</span>
                </div>
              );
            })}
            {naMesa > 0 && (
              <div className="tiny muted">Quantidades já ajustadas para quem vai comer.</div>
            )}
          </section>

          <section className="stack" style={{ gap: 6 }}>
            <div className="eyebrow">Modo de fazer</div>
            {recipe.steps.map((s, i) => (
              <div key={i} className="row small" style={{ alignItems: 'flex-start' }}>
                <span className="badge" style={{ flex: 'none' }}>{i + 1}</span>
                <span className="grow">{s}</span>
              </div>
            ))}
          </section>

          <button className="btn btn--danger btn--block" onClick={() => setConfirmRemove(true)}>
            Tirar do livro
          </button>
        </div>
      </Sheet>

      <Confirm
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Tirar ${recipe.name}?`}
        message="A receita sai do livro da casa e deixa de entrar na lista de compras."
        confirmLabel="Tirar"
        danger
        onConfirm={async () => {
          await removeFromBook(house.id, recipe.id);
          toast('Receita removida');
          onChanged();
          onClose();
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------- catálogo
function CatalogSheet({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const { house, me, toast } = useApp();
  const [q, setQ] = useState('');
  const [list, setList] = useState<CatalogRecipe[]>([]);

  useEffect(() => {
    if (!open || !house) return;
    const t = setTimeout(() => { getCatalog(house.id, q).then(setList).catch(() => {}); }, 200);
    return () => clearTimeout(t);
  }, [open, q, house]);

  if (!house || !me) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Catálogo de receitas" subtitle="Adicione direto ao livro da casa">
      <div className="stack">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Buscar prato" autoFocus />
        {list.map((rec) => (
          <div key={rec.id} className="card row" style={{ padding: 10, gap: 10 }}>
            <span style={{ fontSize: '1.5rem', flex: 'none' }}>{rec.emoji}</span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="bold small truncate">{rec.name}</div>
              <div className="tiny muted truncate">{rec.minutes} min · {rec.kcal} kcal · {rec.description}</div>
            </div>
            {rec.inBook ? (
              <span className="badge badge--ok" style={{ flex: 'none' }}>no livro</span>
            ) : (
              <button
                className="btn btn--soft btn--sm"
                style={{ flex: 'none' }}
                onClick={async () => {
                  await addToBook(house.id, rec.id, me.id);
                  toast(`${rec.name} no livro!`);
                  setList((l) => l.map((x) => (x.id === rec.id ? { ...x, inBook: true } : x)));
                  onChanged();
                }}
              >
                ＋
              </button>
            )}
          </div>
        ))}
        {!list.length && <div className="small muted center" style={{ padding: 20 }}>Nenhum prato encontrado.</div>}
      </div>
    </Sheet>
  );
}

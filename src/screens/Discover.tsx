import { useCallback, useEffect, useState } from 'react';
import { getDiscover, swipeRecipe, type DiscoverCard } from '../lib/api';
import { useApp } from '../lib/store';
import { Empty, Loading } from '../components/ui';

/**
 * Descoberta de receitas: uma leva de 10 pratos por dia, por integrante.
 * Curtiu, entra no livro da casa. Passou, some da sua fila para sempre.
 */
export default function Discover({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const { house, me, toast } = useApp();
  const [cards, setCards] = useState<DiscoverCard[] | null>(null);
  const [done, setDone] = useState(false);
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState<'like' | 'nope' | null>(null);
  const [liked, setLiked] = useState(0);

  const load = useCallback(async () => {
    if (!house || !me) return;
    const d = await getDiscover(house.id, me.id);
    setCards(d.cards);
    setDone(d.done);
    setI(0);
  }, [house, me]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar a descoberta')); }, [load, toast]);

  if (!house || !me) return null;
  if (!cards) return <Loading label="Separando os pratos do dia…" />;

  const card = cards[i];
  const total = cards.length;

  const decide = async (like: boolean) => {
    if (!card || leaving) return;
    setLeaving(like ? 'like' : 'nope');
    try {
      await swipeRecipe(house.id, { member_id: me.id, recipe_id: card.id, liked: like });
      if (like) setLiked((n) => n + 1);
    } catch {
      toast('Não deu para registrar');
    }
    setTimeout(() => {
      setLeaving(null);
      setI((n) => n + 1);
      if (like) onChanged();
    }, 220);
  };

  // ---- acabou a leva do dia
  if (done || (!card && total === 0)) {
    return (
      <div className="page stack-lg">
        <Header onBack={onBack} />
        <Empty
          emoji="🌙"
          title="Sua leva de hoje acabou"
          text="Cada integrante recebe 10 pratos por dia. Volte amanhã para a próxima rodada, ou adicione receitas direto pelo livro."
          action={<button className="btn btn--primary" onClick={onBack}>Voltar</button>}
        />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="page stack-lg">
        <Header onBack={onBack} />
        <Empty
          emoji="🎉"
          title={liked ? `${liked} ${liked === 1 ? 'prato aprovado' : 'pratos aprovados'}!` : 'Leva concluída'}
          text={liked ? 'Já estão no livro de receitas da casa.' : 'Nada te agradou hoje. Amanhã tem mais.'}
          action={<button className="btn btn--primary" onClick={onBack}>Ver o livro</button>}
        />
      </div>
    );
  }

  const missing = card.ingredients.length - card.haveCount;

  return (
    <div className="page stack-lg">
      <Header onBack={onBack} />

      <div className="row-between">
        <span className="eyebrow">Prato {i + 1} de {total}</span>
        <span className="tiny muted">{liked} aprovado{liked === 1 ? '' : 's'}</span>
      </div>
      <div className="bar">
        <div className="bar__fill" style={{ width: `${((i) / total) * 100}%` }} />
      </div>

      <div className={`card swipe-card ${leaving ? `swipe-card--${leaving}` : ''}`} key={card.id}>
        <div className="center" style={{ fontSize: '4rem', lineHeight: 1, margin: '6px 0 10px' }}>{card.emoji}</div>
        <h2 style={{ textAlign: 'center' }}>{card.name}</h2>
        <div className="small muted" style={{ textAlign: 'center', marginTop: 4 }}>{card.description}</div>

        <div className="wrap center" style={{ marginTop: 12 }}>
          <span className="chip">⏱️ {card.minutes} min</span>
          <span className="chip">🍽️ {card.servings} porções</span>
          <span className="chip">🔥 {card.kcal} kcal</span>
          <span className="chip">🥩 {card.protein} g</span>
        </div>

        <div className="divider" style={{ margin: '14px 0' }} />

        <div className="row-between">
          <span className="eyebrow">Ingredientes</span>
          <span className={`badge ${missing === 0 ? 'badge--ok' : missing <= 2 ? 'badge--warn' : ''}`}>
            {missing === 0 ? 'dá para fazer hoje' : `faltam ${missing}`}
          </span>
        </div>
        <div className="wrap" style={{ marginTop: 8 }}>
          {card.ingredients.map((ing) => (
            <span key={ing.name} className="chip tiny">{ing.name} · {ing.qty} {ing.unit}</span>
          ))}
        </div>

        {card.tags.length > 0 && (
          <div className="wrap" style={{ marginTop: 12 }}>
            {card.tags.map((t) => <span key={t} className="badge">{t}</span>)}
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 14 }}>
        <button className="btn btn--lg grow" onClick={() => decide(false)} disabled={!!leaving}>
          ✕ Passo
        </button>
        <button className="btn btn--primary btn--lg grow" onClick={() => decide(true)} disabled={!!leaving}>
          ❤️ Quero
        </button>
      </div>
      <div className="tiny muted center">Aprovou? Entra direto no livro de receitas da casa.</div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="row-between">
      <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
      <span className="bold">Descobrir receitas</span>
      <span style={{ width: 60 }} />
    </div>
  );
}

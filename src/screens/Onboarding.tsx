import { useCallback, useEffect, useState } from 'react';
import {
  addPantryItem, addToBook, createHouse, deletePantryItem, getCatalog, getPantry,
  discardDraft, getStarterItems, patchHouse, patchPantryItem, removeFromBook,
  type CatalogRecipe, type PantryItem, type StarterItem,
} from '../lib/api';
import { useApp } from '../lib/store';
import { bumpQty, fmtQty } from '../lib/units';
import { Avatar, Confirm, Field, SenhaField, Steps } from '../components/ui';
import MemberForm from '../components/MemberForm';
import DemoSheet from '../components/DemoSheet';
import AddItemSheet from '../components/AddItemSheet';

const HOUSE_EMOJIS = ['🏠', '🏡', '🏢', '🏰', '⛺', '🛖', '🐈', '🌻', '🍀', '🌈', '🚀', '🧿'];

/** No começo, cinco pratos bastam: o resto vem pela descoberta, no dia a dia. */
const MAX_RECEITAS_INICIAIS = 5;

/** Fluxo inicial: casa, geladeira, receitas, integrantes. Dá para ir e voltar. */
export default function Onboarding() {
  const { house } = useApp();
  if (!house) return <CreateHouse />;

  switch (house.onboarding_step) {
    // 'casa' com a casa já criada é o passo 1 revisitado, não uma casa nova
    case 'casa': return <EditHouseStep />;
    case 'geladeira': return <PantryStep />;
    case 'receitas': return <RecipesStep />;
    case 'integrantes': return <MembersStep />;
    default: return <CreateHouse />;
  }
}

/** Volta para o passo 1 sem criar outra casa: aqui só se edita a que já existe. */
function EditHouseStep() {
  const { house, refresh, toast } = useApp();
  const [name, setName] = useState(house?.name ?? '');
  const [emoji, setEmoji] = useState(house?.emoji ?? '🏠');
  const [busy, setBusy] = useState(false);

  const advance = async () => {
    setBusy(true);
    try {
      await patchHouse(house!.id, { name: name.trim() || house!.name, emoji, onboarding_step: 'geladeira' });
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para salvar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      step={0}
      emoji="🏠"
      title="Sua casa"
      subtitle="Dá para mudar o nome e o símbolo a qualquer momento."
    >
      <div className="card stack-lg">
        <div className="center">
          <Avatar emoji={emoji} size="xl" />
        </div>

        <Field label="Nome da casa">
          <input
            className="input input--big"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={28}
            autoFocus
          />
        </Field>

        <Field label="Símbolo da casa">
          <div className="grid-pick">
            {HOUSE_EMOJIS.map((e) => (
              <button key={e} type="button" className={`pick ${emoji === e ? 'pick--on' : ''}`} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </Field>

        <button className="btn btn--primary btn--lg btn--block" disabled={busy} onClick={advance}>
          {busy ? 'Salvando…' : 'Continuar'}
        </button>
      </div>
    </StepShell>
  );
}

// ---------------------------------------------------------------- 1. casa
function CreateHouse() {
  const { refresh, houses, toast } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [senha, setSenha] = useState('');

  const create = async () => {
    setBusy(true);
    try {
      const h = await createHouse(name.trim(), emoji, senha);
      await refresh(h.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para criar a casa');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page--flush stack-lg" style={{ paddingTop: 32 }}>
      <div className="center stack" style={{ flexDirection: 'column', gap: 6, textAlign: 'center' }}>
        <div style={{ fontSize: '3.6rem' }}>🐈‍⬛</div>
        <h1>House Kats</h1>
        <div className="muted">Gerenciador de Tarefinhas Adultas</div>
      </div>

      <div className="card stack-lg">
        <Steps total={4} current={0} />
        <div>
          <h2>Vamos criar sua casa</h2>
          <div className="small muted">Depois a gente enche o armário e chama a galera.</div>
        </div>

        <div className="center">
          <Avatar emoji={emoji} size="xl" />
        </div>

        <Field label="Nome da casa">
          <input
            className="input input--big"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Casa dos Gatos"
            maxLength={28}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && senha && create()}
          />
        </Field>

        <Field label="Símbolo da casa">
          <div className="grid-pick">
            {HOUSE_EMOJIS.map((e) => (
              <button key={e} type="button" className={`pick ${emoji === e ? 'pick--on' : ''}`} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </Field>

        <SenhaField
          value={senha}
          onChange={setSenha}
          hint="Criar e apagar casa pedem a senha. O resto do app não pede nada."
        />

        <button className="btn btn--primary btn--lg btn--block" disabled={!name.trim() || !senha || busy} onClick={create}>
          {busy ? 'Criando…' : 'Criar casa'}
        </button>
      </div>

      <button className="btn btn--ghost btn--block" onClick={() => setDemo(true)}>
        🧪 Ver o app com dados de exemplo
      </button>

      {houses.length > 0 && (
        <div className="tiny muted center">
          Você já tem {houses.length} casa{houses.length === 1 ? '' : 's'} cadastrada{houses.length === 1 ? '' : 's'}.
        </div>
      )}

      <DemoSheet open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}

// ---------------------------------------------------------------- moldura
function StepShell({
  step, emoji, title, subtitle, children, onSkip, onBack, skipLabel = 'Pular por enquanto',
}: {
  step: number;
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSkip?: () => void;
  onBack?: () => void;
  skipLabel?: string;
}) {
  const { house } = useApp();
  return (
    <div className="page page--flush stack-lg" style={{ paddingTop: 26 }}>
      <div className="row-between">
        <div className="row">
          <Avatar emoji={house?.emoji ?? '🏠'} size="sm" />
          <span className="bold truncate">{house?.name}</span>
        </div>
        <span className="tiny muted">passo {step + 1} de 4</span>
      </div>

      {onBack && (
        <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
          ‹ Voltar
        </button>
      )}

      <Steps total={4} current={step} />

      <div>
        <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{emoji}</div>
        <h1 style={{ marginTop: 8 }}>{title}</h1>
        <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div>
      </div>

      {children}

      {onSkip && (
        <button className="btn btn--ghost btn--block" onClick={onSkip}>{skipLabel}</button>
      )}

      <DiscardDraft />
    </div>
  );
}

/**
 * A casa em criação some se for abandonada. Enquanto o onboarding não termina,
 * ela não conta como casa: não aparece na lista nem na troca de usuário.
 */
function DiscardDraft() {
  const { houses, refresh, openHouse, toast } = useApp();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button
        className="btn btn--ghost btn--block tiny"
        style={{ minHeight: 36 }}
        onClick={() => setConfirmando(true)}
      >
        Descartar esta casa
      </button>

      <Confirm
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Descartar a casa?"
        message="Ela ainda não foi finalizada, então nada dela fica salvo: some o nome, o que você pôs no armário e as receitas escolhidas."
        confirmLabel="Descartar"
        danger
        onConfirm={async () => {
          await discardDraft();
          // sem casas prontas, o app volta para a tela de criar do zero
          if (houses.length) await refresh(houses[0].id);
          else await openHouse(null);
          toast('Casa descartada');
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------- 2. geladeira
function PantryStep() {
  const { house, refresh, toast } = useApp();
  const [starter, setStarter] = useState<StarterItem[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState(false);

  const go = async (step: string) => {
    await patchHouse(house!.id, { onboarding_step: step });
    await refresh();
  };

  const load = useCallback(async () => {
    if (!house) return;
    setPantry(await getPantry(house.id));
  }, [house]);

  useEffect(() => {
    getStarterItems().then(setStarter).catch(() => {});
    load().catch(() => {});
  }, [load]);

  // um toque adiciona o básico com a quantidade sugerida
  const quickAdd = async (it: StarterItem) => {
    if (!house) return;
    setBusy(it.name);
    try {
      await addPantryItem(house.id, {
        name: it.name, qty: it.qty, unit: it.unit, category: it.category,
        origin: 'ajuste', loggedBy: null,
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para adicionar');
    } finally {
      setBusy(null);
    }
  };

  // ajusta a porção direto na lista, sem reabrir o modal
  const changeQty = async (it: PantryItem, dir: 1 | -1) => {
    const next = bumpQty(it.qty, it.unit, dir);
    setPantry((p) => p.map((x) => (x.id === it.id ? { ...x, qty: next } : x)));
    try {
      if (next <= 0) await deletePantryItem(it.id);
      else await patchPantryItem(it.id, { qty: next });
      await load();
    } catch {
      await load();
    }
  };

  const jaTem = new Set(pantry.map((p) => p.name.toLowerCase()));

  return (
    <StepShell
      step={1}
      emoji="🧊"
      title="O que já tem no armário?"
      subtitle="Toque no que existe na sua casa hoje. É daqui que saem as refeições disponíveis, a lista de compras e os alertas de validade."
      onSkip={() => go('receitas')}
      skipLabel={pantry.length ? 'Continuar depois' : 'Pular por enquanto'}
      onBack={() => go('casa')}
    >
      <div className="stack">
        <div className="row-between">
          <span className="eyebrow">Básicos da despensa</span>
          <span className="tiny muted">{pantry.length} no armário</span>
        </div>

        <div className="wrap">
          {starter.map((it) => {
            const dentro = jaTem.has(it.name.toLowerCase());
            return (
              <button
                key={it.name}
                className={`chip ${dentro ? 'chip--on' : ''}`}
                disabled={busy === it.name || dentro}
                onClick={() => quickAdd(it)}
              >
                {it.emoji} {it.name} {dentro ? '✓' : `+${it.qty}${it.unit === 'un' ? '' : it.unit}`}
              </button>
            );
          })}
        </div>

        <button className="btn btn--soft btn--block" onClick={() => setDetail(true)}>
          ➕ Outro item, com quantidade e preço
        </button>
      </div>

      {pantry.length > 0 && (
        <div className="card card--flat stack" style={{ gap: 6 }}>
          <div className="row-between">
            <span className="eyebrow">Já cadastrado</span>
            <span className="tiny muted">ajuste a porção no − e +</span>
          </div>
          {pantry.map((it) => (
            <div key={it.id} className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: '1.2rem', flex: 'none' }}>{it.emoji}</span>
              <span className="grow small truncate">{it.name}</span>
              <div className="row" style={{ gap: 4, flex: 'none' }}>
                <button
                  className="btn btn--sm"
                  onClick={() => changeQty(it, -1)}
                  aria-label={`Menos ${it.name}`}
                >
                  −
                </button>
                <span className="tiny bold" style={{ minWidth: 62, textAlign: 'center' }}>
                  {fmtQty(it.qty)} {it.unit}
                </span>
                <button
                  className="btn btn--sm btn--soft"
                  onClick={() => changeQty(it, 1)}
                  aria-label={`Mais ${it.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <div className="tiny muted">Zerando a quantidade, o item sai da lista.</div>
        </div>
      )}

      <button
        className="btn btn--primary btn--lg btn--block"
        disabled={!pantry.length}
        onClick={() => go('receitas')}
      >
        {pantry.length ? `Continuar com ${pantry.length} ${pantry.length === 1 ? 'item' : 'itens'}` : 'Adicione ao menos um item'}
      </button>

      <AddItemSheet open={detail} onClose={() => setDetail(false)} onSaved={load} />
    </StepShell>
  );
}

// ---------------------------------------------------------------- 3. receitas
function RecipesStep() {
  const { house, refresh, toast } = useApp();
  const [catalog, setCatalog] = useState<CatalogRecipe[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const go = async (step: string) => {
    await patchHouse(house!.id, { onboarding_step: step });
    await refresh();
  };

  const load = useCallback(async () => {
    if (!house) return;
    setCatalog(await getCatalog(house.id, q));
  }, [house, q]);

  useEffect(() => {
    const t = setTimeout(() => { load().catch(() => {}); }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const escolhidas = catalog.filter((c) => c.inBook).length;
  const cheio = escolhidas >= MAX_RECEITAS_INICIAIS;

  const toggle = async (rec: CatalogRecipe) => {
    if (!house) return;
    if (!rec.inBook && cheio) {
      toast(`Só ${MAX_RECEITAS_INICIAIS} para começar. Tire uma para trocar.`);
      return;
    }
    setBusy(rec.id);
    try {
      if (rec.inBook) await removeFromBook(house.id, rec.id);
      else await addToBook(house.id, rec.id, null);
      setCatalog((c) => c.map((x) => (x.id === rec.id ? { ...x, inBook: !x.inBook } : x)));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para salvar');
    } finally {
      setBusy(null);
    }
  };

  return (
    <StepShell
      step={2}
      emoji="📖"
      title="Receitas pré-aprovadas"
      subtitle="Marque os pratos que já fazem parte da sua casa. São eles que alimentam a lista de compras e o cálculo de refeições."
      onSkip={() => go('integrantes')}
      skipLabel={escolhidas ? 'Continuar depois' : 'Pular por enquanto'}
      onBack={() => go('geladeira')}
    >
      <div className="stack">
        <div className="row-between">
          <span className="eyebrow">Catálogo</span>
          <span className={`tiny bold ${cheio ? 'accent' : 'muted'}`}>
            {escolhidas} de {MAX_RECEITAS_INICIAIS}
          </span>
        </div>

        <div className="bar">
          <div className="bar__fill" style={{ width: `${(escolhidas / MAX_RECEITAS_INICIAIS) * 100}%` }} />
        </div>

        {cheio && (
          <div className="card card--accent small">
            Cinco já dão conta do começo. Para trocar, tire uma antes de marcar outra.
          </div>
        )}

        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Buscar prato" />

        <div className="stack scroll-y" style={{ gap: 8, maxHeight: '42vh' }}>
          {catalog.map((rec) => {
            const bloqueado = cheio && !rec.inBook;
            return (
              <button
                key={rec.id}
                className={`card row card--tap ${rec.inBook ? 'card--accent' : ''}`}
                style={{ padding: 10, gap: 10, opacity: bloqueado ? 0.4 : 1 }}
                disabled={busy === rec.id}
                onClick={() => toggle(rec)}
              >
                <span className={`check ${rec.inBook ? 'check--on' : ''}`}>{rec.inBook ? '✓' : ''}</span>
                <span style={{ fontSize: '1.4rem', flex: 'none' }}>{rec.emoji}</span>
                <span className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                  <span className="bold small truncate" style={{ display: 'block' }}>{rec.name}</span>
                  <span className="tiny muted">{rec.minutes} min · {rec.kcal} kcal · {rec.description}</span>
                </span>
              </button>
            );
          })}
          {!catalog.length && (
            <div className="small muted center" style={{ padding: 20 }}>Nenhum prato encontrado.</div>
          )}
        </div>

        <div className="tiny muted">
          Comece com cinco. Depois cada integrante recebe uma leva de 10 pratos por dia na descoberta,
          e o livro cresce sozinho.
        </div>
      </div>

      <button
        className="btn btn--primary btn--lg btn--block"
        disabled={!escolhidas}
        onClick={() => go('integrantes')}
      >
        {escolhidas ? `Continuar com ${escolhidas} ${escolhidas === 1 ? 'receita' : 'receitas'}` : 'Escolha ao menos uma receita'}
      </button>
    </StepShell>
  );
}

// ---------------------------------------------------------------- 4. integrantes
function MembersStep() {
  const { house, refresh, toast } = useApp();
  const [adding, setAdding] = useState(!house?.members.length);

  const go = async (step: string) => {
    await patchHouse(house!.id, { onboarding_step: step });
    await refresh();
  };
  const finish = () => go('done');

  if (adding) {
    return (
      <StepShell
        step={3}
        emoji="🐱"
        title={house?.members.length ? 'Mais um integrante' : 'Quem mora aqui?'}
        subtitle="Cada pessoa faz o seu próprio cadastro: nome, cara, cor e metas."
        // sem onBack aqui: quem navega para trás é o próprio formulário, que
        // primeiro desfaz seus 3 passos internos. Dois "Voltar" na mesma tela
        // confundem, e o de cima ganharia o clique.
      >
        <div className="card">
          <MemberForm
            lockKind={!house?.members.length}
            houseId={house!.id}
            onDone={async (m) => {
              await refresh();
              setAdding(false);
              toast(`${m.emoji} ${m.name} entrou na casa!`);
            }}
            onCancel={house?.members.length ? () => setAdding(false) : undefined}
            onBackFromStart={() => go('receitas')}
          />
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell
      step={3}
      emoji="👨‍👩‍👧"
      title="A casa está montada"
      subtitle="Adicione todo mundo agora ou depois, na tela de escolher usuário."
      onBack={() => go('receitas')}
    >
      <div className="stack">
        {house!.members.map((m) => (
          <div key={m.id} className="card row" style={{ padding: 12 }}>
            <Avatar member={m} size="md" />
            <div className="grow">
              <div className="bold">{m.name}</div>
              <div className="tiny muted truncate">{m.title}</div>
            </div>
            <span className="badge">{m.dietLabel}</span>
          </div>
        ))}

        <button className="btn btn--soft btn--block" onClick={() => setAdding(true)}>
          ➕ Adicionar outro integrante
        </button>
        <button className="btn btn--primary btn--lg btn--block" onClick={finish}>
          Tudo pronto, bora!
        </button>
      </div>
    </StepShell>
  );
}

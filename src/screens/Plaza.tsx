import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buyPlazaItem, getBook, getPlaza, setPlazaBackground, throwTreat,
  type BookRecipe, type Plaza as PlazaData,
} from '../lib/api';
import { useApp } from '../lib/store';
import { Empty, Loading, Sheet } from '../components/ui';

/** Cada bichinho anda sozinho pela praça, num passeio sem pressa. */
type Andarilho = {
  id: number;
  emoji: string;
  name: string;
  x: number; y: number;      // posição atual, em %
  alvoX: number; alvoY: number;
  fala: string | null;
  falaAte: number;
  animo: number;
  kind: string;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Ritmo das falas. Só um balão por vez, e com pausa entre eles: a praça é para
 * observar de canto de olho, não para acompanhar legenda de filme.
 */
const PAUSA_ENTRE_FALAS = 11000;  // de quanto em quanto tenta uma fala nova
const DURACAO_FALA = 6000;        // quanto tempo o balão fica na tela

export default function Plaza() {
  const { house, me, toast } = useApp();
  const [dados, setDados] = useState<PlazaData | null>(null);
  const [loja, setLoja] = useState(false);
  const [petiscos, setPetiscos] = useState(false);
  const [book, setBook] = useState<BookRecipe[]>([]);
  const [voando, setVoando] = useState<{ emoji: string; id: number } | null>(null);
  const [reacoes, setReacoes] = useState<{ nome: string; emoji: string; fala: string }[] | null>(null);

  const load = useCallback(async () => {
    if (!house) return;
    setDados(await getPlaza(house.id));
  }, [house]);

  useEffect(() => {
    load().catch(() => toast('Não deu para abrir a praça'));
    if (house && me) getBook(house.id, me.id).then(setBook).catch(() => {});
  }, [load, toast, house, me]);

  // atualiza o clima e as falas de tempos em tempos
  useEffect(() => {
    const t = setInterval(() => { load().catch(() => {}); }, 45000);
    return () => clearInterval(t);
  }, [load]);

  if (!house || !me) return null;
  if (!dados) return <Loading label="Abrindo a praça…" />;

  const jogarPetisco = async (recipeId: number | null, label: string, emoji: string) => {
    setVoando({ emoji, id: Date.now() });
    setPetiscos(false);
    try {
      const r = await throwTreat(house.id, { member_id: me.id, recipe_id: recipeId, label, emoji });
      setTimeout(() => {
        setReacoes(r.reacoes.map((x) => ({ nome: x.member.name, emoji: x.member.emoji, fala: x.fala })));
        setVoando(null);
      }, 900);
      await load();
    } catch {
      setVoando(null);
      toast('Não deu para jogar o petisco');
    }
  };

  return (
    <div className="page stack-lg">
      <div className="row">
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="eyebrow">🏞️ Praça</div>
          <h1 className="truncate" style={{ fontSize: '2rem' }}>{house.name}</h1>
          <div className="tiny muted">{dados.climaDaCasa.emoji} {dados.climaDaCasa.texto}</div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div className="bold" style={{ fontSize: '1.2rem' }}>🪙 {dados.cofre}</div>
          <div className="tiny muted">no cofre</div>
        </div>
      </div>

      {/* ------------------------------------------------ o mapa */}
      <PracaMapa dados={dados} voando={voando} />

      <div className="row">
        <button className="btn btn--primary grow" onClick={() => setPetiscos(true)}>🍪 Jogar petisco</button>
        <button className="btn grow" onClick={() => setLoja(true)}>🛍️ Loja</button>
      </div>

      {/* ------------------------------------------------ sugestão de carinho */}
      {dados.sugestao && (
        <div className="card card--accent stack">
          <div className="row">
            <span style={{ fontSize: '1.8rem' }}>{dados.sugestao.member.emoji}</span>
            <div className="grow">
              <div className="bold small">{dados.sugestao.texto}</div>
              {dados.sugestao.humorLabel && (
                <div className="tiny muted">
                  Está {dados.sugestao.humorLabel} hoje {dados.sugestao.humor}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ quem está por aqui */}
      <section className="stack">
        <div className="eyebrow">Quem está na praça</div>
        {dados.bichinhos.map((b) => (
          <div key={b.id} className="card row" style={{ padding: 12 }}>
            <span style={{ fontSize: '1.8rem', flex: 'none' }}>{b.emoji}</span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="bold small truncate">
                {b.name}
                {b.kind === 'pet' && <span className="badge" style={{ marginLeft: 6 }}>🐾 pet</span>}
                {b.temporary && <span className="badge badge--warn" style={{ marginLeft: 6 }}>visita</span>}
              </div>
              <div className="tiny muted">
                {b.humor ? `${b.humor} ${b.humorLabel} · ` : ''}
                {b.estado}
                {b.kind !== 'pet' && b.streak > 0 ? ` · ${b.streak}d de streak` : ''}
              </div>
            </div>
            {b.kind !== 'pet' && <span className="tiny muted">🪙 {b.coins}</span>}
          </div>
        ))}
      </section>

      {/* ------------------------------------------------ últimos petiscos */}
      {dados.treats.length > 0 && (
        <section className="stack">
          <div className="eyebrow">Petiscos recentes</div>
          <div className="card card--flat wrap">
            {dados.treats.map((t) => (
              <span key={t.id} className="chip tiny">{t.emoji} {t.label}</span>
            ))}
          </div>
        </section>
      )}

      <div className="tiny muted">
        Os bichinhos não têm necessidades e nada aqui pode dar errado. A praça só mostra como a
        casa está. Petiscos são carinho: não saem do armário.
      </div>

      {/* ------------------------------------------------ loja */}
      <Sheet open={loja} onClose={() => setLoja(false)} title="Loja da praça" subtitle={`🪙 ${dados.cofre} no cofre`}>
        <div className="stack">
          <div className="small muted">
            As moedas vêm de comer direito, bater a meta de água e fazer tarefas. O cofre é de
            todo mundo.
          </div>

          {/* --------------------------------------- fundo da praça */}
          <div className="eyebrow" style={{ marginTop: 4 }}>Fundo da praça</div>
          <div className="tiny muted">
            Depois de comprar, dá para trocar quando quiser sem pagar de novo.
          </div>
          <div className="fundos">
            {dados.fundos.map((f) => (
              <button
                key={f.key}
                className={`fundo ${f.ativo ? 'fundo--on' : ''}`}
                disabled={!f.comprado && dados.cofre < f.preco}
                onClick={async () => {
                  try {
                    const r = f.comprado
                      ? await setPlazaBackground(house.id, f.key)
                      : await buyPlazaItem(house.id, me.id, f.key);
                    setDados(r.praca);
                    toast(f.comprado ? `Praça de ${f.label} ${f.emoji}` : `${f.emoji} ${f.label} comprado!`);
                  } catch (e) {
                    toast(e instanceof Error ? e.message : 'Não deu para trocar o fundo');
                  }
                }}
              >
                <span
                  className="fundo__amostra"
                  style={{
                    ['--praca-chao' as string]: f.chao,
                    ['--praca-piso' as string]: f.piso,
                  }}
                />
                <span className="fundo__nome">{f.emoji} {f.label}</span>
                <span className="tiny muted">
                  {f.ativo ? 'em uso' : f.comprado ? 'usar' : `🪙 ${f.preco}`}
                </span>
              </button>
            ))}
          </div>

          <div className="eyebrow" style={{ marginTop: 12 }}>Enfeites</div>
          {dados.catalogo.map((c) => (
            <div key={c.key} className={`card row ${c.comprado ? 'card--accent' : ''}`} style={{ padding: 12 }}>
              <span style={{ fontSize: '1.8rem', flex: 'none' }}>{c.emoji}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="bold small">{c.label}</div>
                <div className="tiny muted">{c.dica}</div>
              </div>
              {c.comprado ? (
                <span className="badge badge--ok">na praça</span>
              ) : (
                <button
                  className="btn btn--sm btn--soft"
                  disabled={dados.cofre < c.preco}
                  onClick={async () => {
                    try {
                      const r = await buyPlazaItem(house.id, me.id, c.key);
                      setDados(r.praca);
                      toast(`${c.emoji} ${c.label} na praça!`);
                    } catch (e) {
                      toast(e instanceof Error ? e.message : 'Não deu para comprar');
                    }
                  }}
                >
                  🪙 {c.preco}
                </button>
              )}
            </div>
          ))}
        </div>
      </Sheet>

      {/* ------------------------------------------------ petiscos */}
      <Sheet open={petiscos} onClose={() => setPetiscos(false)} title="Jogar petisco" subtitle="Só diversão, não sai do armário">
        <div className="stack">
          <div className="wrap">
            {['🍪', '🍎', '🧀', '🍖', '🍓', '🥕'].map((e) => (
              <button key={e} className="btn" onClick={() => jogarPetisco(null, 'Petisco', e)}>
                {e}
              </button>
            ))}
          </div>

          {book.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginTop: 8 }}>Ou um prato do livro</div>
              <div className="tiny muted">A reação de cada um segue a nota que deu para o prato.</div>
              <div className="stack" style={{ gap: 6, maxHeight: '38vh', overflowY: 'auto' }}>
                {book.map((r) => (
                  <button
                    key={r.hr_id}
                    className="card row card--tap"
                    style={{ padding: 10 }}
                    onClick={() => jogarPetisco(r.id, r.name, r.emoji)}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{r.emoji}</span>
                    <span className="grow small bold truncate" style={{ textAlign: 'left' }}>{r.name}</span>
                    {r.avg_stars != null && <span className="tiny muted">{r.avg_stars} ⭐</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>

      {/* ------------------------------------------------ reações */}
      <Sheet open={!!reacoes} onClose={() => setReacoes(null)} title="E eles disseram…">
        <div className="stack">
          {reacoes?.map((r, i) => (
            <div key={i} className="card row" style={{ padding: 12 }}>
              <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
              <div className="grow">
                <div className="tiny muted">{r.nome}</div>
                <div className="bold small">“{r.fala}”</div>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------- o mapa
/**
 * Os bichinhos andam devagar por conta própria e param para falar. Tudo em
 * porcentagem do tamanho do mapa, então funciona em qualquer tela.
 */
function PracaMapa({ dados, voando }: { dados: PlazaData; voando: { emoji: string; id: number } | null }) {
  const [andarilhos, setAndarilhos] = useState<Andarilho[]>([]);
  const falasRef = useRef(dados.conversas);
  falasRef.current = dados.conversas;

  // (re)cria os andarilhos quando a lista de bichinhos muda
  const chave = useMemo(() => dados.bichinhos.map((b) => b.id).join(','), [dados.bichinhos]);
  useEffect(() => {
    setAndarilhos((antes) => dados.bichinhos.map((b) => {
      const velho = antes.find((a) => a.id === b.id);
      return velho ? { ...velho, emoji: b.emoji, animo: b.animo, kind: b.kind } : {
        id: b.id, emoji: b.emoji, name: b.name, kind: b.kind, animo: b.animo,
        x: rand(12, 82), y: rand(28, 76),
        alvoX: rand(12, 82), alvoY: rand(28, 76),
        fala: null, falaAte: 0,
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  // passeio: um passo a cada tique, com destino novo ao chegar
  useEffect(() => {
    const t = setInterval(() => {
      setAndarilhos((atual) => atual.map((a) => {
        const dx = a.alvoX - a.x;
        const dy = a.alvoY - a.y;
        const dist = Math.hypot(dx, dy);
        // quem está animado anda mais rápido
        const passo = 0.5 + Math.max(0, a.animo) * 0.25;

        if (dist < 1.5) {
          return { ...a, alvoX: rand(10, 84), alvoY: rand(26, 78) };
        }
        return { ...a, x: a.x + (dx / dist) * passo, y: a.y + (dy / dist) * passo };
      }));
    }, 260);
    return () => clearInterval(t);
  }, []);

  // de vez em quando alguém fala, um por vez, com silêncio entre uma e outra
  useEffect(() => {
    const t = setInterval(() => {
      const falas = falasRef.current;
      if (!falas.length) return;
      setAndarilhos((atual) => {
        if (!atual.length) return atual;
        // enquanto alguém está falando, ninguém interrompe
        if (atual.some((a) => a.fala)) return atual;

        const fala = falas[Math.floor(Math.random() * falas.length)];
        const alvo = fala.de != null
          ? atual.find((a) => a.id === fala.de)
          : atual[Math.floor(Math.random() * atual.length)];
        if (!alvo) return atual;
        return atual.map((a) => (a.id === alvo.id
          ? { ...a, fala: fala.texto, falaAte: Date.now() + DURACAO_FALA }
          : a));
      });
    }, PAUSA_ENTRE_FALAS);
    return () => clearInterval(t);
  }, []);

  // apaga o balão quando o tempo passa
  useEffect(() => {
    const t = setInterval(() => {
      setAndarilhos((atual) => atual.map((a) => (a.fala && Date.now() > a.falaAte ? { ...a, fala: null } : a)));
    }, 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="praca"
      style={{
        ['--praca-chao' as string]: dados.fundo.chao,
        ['--praca-piso' as string]: dados.fundo.piso,
      }}
    >
      {/* enfeites comprados */}
      {dados.itens.map((it) => (
        <span key={it.id} className="praca__item" style={{ left: `${it.x}%`, top: `${it.y}%` }} title={it.label}>
          {it.emoji}
        </span>
      ))}

      {/* petisco caindo */}
      {voando && <span key={voando.id} className="praca__treat">{voando.emoji}</span>}

      {/* os bichinhos */}
      {andarilhos.map((a) => (
        <span
          key={a.id}
          className={`praca__bicho ${a.animo <= -1 ? 'praca__bicho--triste' : ''}`}
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          {a.fala && <span className="praca__balao">{a.fala}</span>}
          <span className="praca__emoji">{a.emoji}</span>
          <span className="praca__nome">{a.name}</span>
        </span>
      ))}

      {!dados.bichinhos.length && (
        <div className="praca__vazia">
          <Empty emoji="🏞️" title="Praça vazia" text="Adicione integrantes para eles aparecerem aqui." />
        </div>
      )}
    </div>
  );
}

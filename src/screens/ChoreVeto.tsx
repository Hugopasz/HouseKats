import { useCallback, useEffect, useState } from 'react';
import { getChores, getVetos, setVeto, type Chore, type Veto } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Loading } from '../components/ui';

/**
 * Último passo antes de liberar as Tarefinhas: cada pessoa marca a tarefa que
 * não faz de jeito nenhum. Ela sai da fila dessa pessoa e vira obrigação do
 * resto da casa. Duas pessoas não podem escolher a mesma, vale quem chegou antes.
 */
export default function ChoreVeto({ onDone, onBack }: { onDone: () => void; onBack?: () => void }) {
  const { house, me, toast } = useApp();
  const [chores, setChores] = useState<Chore[] | null>(null);
  const [vetos, setVetos] = useState<Veto[]>([]);
  const [tomadas, setTomadas] = useState<number[]>([]);
  const [faltam, setFaltam] = useState<{ id: number; name: string; emoji: string }[]>([]);
  const [todos, setTodos] = useState(false);
  const [salvando, setSalvando] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!house || !me) return;
    const [cs, vs] = await Promise.all([getChores(house.id, me.id), getVetos(house.id)]);
    setChores(cs.filter((c) => !c.is_special));
    setVetos(vs.vetos);
    setTomadas(vs.tomadas);
    setFaltam(vs.faltam);
    setTodos(vs.todosEscolheram);
  }, [house, me]);

  useEffect(() => { load().catch(() => toast('Não deu para carregar')); }, [load, toast]);

  if (!house || !me) return null;
  if (!chores) return <Loading label="Listando as tarefas…" />;

  const meuVeto = vetos.find((v) => v.member_id === me.id);

  const escolher = async (c: Chore) => {
    setSalvando(c.id);
    try {
      await setVeto(house.id, me.id, c.id);
      toast(`Combinado: você não faz ${c.name}`);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para escolher');
    } finally {
      setSalvando(null);
    }
  };

  return (
    <div className="page stack-lg">
      {onBack && (
        <div className="row-between">
          <button className="btn btn--ghost btn--sm" onClick={onBack}>‹ Voltar</button>
          <span className="tiny muted">último passo</span>
        </div>
      )}

      <div>
        <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>🙅</div>
        <h1 style={{ marginTop: 8 }}>Qual tarefa você não faz?</h1>
        <div className="muted" style={{ marginTop: 4 }}>
          Escolha uma que você detesta. Ela some da sua fila para sempre e passa a ser dos outros.
          Em troca, você herda o que os outros vetarem.
        </div>
      </div>

      {/* ------------------------------------------------ quem já escolheu */}
      {vetos.length > 0 && (
        <div className="card card--flat stack" style={{ gap: 8 }}>
          <div className="eyebrow">Já escolheram</div>
          {vetos.map((v) => (
            <div key={v.id} className="row">
              <Avatar emoji={v.member_emoji} size="sm" color={v.member_id === me.id ? 'var(--ac)' : 'var(--line-2)'} />
              <span className="grow small">
                <b>{v.member_name}</b> não faz {v.chore_emoji} {v.chore_name}
              </span>
            </div>
          ))}
        </div>
      )}

      {meuVeto ? (
        <div className="card card--accent stack">
          <div className="row">
            <span style={{ fontSize: '1.8rem' }}>{meuVeto.chore_emoji}</span>
            <div className="grow">
              <div className="bold">Você não faz {meuVeto.chore_name}</div>
              <div className="tiny muted">Some da sua fila. Toque em outra abaixo para trocar.</div>
            </div>
          </div>
          {todos ? (
            <button className="btn btn--primary btn--block" onClick={onDone}>
              Todo mundo escolheu, bora!
            </button>
          ) : (
            <div className="small muted">
              Falta {faltam.map((f) => f.name).join(', ')} escolher. As Tarefinhas liberam quando todos marcarem.
            </div>
          )}
        </div>
      ) : (
        <div className="card stack" style={{ gap: 6 }}>
          <div className="bold small">Escolha a sua</div>
          <div className="tiny muted">
            As riscadas já foram pegas por outra pessoa. Vale a ordem de chegada.
          </div>
        </div>
      )}

      {/* ------------------------------------------------ lista */}
      <section className="stack" style={{ gap: 8 }}>
        {chores.map((c) => {
          const tomadaPorOutro = tomadas.includes(c.id) && meuVeto?.chore_id !== c.id;
          const minha = meuVeto?.chore_id === c.id;
          const dono = vetos.find((v) => v.chore_id === c.id);
          return (
            <button
              key={c.id}
              className={`card row card--tap ${minha ? 'card--accent' : ''}`}
              style={{ padding: 12, gap: 10, opacity: tomadaPorOutro ? 0.45 : 1 }}
              disabled={tomadaPorOutro || salvando === c.id}
              onClick={() => escolher(c)}
            >
              <span style={{ fontSize: '1.5rem', flex: 'none' }}>{c.emoji}</span>
              <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                <div className={`bold small truncate ${tomadaPorOutro ? 'muted' : ''}`}>
                  {c.name}
                </div>
                <div className="tiny muted">
                  {c.room_name ? `${c.room_emoji} ${c.room_name} · ` : ''}{c.minutes} min · {c.stars} ⭐
                  {tomadaPorOutro && dono ? ` · já é de ${dono.member_name}` : ''}
                </div>
              </div>
              {minha && <span className="badge">sua</span>}
            </button>
          );
        })}
      </section>
    </div>
  );
}

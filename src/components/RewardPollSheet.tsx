import { useCallback, useEffect, useState } from 'react';
import { createRewardPoll, getRewardPoll, voteReward, type RewardPoll } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Field, Sheet } from './ui';

/**
 * A recompensa do mês sai de votação: quem abre propõe três opções e a casa
 * escolhe. Empatou, ganha quem tem crédito guardado de um desempate anterior,
 * e o outro lado leva o crédito para a próxima vez.
 */
export function useRewardPoll() {
  const { house, me } = useApp();
  const [poll, setPoll] = useState<RewardPoll | null>(null);
  const [aberto, setAberto] = useState(false);
  const [avisado, setAvisado] = useState(false);

  const load = useCallback(async () => {
    if (!house || !me) return null;
    const p = await getRewardPoll(house.id, me.id);
    setPoll(p);
    return p;
  }, [house, me]);

  useEffect(() => {
    setAvisado(false);
    load().then((p) => {
      // votação aberta e você ainda não votou: o app chama na hora que entra
      if (p && p.status === 'aberta' && p.myVote === null) setAberto(true);
    }).catch(() => {});
  }, [load]);

  return { poll, aberto, setAberto, reload: load, avisado, setAvisado };
}

export default function RewardPollSheet({
  poll, open, onClose, onChanged,
}: {
  poll: RewardPoll | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { me, toast } = useApp();
  const [votando, setVotando] = useState<number | null>(null);

  if (!poll || !me) return null;
  const encerrada = poll.status === 'fechada';

  const votar = async (optionId: number) => {
    setVotando(optionId);
    try {
      const r = await voteReward(poll.id, me.id, optionId);
      toast(r.encerrada ? 'Votação encerrada! 🎁' : 'Voto registrado 🗳️');
      onChanged();
      if (r.encerrada) onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para votar');
    } finally {
      setVotando(null);
    }
  };

  const maisVotos = Math.max(1, ...poll.options.map((o) => o.votes));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={encerrada ? 'Resultado da votação' : 'Recompensa do mês'}
      subtitle={encerrada ? 'A casa decidiu' : 'Vote na que você quer'}
    >
      <div className="stack-lg">
        {encerrada ? (
          <div className="card card--accent stack center" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.6rem' }}>🎁</div>
            <div className="bold">{poll.winner}</div>
            <div className="tiny muted">É essa que vale este mês.</div>
          </div>
        ) : (
          <div className="stack">
            {poll.options.map((o) => {
              const meu = poll.myVote === o.id;
              return (
                <button
                  key={o.id}
                  className={`card card--tap stack ${meu ? 'card--accent' : ''}`}
                  style={{ padding: 12, gap: 8 }}
                  disabled={votando !== null}
                  onClick={() => votar(o.id)}
                >
                  <div className="row">
                    <span className={`check ${meu ? 'check--on' : ''}`}>{meu ? '✓' : ''}</span>
                    <span className="grow bold small" style={{ textAlign: 'left' }}>{o.text}</span>
                    <span className="tiny muted">{o.votes} {o.votes === 1 ? 'voto' : 'votos'}</span>
                  </div>
                  <div className="bar" style={{ height: 6 }}>
                    <div className="bar__fill" style={{ width: `${(o.votes / maisVotos) * 100}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!encerrada && poll.pending.length > 0 && (
          <div className="card card--flat stack" style={{ gap: 6 }}>
            <div className="eyebrow">Ainda não votaram</div>
            <div className="wrap">
              {poll.pending.map((p) => (
                <span key={p.id} className="chip tiny">{p.emoji} {p.name}</span>
              ))}
            </div>
            <div className="tiny muted">A votação fecha sozinha quando o último voto entrar.</div>
          </div>
        )}

        <div className="tiny muted">
          Se der empate, ganha quem tem crédito de desempate guardado. Quem perder leva o crédito
          para o próximo empate.
        </div>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- criar
export function NewRewardPollSheet({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { house, me, meta, toast } = useApp();
  const [opcoes, setOpcoes] = useState(['', '', '']);
  const [salvando, setSalvando] = useState(false);

  if (!house || !me || !meta) return null;
  const validas = opcoes.map((o) => o.trim()).filter(Boolean);
  const pronto = validas.length === 3;

  const sortear = (i: number) => {
    const usadas = opcoes.map((o) => o.trim());
    const livres = meta.rewards.filter((r) => !usadas.includes(r));
    const escolhida = livres[Math.floor(Math.random() * livres.length)] ?? meta.rewards[0];
    setOpcoes((p) => p.map((o, idx) => (idx === i ? escolhida : o)));
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Abrir votação"
      subtitle="Três opções de recompensa"
      footer={
        <button
          className="btn btn--primary btn--block"
          disabled={!pronto || salvando}
          onClick={async () => {
            setSalvando(true);
            try {
              await createRewardPoll(house.id, me.id, validas);
              toast('Votação aberta! 🗳️');
              setOpcoes(['', '', '']);
              onCreated();
              onClose();
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Não deu para abrir');
            } finally {
              setSalvando(false);
            }
          }}
        >
          {pronto ? 'Abrir votação' : `Faltam ${3 - validas.length} ${3 - validas.length === 1 ? 'opção' : 'opções'}`}
        </button>
      }
    >
      <div className="stack-lg">
        <div className="small muted">
          Todo integrante recebe o aviso ao entrar no app e escolhe uma. A mais votada vira a
          recompensa do mês.
        </div>

        {opcoes.map((o, i) => (
          <Field key={i} label={`Opção ${i + 1}`}>
            <div className="row">
              <input
                className="input grow"
                value={o}
                onChange={(e) => setOpcoes((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="Escolhe o filme da sexta"
                maxLength={70}
              />
              <button className="btn btn--soft" onClick={() => sortear(i)} aria-label="Sortear">🎲</button>
            </div>
          </Field>
        ))}

        <div className="row tiny muted">
          <Avatar member={me} size="sm" />
          <span>Aberta por {me.name}</span>
        </div>
      </div>
    </Sheet>
  );
}

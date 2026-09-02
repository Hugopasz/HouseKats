import { useEffect, useState } from 'react';
import { getClaims, resolveClaimGroup, type Claim } from '../lib/api';
import { useApp } from '../lib/store';
import { Sheet } from './ui';

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));

/** "0,3 kg de Frango" / "2 Bananas". Sem o "de" quando é contagem. */
const fmtItem = (qty: number, unit: string, name: string) =>
  unit === 'un' ? `${fmt(qty)} ${name}` : `${fmt(qty)} ${unit} de ${name}`;

/**
 * Aviso de consumo lançado por outra pessoa. Aparece sozinho ao entrar no app
 * e pode ser reaberto pelo card da home enquanto houver pendências.
 */
export default function ClaimsSheet({
  claims, onResolved, forceOpen, onClose,
}: {
  claims: Claim[];
  onResolved: () => void;
  forceOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useApp();
  const [busy, setBusy] = useState<number | null>(null);

  const act = async (c: Claim, action: 'confirm' | 'contest') => {
    setBusy(c.id);
    try {
      await resolveClaimGroup(c.ids, action);
      toast(action === 'confirm' ? 'Confirmado 👍' : 'Contestado. O app dividiu no meio ⚖️');
      onResolved();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para responder');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      open={forceOpen && claims.length > 0}
      onClose={onClose}
      title="Confere isso aí"
      subtitle={`${claims.length} lançamento${claims.length === 1 ? '' : 's'} feito${claims.length === 1 ? '' : 's'} por outra pessoa`}
    >
      <div className="stack">
        {claims.map((c) => (
          <div key={c.id} className="card stack" style={{ gap: 10 }}>
            <div className="row">
              <span style={{ fontSize: '1.6rem' }}>
                {c.kind === 'receita' ? c.emoji ?? '🍽️' : c.logged_by_emoji ?? '🐱'}
              </span>
              <div className="grow small">
                {c.kind === 'receita' ? (
                  <>
                    <b>{c.logged_by_name ?? 'Alguém'}</b> fez <b>{c.item_name}</b> e disse que
                    você comeu.
                  </>
                ) : (
                  <>
                    <b>{c.logged_by_name ?? 'Alguém'}</b> lançou que você consumiu{' '}
                    <b>{fmtItem(Math.abs(c.delta) * c.share, c.unit, c.item_name)}</b>
                    {c.share < 1 && <span className="muted"> (sua parte de uma divisão)</span>}
                  </>
                )}
              </div>
            </div>

            {/* o prato é o que a pessoa lembra; os ingredientes ficam a um toque */}
            {c.kind === 'receita' && c.ingredientes && c.ingredientes.length > 0 && (
              <details className="tiny muted">
                <summary style={{ cursor: 'pointer' }}>
                  {c.ingredientes.length} {c.ingredientes.length === 1 ? 'ingrediente' : 'ingredientes'} na sua parte
                </summary>
                <div className="wrap" style={{ marginTop: 6 }}>
                  {c.ingredientes.map((i) => (
                    <span key={i.name} className="chip tiny">{fmtItem(i.qty, i.unit, i.name)}</span>
                  ))}
                </div>
              </details>
            )}
            <div className="row">
              <button className="btn grow" disabled={busy === c.id} onClick={() => act(c, 'contest')}>
                🤨 Não fui eu
              </button>
              <button className="btn btn--primary grow" disabled={busy === c.id} onClick={() => act(c, 'confirm')}>
                👍 Fui eu
              </button>
            </div>
          </div>
        ))}
        <div className="tiny muted">
          Contestou? O app não abre discussão: divide o consumo meio a meio entre você e quem lançou.
        </div>
      </div>
    </Sheet>
  );
}

/** Busca as pendências do integrante ativo e controla a abertura automática. */
export function useClaims() {
  const { me } = useApp();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  const reload = () => {
    if (!me) return;
    getClaims(me.id).then((c) => {
      setClaims(c);
      if (c.length && !seen) { setOpen(true); setSeen(true); }
    }).catch(() => {});
  };

  useEffect(() => {
    setSeen(false);
    if (!me) { setClaims([]); return; }
    getClaims(me.id).then((c) => {
      setClaims(c);
      if (c.length) { setOpen(true); setSeen(true); }
    }).catch(() => {});
  }, [me]);

  return { claims, open, setOpen, reload };
}

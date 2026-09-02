import { useCallback, useEffect, useState } from 'react';
import { getVisitors, resolveVisit, type Member } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Option, Sheet } from './ui';

/**
 * Quando o prazo de uma visita acaba, a casa precisa decidir o que fazer com os
 * dados dela. Só quem mora aqui de verdade responde: a visita não decide sobre
 * o próprio apagamento.
 */
export default function VisitEndSheet() {
  const { house, me, refresh, toast } = useApp();
  const [fila, setFila] = useState<Member[]>([]);
  const [adiados, setAdiados] = useState<number[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const podeDecidir = !!me && !me.isVisitor && me.kind !== 'pet';

  const load = useCallback(async () => {
    if (!house || !podeDecidir) return;
    try {
      const v = await getVisitors(house.id);
      setFila(v.vencidos);
    } catch { /* silencioso */ }
  }, [house, podeDecidir]);

  useEffect(() => { load(); }, [load]);

  const atual = fila.find((v) => !adiados.includes(v.id));
  if (!atual || !house) return null;

  const decidir = async (action: 'remover' | 'estender' | 'efetivar', days?: number) => {
    setOcupado(true);
    try {
      await resolveVisit(atual.id, action, days);
      toast(
        action === 'remover'
          ? `Dados de ${atual.name} apagados`
          : action === 'estender'
            ? `${atual.name} fica mais ${days} dias`
            : `${atual.name} agora mora aqui 🎉`
      );
      setFila((f) => f.filter((v) => v.id !== atual.id));
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para decidir agora');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Sheet
      open
      onClose={() => setAdiados((a) => [...a, atual.id])}
      title="A visita terminou"
      subtitle={`O prazo de ${atual.name} acabou em ${atual.visit_until ?? 'algum momento'}`}
    >
      <div className="stack-lg">
        <div className="card card--accent row">
          <Avatar member={atual} size="lg" />
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="bold truncate">{atual.name}</div>
            <div className="tiny muted">{atual.title}</div>
          </div>
        </div>

        <div className="small muted">
          Nada foi apagado ainda. Escolha o que fazer com o histórico de consumo, tarefas e
          preferências de {atual.name}.
        </div>

        <div className="stack" style={{ opacity: ocupado ? 0.5 : 1, pointerEvents: ocupado ? 'none' : 'auto' }}>
          <Option
            on={false}
            emoji="🧳"
            title="A visita acabou"
            desc="Apaga o perfil e todos os dados dessa pessoa. Não dá para desfazer."
            onClick={() => decidir('remover')}
          />
          <Option
            on={false}
            emoji="📅"
            title="Ficou mais uns dias"
            desc="Estende a visita por mais 7 dias e pergunta de novo depois."
            onClick={() => decidir('estender', 7)}
          />
          <Option
            on={false}
            emoji="🏠"
            title="Virou morador"
            desc="Mantém tudo e transforma em integrante fixo da casa."
            onClick={() => decidir('efetivar')}
          />
        </div>

        <button className="btn btn--ghost btn--block" onClick={() => setAdiados((a) => [...a, atual.id])}>
          Decidir depois
        </button>
      </div>
    </Sheet>
  );
}

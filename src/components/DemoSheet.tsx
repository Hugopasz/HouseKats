import { useEffect, useState } from 'react';
import { clearDemos, createDemo, getDemoProfiles, type DemoProfile } from '../lib/api';
import { useApp } from '../lib/store';
import { Sheet } from './ui';

/**
 * Modo demonstração: cria uma casa de exemplo já preenchida, em três níveis de
 * complexidade. Serve para ver o app cheio sem cadastrar nada à mão.
 */
export default function DemoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh, toast } = useApp();
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (open) getDemoProfiles().then(setProfiles).catch(() => {});
  }, [open]);

  const create = async (p: DemoProfile) => {
    setBusy(p.key);
    try {
      const out = await createDemo(p.key);
      await refresh(out.houseId);
      toast(`Casa de exemplo criada com ${out.members} ${out.members === 1 ? 'pessoa' : 'pessoas'}`);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para criar a demo');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Modo demonstração"
      subtitle="Casas de exemplo já preenchidas"
    >
      <div className="stack-lg">
        <div className="small muted">
          Cria uma casa completa com armário, histórico de compras, receitas aprovadas, cômodos,
          questionário respondido e tarefas feitas. Ela aparece com <b>(demo)</b> no nome e pode ser
          apagada a qualquer momento.
        </div>

        <div className="stack">
          {profiles.map((p) => (
            <button
              key={p.key}
              className="card card--tap demo-card stack"
              style={{ gap: 6 }}
              disabled={!!busy}
              onClick={() => create(p)}
            >
              <div className="row">
                <span style={{ fontSize: '1.8rem' }}>{p.emoji}</span>
                <div className="grow">
                  <div className="bold">{p.label}</div>
                  <div className="tiny accent bold">{p.tag}</div>
                </div>
                {busy === p.key ? <div className="spinner" /> : <span className="accent bold">›</span>}
              </div>
              <div className="tiny muted">{p.desc}</div>
              <div className="wrap">
                <span className="chip tiny">{p.people} {p.people === 1 ? 'integrante' : 'integrantes'}</span>
                <span className="chip tiny">{p.historyDays} dias de histórico</span>
              </div>
            </button>
          ))}
        </div>

        <button
          className="btn btn--danger btn--block"
          disabled={!!busy}
          onClick={async () => {
            const res = await clearDemos();
            await refresh();
            toast(res.removed ? `${res.removed} casa(s) de exemplo apagada(s)` : 'Nenhuma casa de exemplo');
            onClose();
          }}
        >
          🧹 Apagar todas as casas de exemplo
        </button>
      </div>
    </Sheet>
  );
}

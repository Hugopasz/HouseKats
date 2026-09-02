import { useState } from 'react';
import { deleteHouse, deleteMember, type Member } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Confirm, Sheet } from '../components/ui';
import MemberForm from '../components/MemberForm';
import DemoSheet from '../components/DemoSheet';

export default function PickUser() {
  const { house, houses, setMe, refresh, openHouse, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  if (!house) return null;

  // pet não é perfil de acesso: ele aparece na casa, mas ninguém entra como ele
  const pessoas = house.members.filter((m) => !m.isPet);
  const pets = house.members.filter((m) => m.isPet);

  return (
    <div className="page page--flush stack-lg" style={{ paddingTop: 30 }}>
      <div className="row-between">
        <div className="row">
          <Avatar emoji={house.emoji} size="md" color="var(--text-3)" />
          <div>
            <div className="eyebrow">Casa</div>
            <div className="bold">{house.name}</div>
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => setManaging(true)} aria-label="Gerenciar">⚙️</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <h1>Quem é você?</h1>
        <div className="muted small">Toque no seu bichinho para entrar</div>
      </div>

      <div className="grid-people">
        {pessoas.map((m) => (
          <button key={m.id} className="person card card--tap" onClick={() => setMe(m.id)}>
            <Avatar member={m} size="lg" />
            <div className="bold truncate" style={{ marginTop: 8 }}>{m.name}</div>
            <div className="tiny muted truncate">{m.title}</div>
          </button>
        ))}

        <button className="person card card--tap person--add" onClick={() => setAdding(true)}>
          <div className="avatar avatar--lg" style={{ borderStyle: 'dashed', ['--am' as string]: 'var(--line-2)' }}>➕</div>
          <div className="bold" style={{ marginTop: 8 }}>Adicionar</div>
          <div className="tiny muted">novo integrante</div>
        </button>
      </div>

      {/* pets não entram como perfil de login: quem cuida deles é a gente */}
      {pets.length > 0 && (
        <section className="stack" style={{ marginTop: -6 }}>
          <div className="eyebrow center">Moradores de quatro patas</div>
          <div className="wrap center">
            {pets.map((p) => (
              <span key={p.id} className="chip">
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------ adicionar */}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Novo integrante"
        subtitle="Cada pessoa monta o seu próprio perfil"
      >
        <MemberForm
          houseId={house.id}
          onDone={async (m) => {
            await refresh();
            setAdding(false);
            toast(`${m.emoji} ${m.name} entrou na casa!`);
          }}
          onCancel={() => setAdding(false)}
        />
      </Sheet>

      {/* ------------------------------------------------ gerenciar */}
      <Sheet open={managing} onClose={() => setManaging(false)} title="Gerenciar" subtitle="Casas e integrantes">
        <div className="stack-lg">
          <section className="stack">
            <div className="eyebrow">Integrantes</div>
            {house.members.map((m) => (
              <div key={m.id} className="card row" style={{ padding: 12 }}>
                <Avatar member={m} size="sm" />
                <div className="grow">
                  <div className="bold small">{m.name}</div>
                  <div className="tiny muted truncate">{m.title}</div>
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => setRemoving(m)}>Remover</button>
              </div>
            ))}
            {house.members.length === 0 && <div className="small muted">Ninguém cadastrado ainda.</div>}
          </section>

          <section className="stack">
            <div className="eyebrow">Casas</div>
            {houses.map((h) => (
              <div key={h.id} className={`card row ${h.id === house.id ? 'card--accent' : ''}`} style={{ padding: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>{h.emoji}</span>
                <div className="grow">
                  <div className="bold small">{h.name}</div>
                  <div className="tiny muted">{h.members} integrante{h.members === 1 ? '' : 's'}</div>
                </div>
                {h.id === house.id ? (
                  <span className="badge">atual</span>
                ) : (
                  <button
                    className="btn btn--sm"
                    onClick={async () => { await openHouse(h.id); setManaging(false); }}
                  >
                    Abrir
                  </button>
                )}
              </div>
            ))}

            <DangerZone onDone={() => setManaging(false)} />
          </section>
        </div>
      </Sheet>

      <Confirm
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remover ${removing?.name}?`}
        message="O histórico de consumo e tarefas dessa pessoa sai junto. Não dá para desfazer."
        confirmLabel="Remover"
        danger
        onConfirm={async () => {
          if (!removing) return;
          await deleteMember(removing.id);
          await refresh();
          toast('Integrante removido');
        }}
      />
    </div>
  );
}

/** Criar outra casa / apagar a casa atual. */
function DangerZone({ onDone }: { onDone: () => void }) {
  const { house, refresh, openHouse, toast } = useApp();
  const [confirmText, setConfirmText] = useState('');
  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState(false);

  if (!house) return null;
  const matches = confirmText.trim().toLowerCase() === house.name.trim().toLowerCase();

  return (
    <>
      <button
        className="btn btn--soft btn--block"
        onClick={async () => {
          // solta a casa atual: sem casa carregada, o app cai no wizard de criacao
          await openHouse(null);
          onDone();
        }}
      >
        🏠 Criar outra casa
      </button>

      <button className="btn btn--block" onClick={() => setDemo(true)}>
        🧪 Modo demonstração
      </button>

      <DemoSheet open={demo} onClose={() => { setDemo(false); onDone(); }} />

      <button className="btn btn--danger btn--block" onClick={() => setOpen(true)}>
        🗑️ Apagar “{house.name}”
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Apagar a casa" subtitle="Isso não tem volta">
        <div className="stack">
          <div className="small muted">
            Some tudo: integrantes, armário, receitas, listas, tarefas e o log inteiro.
            Digite <b>{house.name}</b> para confirmar.
          </div>
          <input
            className="input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={house.name}
          />
          <button
            className="btn btn--danger btn--block"
            disabled={!matches}
            onClick={async () => {
              await deleteHouse(house.id);
              setOpen(false);
              onDone();
              await refresh();
              toast('Casa apagada');
            }}
          >
            Apagar para sempre
          </button>
        </div>
      </Sheet>
    </>
  );
}

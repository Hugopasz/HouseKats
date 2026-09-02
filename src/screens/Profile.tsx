import { useCallback, useEffect, useState } from 'react';
import { getMoods, patchMember, setMood, type Diet, type Goal, type Mood } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Field, Option, Sheet } from '../components/ui';
import MemberForm from '../components/MemberForm';
import Travel from './Travel';

const HUMORES = [
  { emoji: '😄', label: 'ótimo' },
  { emoji: '🙂', label: 'bem' },
  { emoji: '😐', label: 'neutro' },
  { emoji: '😔', label: 'pra baixo' },
  { emoji: '😤', label: 'estressado' },
  { emoji: '😴', label: 'cansado' },
  { emoji: '🤒', label: 'doente' },
  { emoji: '🥳', label: 'animado' },
];

export default function Profile() {
  const { me, meta, house, refresh, setMe, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [kcalOpen, setKcalOpen] = useState(false);

  if (!me || !meta || !house) return null;
  if (traveling) return <Travel onBack={() => setTraveling(false)} />;
  const t = me.targets;

  const update = async (body: Record<string, unknown>, msg?: string) => {
    await patchMember(me.id, body);
    await refresh();
    if (msg) toast(msg);
  };

  return (
    <div className="page stack-lg">
      {/* ------------------------------------------------ cabecalho */}
      <div className="card card--accent center stack" style={{ flexDirection: 'column', gap: 6, textAlign: 'center' }}>
        <Avatar member={me} size="xl" />
        <h1 style={{ marginTop: 6 }}>{me.name}</h1>
        <div className="badge">{me.title}</div>
        <div className="row tiny muted" style={{ justifyContent: 'center', marginTop: 4 }}>
          {me.age ? <span>{me.age} anos</span> : null}
          {me.weight_kg ? <span>· {me.weight_kg} kg</span> : null}
          {me.height_cm ? <span>· {me.height_cm} cm</span> : null}
        </div>
      </div>

      {/* ------------------------------------------------ humor do dia */}
      <MoodCard />

      {/* ------------------------------------------------ avatar */}
      <section className="stack">
        <div className="eyebrow">Seu bichinho</div>
        <div className="grid-pick">
          {meta.avatars.map((a) => (
            <button
              key={a}
              className={`pick ${me.emoji === a ? 'pick--on' : ''}`}
              onClick={() => update({ emoji: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ cor da UI */}
      <section className="stack">
        <div className="eyebrow">Cor da sua interface</div>
        <div className="grid-pick">
          {Object.entries(meta.colors).map(([key, c]) => (
            <button
              key={key}
              className={`swatch ${me.color === key ? 'swatch--on' : ''}`}
              style={{ background: c.hex }}
              onClick={() => update({ color: key })}
              aria-label={c.label}
            />
          ))}
        </div>
        <div className="tiny muted">Só muda para você. Cada integrante tem a sua.</div>
      </section>

      {/* ------------------------------------------------ metas */}
      <section className="stack">
        <div className="row-between">
          <div className="eyebrow">Suas metas do dia</div>
          <button className="btn btn--ghost btn--sm" onClick={() => setTuning(true)}>ajustar</button>
        </div>
        <div className="hl-grid">
          <div className="hl"><span className="hl__ico">🔥</span><span className="hl__val">{t.kcal}</span><span className="hl__lbl">kcal</span></div>
          <div className="hl"><span className="hl__ico">🥩</span><span className="hl__val">{t.protein} g</span><span className="hl__lbl">proteína</span></div>
          <div className="hl"><span className="hl__ico">🍚</span><span className="hl__val">{t.carbs} g</span><span className="hl__lbl">carboidrato</span></div>
          <div className="hl"><span className="hl__ico">🥑</span><span className="hl__val">{t.fat} g</span><span className="hl__lbl">gordura</span></div>
          <div className="hl hl--wide">
            <span className="hl__ico">🍽️</span>
            <span className="hl__val">{t.mealsPerDay} refeições/dia</span>
            <span className="hl__lbl">{me.dietLabel} · {me.goalLabel}</span>
          </div>
        </div>
        <button className="btn btn--soft btn--block" onClick={() => setKcalOpen(true)}>
          🔧 Ajustar minhas calorias
        </button>

        <div className="tiny muted">
          {t.customKcal
            ? `Você definiu ${t.customKcal} kcal por dia. O app sugeriria ${t.suggestedKcal}.`
            : 'Estimativas para uso doméstico, calculadas a partir do seu perfil.'}
          {' '}Não substituem orientação de nutricionista ou médico.
        </div>
      </section>

      {/* ------------------------------------------------ modo viagem */}
      <button className={`card row card--tap ${house.traveling ? 'card--accent' : ''}`} onClick={() => setTraveling(true)}>
        <span style={{ fontSize: '1.7rem' }}>{house.traveling ? '✈️' : '🧳'}</span>
        <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
          <div className="bold small">Modo Viagem</div>
          <div className="tiny muted">
            {house.traveling
              ? `A casa está fora até ${house.travel_until?.split('-').reverse().join('/')}`
              : 'Congela streaks e tarefas e diz o que fazer com o armário'}
          </div>
        </div>
        <span className="accent bold">›</span>
      </button>

      {/* ------------------------------------------------ acoes */}
      <section className="stack">
        <button className="btn btn--block" onClick={() => setEditing(true)}>✏️ Editar meu perfil</button>
        <button className="btn btn--block" onClick={() => setMe(null)}>🔄 Trocar de usuário</button>
      </section>

      {/* ------------------------------------------------ sheets */}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Editar perfil">
        <MemberForm
          houseId={house.id}
          editing={me}
          onDone={async () => { await refresh(); setEditing(false); toast('Perfil atualizado'); }}
          onCancel={() => setEditing(false)}
        />
      </Sheet>

      <KcalSheet open={kcalOpen} onClose={() => setKcalOpen(false)} />

      <Sheet open={tuning} onClose={() => setTuning(false)} title="Ajustar metas" subtitle="Dieta e objetivo">
        <div className="stack-lg">
          <section className="stack">
            <div className="eyebrow">Dieta</div>
            {(Object.entries(meta.diets) as [Diet, typeof meta.diets[Diet]][]).map(([key, v]) => (
              <Option
                key={key}
                on={me.diet === key}
                emoji={v.emoji}
                title={v.label}
                desc={`~${v.mealsPerDay} refeições/dia`}
                onClick={() => update({ diet: key }, 'Dieta ajustada')}
              />
            ))}
          </section>
          <section className="stack">
            <div className="eyebrow">Objetivo</div>
            {(Object.entries(meta.goals) as [Goal, typeof meta.goals[Goal]][]).map(([key, v]) => (
              <Option
                key={key}
                on={me.goal === key}
                emoji={v.emoji}
                title={v.label}
                onClick={() => update({ goal: key }, 'Objetivo ajustado')}
              />
            ))}
          </section>
        </div>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------- humor do dia
/** Como você está hoje. Fica no log da casa e num histórico só seu. */
function MoodCard() {
  const { house, me, toast } = useApp();
  const [hoje, setHoje] = useState<Mood | null>(null);
  const [historico, setHistorico] = useState<Mood[]>([]);
  const [aberto, setAberto] = useState(false);
  const [verHistorico, setVerHistorico] = useState(false);
  const [nota, setNota] = useState('');

  const load = useCallback(async () => {
    if (!house || !me) return;
    const r = await getMoods(house.id, me.id);
    setHoje(r.hoje);
    setHistorico(r.historico);
  }, [house, me]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  if (!house || !me) return null;

  const marcar = async (emoji: string, label: string) => {
    await setMood(house.id, { member_id: me.id, emoji, label, note: nota.trim() });
    toast(`Humor de hoje: ${emoji}`);
    setNota('');
    setAberto(false);
    await load();
  };

  return (
    <>
      <button className="card card--tap row" onClick={() => setAberto(true)}>
        <span style={{ fontSize: '1.9rem' }}>{hoje?.emoji ?? '🫥'}</span>
        <div className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
          <div className="eyebrow">Humor de hoje</div>
          <div className="bold small">
            {hoje ? `Você está ${hoje.label}` : 'Como você está hoje?'}
          </div>
          {hoje?.note && <div className="tiny muted truncate">{hoje.note}</div>}
        </div>
        <span className="accent bold">›</span>
      </button>

      <Sheet
        open={aberto}
        onClose={() => setAberto(false)}
        title="Como você está hoje?"
        subtitle="Fica no log da casa, para todo mundo saber"
      >
        <div className="stack-lg">
          <div className="grid-pick">
            {HUMORES.map((h) => (
              <button
                key={h.emoji}
                className={`pick ${hoje?.emoji === h.emoji ? 'pick--on' : ''}`}
                onClick={() => marcar(h.emoji, h.label)}
                title={h.label}
              >
                {h.emoji}
              </button>
            ))}
          </div>

          <Field label="Quer contar alguma coisa? (opcional)">
            <input
              className="input"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Semana puxada no trabalho"
              maxLength={60}
            />
          </Field>

          <button className="btn btn--block" onClick={() => { setAberto(false); setVerHistorico(true); }}>
            📅 Ver meu histórico de humores
          </button>
        </div>
      </Sheet>

      <Sheet
        open={verHistorico}
        onClose={() => setVerHistorico(false)}
        title="Seus humores"
        subtitle={`${historico.length} ${historico.length === 1 ? 'registro' : 'registros'}`}
      >
        <div className="stack">
          {!historico.length && (
            <div className="small muted center" style={{ padding: 20 }}>
              Nenhum humor registrado ainda.
            </div>
          )}
          {historico.map((h) => (
            <div key={h.id} className="card row" style={{ padding: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>{h.emoji}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small bold">{h.label || 'sem rótulo'}</div>
                {h.note && <div className="tiny muted truncate">{h.note}</div>}
              </div>
              <span className="tiny muted">{h.day.slice(8, 10)}/{h.day.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- calorias
/** Meta de calorias na mão. As outras macros se reequilibram sozinhas. */
function KcalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, refresh, toast } = useApp();
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (open && me) setValor(String(me.targets.customKcal ?? me.targets.kcal));
  }, [open, me]);

  if (!me) return null;
  const n = Number(valor);
  const valido = Number.isFinite(n) && n >= 800 && n <= 6000;

  const salvar = async (custom: number | null) => {
    await patchMember(me.id, { custom_kcal: custom });
    await refresh();
    toast(custom ? `Meta ajustada para ${custom} kcal` : 'Voltou para a estimativa do app');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Suas calorias por dia"
      subtitle="As outras metas se ajustam junto"
      footer={
        <>
          <button className="btn" onClick={() => salvar(null)}>Usar a do app</button>
          <button className="btn btn--primary grow" disabled={!valido} onClick={() => salvar(Math.round(n))}>
            Salvar
          </button>
        </>
      }
    >
      <div className="stack-lg">
        <Field label="Meta diária" hint="Entre 800 e 6000 kcal.">
          <div className="row">
            <input
              className="input input--big grow"
              inputMode="numeric"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <span className="bold muted">kcal</span>
          </div>
        </Field>

        <div className="wrap">
          {[-300, -100, +100, +300].map((d) => (
            <button
              key={d}
              className="chip"
              onClick={() => setValor(String(Math.max(800, Math.min(6000, (Number(valor) || 0) + d))))}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {valido && (
          <div className="card card--flat stack" style={{ gap: 6 }}>
            <div className="eyebrow">Como ficariam suas metas</div>
            <div className="small">
              🥩 {Math.round((me.weight_kg ?? 70) * (me.goal === 'reduzir' ? 2 : me.goal === 'massa' ? 1.8 : 1.4))} g de proteína
            </div>
            <div className="small">🥑 {Math.round((n * 0.27) / 9)} g de gordura</div>
            <div className="small">
              🍚 {Math.max(0, Math.round((n - Math.round((me.weight_kg ?? 70) * (me.goal === 'reduzir' ? 2 : me.goal === 'massa' ? 1.8 : 1.4)) * 4 - Math.round((n * 0.27) / 9) * 9) / 4))} g de carboidrato
            </div>
          </div>
        )}

        <div className="tiny muted">
          O app sugere {me.targets.suggestedKcal ?? me.targets.kcal} kcal a partir do seu perfil.
          Ajuste se você conhece melhor o seu corpo.
        </div>
      </div>
    </Sheet>
  );
}

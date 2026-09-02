import { useEffect, useState } from 'react';
import { addMember, patchMember, randomTitle, type Diet, type Goal, type Member } from '../lib/api';
import { useApp } from '../lib/store';
import { Avatar, Field, Option, Steps } from './ui';

type Kind = 'pessoa' | 'visita' | 'pet';

type Draft = {
  kind: Kind;
  name: string;
  emoji: string;
  title: string;
  color: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  diet: Diet;
  goal: Goal;
  species: string;
  visit_days: string;
};

/** Os mesmos três níveis de apetite, ditos do jeito que se fala de bicho. */
const APETITE_PET: Record<Diet, string> = {
  pouca: 'Belisca, sobra ração no pote',
  media: 'Come bem, na medida do pote',
  grande: 'Come tudo e pede mais',
};

const emptyDraft = (): Draft => ({
  kind: 'pessoa', name: '', emoji: '🐱', title: '', color: 'roxo',
  age: '', weight_kg: '', height_cm: '', diet: 'media', goal: 'manter',
  species: 'cachorro', visit_days: '7',
});

const fromMember = (m: Member): Draft => ({
  kind: m.kind === 'pet' ? 'pet' : m.temporary ? 'visita' : 'pessoa',
  name: m.name,
  emoji: m.emoji,
  title: m.title,
  color: m.color,
  age: m.age?.toString() ?? '',
  weight_kg: m.weight_kg?.toString() ?? '',
  height_cm: m.height_cm?.toString() ?? '',
  diet: m.diet,
  goal: m.goal,
  species: m.species || 'cachorro',
  visit_days: '7',
});

/**
 * Cadastro de integrante. O primeiro passo decide o tipo, e os passos seguintes
 * mudam conforme: pet não tem objetivo de dieta, visita tem prazo.
 */
export default function MemberForm({
  houseId, editing, onDone, onCancel, onBackFromStart, lockKind,
}: {
  houseId: number;
  editing?: Member;
  onDone: (m: Member) => void;
  onCancel?: () => void;
  /** Sair do primeiro passo voltando ao passo anterior do onboarding. */
  onBackFromStart?: () => void;
  /** No onboarding o primeiro cadastro é sempre você: sem escolher o tipo. */
  lockKind?: boolean;
}) {
  const { meta, house, toast } = useApp();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(() => (editing ? fromMember(editing) : emptyDraft()));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const isPet = d.kind === 'pet';
  const isVisita = d.kind === 'visita';

  // pet não tem objetivo; quem edita já escolheu o tipo lá atrás
  const passos: ('tipo' | 'perfil' | 'dieta' | 'objetivo')[] = [
    ...(editing || lockKind ? [] : ['tipo' as const]),
    'perfil' as const,
    'dieta' as const,
    ...(isPet ? [] : ['objetivo' as const]),
  ];
  const atual = passos[Math.min(step, passos.length - 1)];
  const ultimo = step >= passos.length - 1;

  // sorteia um titulo logo de cara para quem esta criando
  useEffect(() => {
    if (editing || d.title) return;
    const used = house?.members.map((m) => m.title) ?? [];
    randomTitle(used).then((r) => set('title', r.title)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rollTitle = async () => {
    const used = house?.members.map((m) => m.title) ?? [];
    try {
      const r = await randomTitle([...used, d.title]);
      set('title', r.title);
    } catch { /* silencioso */ }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: d.name.trim(),
        emoji: d.emoji,
        title: d.title.trim(),
        color: d.color,
        age: d.age === '' ? null : Number(d.age),
        weight_kg: d.weight_kg === '' ? null : Number(d.weight_kg),
        height_cm: d.height_cm === '' ? null : Number(d.height_cm),
        diet: d.diet,
        goal: isPet ? 'manter' : d.goal,
        kind: isPet ? 'pet' : 'pessoa',
        species: isPet ? d.species : '',
        temporary: isVisita,
        // editar o perfil não mexe no prazo da visita: só a criação define
        visit_days: isVisita && !editing ? Number(d.visit_days) || 7 : undefined,
      };
      const m = editing ? await patchMember(editing.id, body) : await addMember(houseId, body);
      onDone(m);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não deu para salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return null;
  const colorHex = meta.colors[d.color]?.hex ?? 'var(--ac)';
  const avatares = isPet ? meta.petAvatars : meta.avatars;
  const canAdvance = atual !== 'perfil' || d.name.trim().length > 0;

  return (
    <div className="stack-lg">
      <Steps total={passos.length} current={step} />

      {/* ---------------------------------------------------- 0. tipo */}
      {atual === 'tipo' && (
        <div className="stack">
          <div>
            <h2>Quem está entrando?</h2>
            <div className="small muted">Dá para adicionar gente, visita e bicho.</div>
          </div>

          <Option
            on={d.kind === 'pessoa'}
            emoji="🏠"
            title="Morador"
            desc="Come, faz tarefas e some no placar do mês."
            onClick={() => setD((p) => ({ ...p, kind: 'pessoa', emoji: p.emoji === '🐶' ? '🐱' : p.emoji }))}
          />
          <Option
            on={d.kind === 'visita'}
            emoji="🧳"
            title="Visita"
            desc="Participa de tudo enquanto estiver aqui. No fim da visita a casa decide o que fazer com os dados."
            onClick={() => setD((p) => ({ ...p, kind: 'visita', emoji: p.emoji === '🐶' ? '🐱' : p.emoji }))}
          />
          <Option
            on={d.kind === 'pet'}
            emoji="🐾"
            title="Pet"
            desc="Come e aparece na praça, mas não entra na escala de tarefas."
            onClick={() => setD((p) => ({ ...p, kind: 'pet', emoji: '🐶' }))}
          />
        </div>
      )}

      {/* ---------------------------------------------------- 1. perfil */}
      {atual === 'perfil' && (
        <div className="stack-lg">
          <div className="center stack" style={{ flexDirection: 'column', gap: 8 }}>
            <Avatar emoji={d.emoji} color={colorHex} size="xl" />
            <div className="tiny muted">
              {isPet ? 'Escolha a cara do bichinho' : 'Escolha sua cara e sua cor'}
            </div>
          </div>

          <Field label={isPet ? 'Nome do pet' : 'Como te chamam?'}>
            <input
              className="input input--big"
              value={d.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={isPet ? 'Fubá' : 'Seu nome'}
              autoFocus
              maxLength={24}
            />
          </Field>

          {isPet && (
            <Field label="Espécie" hint="Define o tipo de ração que aparece nas compras.">
              <div className="wrap">
                {Object.entries(meta.species).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    className={`chip ${d.species === key ? 'chip--on' : ''}`}
                    onClick={() => setD((p) => ({ ...p, species: key, emoji: p.emoji === '🐶' ? s.emoji : p.emoji }))}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {isVisita && (
            <Field label="Fica por quantos dias?" hint="No fim do prazo o app pergunta o que fazer.">
              <div className="wrap">
                {['3', '7', '15', '30'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${d.visit_days === n ? 'chip--on' : ''}`}
                    onClick={() => set('visit_days', n)}
                  >
                    {n} dias
                  </button>
                ))}
                <input
                  className="input"
                  style={{ width: 90 }}
                  inputMode="numeric"
                  value={d.visit_days}
                  onChange={(e) => set('visit_days', e.target.value.replace(/\D/g, '').slice(0, 3))}
                />
              </div>
            </Field>
          )}

          <Field label="Avatar">
            <div className="grid-pick">
              {avatares.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`pick ${d.emoji === a ? 'pick--on' : ''}`}
                  onClick={() => set('emoji', a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label={isPet ? 'Cor do pet' : 'Cor da sua interface'}
            hint={isPet ? 'Aparece no avatar e na praça.' : 'Cada integrante vê o app na sua própria cor.'}
          >
            <div className="grid-pick">
              {Object.entries(meta.colors).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  className={`swatch ${d.color === key ? 'swatch--on' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => set('color', key)}
                  aria-label={c.label}
                />
              ))}
            </div>
          </Field>

          <Field
            label={isPet ? 'Título do bichinho' : 'Seu título'}
            hint="Puramente decorativo. Aperte o dado até rir."
          >
            <div className="row">
              <input
                className="input grow"
                value={d.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder={isPet ? 'Morador de quatro patas' : 'Guardião da Geladeira'}
                maxLength={48}
              />
              <button className="btn btn--soft" type="button" onClick={rollTitle} aria-label="Sortear título">🎲</button>
            </div>
          </Field>

          <div className="row" style={{ gap: 10 }}>
            <Field label="Idade">
              <input className="input" inputMode="numeric" value={d.age}
                onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder={isPet ? '4' : '30'} />
            </Field>
            <Field label="Peso (kg)">
              <input className="input" inputMode="decimal" value={d.weight_kg}
                onChange={(e) => set('weight_kg', e.target.value.replace(/[^\d.,]/g, '').replace(',', '.').slice(0, 5))} placeholder={isPet ? '8' : '70'} />
            </Field>
            {!isPet && (
              <Field label="Altura (cm)">
                <input className="input" inputMode="numeric" value={d.height_cm}
                  onChange={(e) => set('height_cm', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="170" />
              </Field>
            )}
          </div>
          <div className="tiny muted" style={{ marginTop: -8 }}>
            {isPet
              ? 'Idade e peso são opcionais. Servem para estimar quanta ração o bichinho come.'
              : 'Idade, peso e altura são opcionais. Servem só para estimar suas metas do dia.'}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- 2. dieta */}
      {atual === 'dieta' && (
        <div className="stack">
          <div>
            <h2>{isPet ? 'Como o bichinho come?' : 'Como você come?'}</h2>
            <div className="small muted">
              {isPet
                ? 'Isso ajusta quanta ração entra na lista de compras.'
                : 'Isso ajusta o tamanho das porções e a lista de compras.'}
            </div>
          </div>

          {!isPet && (
            <div className="card card--accent stack" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <span className="bold small">Atenção</span>
              </div>
              <div className="small muted">
                O foco aqui não é controle de dieta, e sim alimentar os integrantes da casa com
                regularidade. <b>Refeições fora de casa não contam!</b>
              </div>
            </div>
          )}

          {(Object.entries(meta.diets) as [Diet, typeof meta.diets[Diet]][]).map(([key, v]) => (
            <Option
              key={key}
              on={d.diet === key}
              emoji={v.emoji}
              title={v.label}
              desc={isPet ? APETITE_PET[key] : `${v.desc} · ~${v.mealsPerDay} refeições/dia`}
              onClick={() => set('diet', key)}
            />
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- 3. objetivo */}
      {atual === 'objetivo' && (
        <div className="stack">
          <div>
            <h2>Qual seu objetivo?</h2>
            <div className="small muted">Dá para mudar quando quiser nos ajustes.</div>
          </div>
          {(Object.entries(meta.goals) as [Goal, typeof meta.goals[Goal]][]).map(([key, v]) => (
            <Option
              key={key}
              on={d.goal === key}
              emoji={v.emoji}
              title={v.label}
              desc={v.desc}
              onClick={() => set('goal', key)}
            />
          ))}
          <div className="tiny muted" style={{ marginTop: 6 }}>
            As metas do app são estimativas para uso doméstico e não substituem orientação de
            nutricionista ou médico.
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- navegacao */}
      <div className="row">
        {step > 0 ? (
          <button className="btn" onClick={() => setStep((s) => s - 1)}>‹ Voltar</button>
        ) : onCancel ? (
          <button className="btn" onClick={onCancel}>Cancelar</button>
        ) : onBackFromStart ? (
          <button className="btn" onClick={onBackFromStart}>‹ Voltar</button>
        ) : null}

        {!ultimo ? (
          <button className="btn btn--primary grow" disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Continuar
          </button>
        ) : (
          <button className="btn btn--primary grow" disabled={saving} onClick={save}>
            {saving ? 'Salvando…' : editing ? 'Salvar' : isPet ? 'Adotar na casa' : isVisita ? 'Receber a visita' : 'Entrar na casa'}
          </button>
        )}
      </div>
    </div>
  );
}

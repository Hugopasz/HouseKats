import { useState } from 'react';
import { useApp } from '../lib/store';
import { Avatar } from '../components/ui';
import Fridge from './Fridge';
import Chores from './Chores';
import Profile from './Profile';
import Insights from './Insights';
import Plaza from './Plaza';
import VisitEndSheet from '../components/VisitEndSheet';

export type Tab = 'geladeira' | 'tarefas' | 'praca' | 'padroes' | 'perfil';

const TABS: { id: Tab; ico: string; label: string }[] = [
  { id: 'geladeira', ico: '🧊', label: 'Armário' },
  { id: 'tarefas', ico: '🧹', label: 'Tarefinhas' },
  { id: 'praca', ico: '🏞️', label: 'Praça' },
  { id: 'padroes', ico: '📊', label: 'Padrões' },
  { id: 'perfil', ico: '🐱', label: 'Perfil' },
];

export default function Main() {
  const { me, house, setMe } = useApp();
  const [tab, setTab] = useState<Tab>('geladeira');
  if (!me || !house) return null;

  return (
    <>
      <div className="topbar">
        <button className="row btn btn--ghost btn--sm" onClick={() => setMe(null)} style={{ padding: '4px 8px' }}>
          <Avatar member={me} size="sm" />
          <span className="bold small truncate">{me.name}</span>
          <span className="tiny muted">trocar</span>
        </button>
        <div className="row tiny muted">
          <span>{house.emoji}</span>
          <span className="truncate" style={{ maxWidth: 130 }}>{house.name}</span>
        </div>
      </div>

      {tab === 'geladeira' && <Fridge />}
      {tab === 'tarefas' && <Chores onGoFridge={() => setTab('geladeira')} />}
      {tab === 'praca' && <Plaza />}
      {tab === 'padroes' && <Insights />}
      {tab === 'perfil' && <Profile />}

      <VisitEndSheet />

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'tab--on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab__ico">{t.ico}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

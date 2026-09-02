import { useApp } from './lib/store';
import { Loading, Toasts } from './components/ui';
import Onboarding from './screens/Onboarding';
import PickUser from './screens/PickUser';
import Main from './screens/Main';
import Tranca from './screens/Tranca';

export default function App() {
  const { ready, bootError, trancado, destrancar, house, me } = useApp();

  let screen;
  if (!ready) screen = <Loading label="Abrindo a casa…" />;
  else if (trancado) screen = <Tranca onEntrou={destrancar} />;
  else if (bootError) screen = <BootError />;
  else if (!house) screen = <Onboarding />;
  else if (house.onboarding_step !== 'done') screen = <Onboarding />;
  else if (!me) screen = <PickUser />;
  else screen = <Main />;

  return (
    <div className="app">
      {screen}
      <Toasts />
    </div>
  );
}

/**
 * Falha de boot com nome e sobrenome. Sem isso, um servidor errado na porta faz
 * o app quebrar lá na frente, num lugar que não tem nada a ver com a causa.
 */
function BootError() {
  const { bootError } = useApp();
  if (!bootError) return null;
  const porta = window.location.port || '80';

  return (
    <div className="page page--flush stack-lg" style={{ paddingTop: 40 }}>
      <div className="center stack" style={{ flexDirection: 'column', gap: 6, textAlign: 'center' }}>
        <div style={{ fontSize: '3.4rem' }}>🙀</div>
        <h1>Não achei o servidor</h1>
        <div className="muted">{bootError.message}</div>
      </div>

      {bootError.wrongServer ? (
        <div className="card stack">
          <div className="bold">Tem outro programa na porta {porta}</div>
          <div className="small muted">
            Quem respondeu neste endereço não é o House Kats, e sim outro app rodando na mesma porta.
            Isso costuma acontecer quando outro projeto (Next.js, React, etc) já está aberto.
          </div>
          <div className="divider" />
          <div className="small">
            <b>Como resolver:</b>
          </div>
          <div className="small muted">
            1. Feche a janela do outro projeto.<br />
            2. Abra o <b>Iniciar House Kats.bat</b>.<br />
            3. Use o endereço que aparecer na janela preta, que mostra a porta certa.
          </div>
        </div>
      ) : (
        <div className="card stack">
          <div className="bold">O servidor não está rodando</div>
          <div className="small muted">
            O House Kats precisa da janela preta aberta no PC para funcionar. Se ela foi fechada,
            abra o <b>Iniciar House Kats.bat</b> de novo.
          </div>
        </div>
      )}

      <button className="btn btn--primary btn--lg btn--block" onClick={() => window.location.reload()}>
        Tentar de novo
      </button>
    </div>
  );
}

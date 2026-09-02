import { useState } from 'react';
import { entrarNaCasa } from '../lib/api';

/**
 * A porta da casa. Aparece quando o aparelho não tem crachá válido — na
 * primeira vez, ou quando a senha muda.
 *
 * Não é login por pessoa: quem mora aqui digita a senha uma vez no celular e
 * não vê mais esta tela. Escolher qual integrante você é continua sendo o
 * toque no bichinho, do outro lado.
 */
export default function Tranca({ onEntrou }: { onEntrou: () => void }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [tentando, setTentando] = useState(false);

  const entrar = async () => {
    if (!senha.trim() || tentando) return;
    setTentando(true);
    setErro('');
    try {
      await entrarNaCasa(senha.trim());
      onEntrou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para entrar');
      setSenha('');
    } finally {
      setTentando(false);
    }
  };

  return (
    <div className="page page--flush stack-lg" style={{ paddingTop: 48 }}>
      <div className="center stack" style={{ flexDirection: 'column', gap: 6, textAlign: 'center' }}>
        <div style={{ fontSize: '3.6rem' }}>🔐</div>
        <h1>House Kats</h1>
        <div className="muted">Essa casa tem senha</div>
      </div>

      <div className="card stack-lg">
        <div>
          <h2>Quem mora aqui sabe</h2>
          <div className="small muted">
            Você digita uma vez neste aparelho e não vê mais esta tela.
          </div>
        </div>

        <input
          className="input input--big"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro(''); }}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
          placeholder="••••••"
          maxLength={40}
          autoFocus
        />

        {erro && <div className="small bold" style={{ color: 'var(--danger)' }}>{erro}</div>}

        <button
          className="btn btn--primary btn--lg btn--block"
          disabled={!senha.trim() || tentando}
          onClick={entrar}
        >
          {tentando ? 'Conferindo…' : 'Entrar'}
        </button>
      </div>

      <div className="tiny muted center" style={{ textAlign: 'center' }}>
        Esqueceu? A senha fica num arquivo ao lado do banco, no PC que roda o app.
      </div>
    </div>
  );
}

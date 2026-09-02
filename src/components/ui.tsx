import { useEffect, useRef, type ReactNode } from 'react';
import { useApp } from '../lib/store';
import type { Member } from '../lib/api';

/**
 * Trava de rolagem contada. Uma tela costuma ter vários Sheets montados ao
 * mesmo tempo; se cada um salvasse e restaurasse o overflow anterior, fechar
 * fora de ordem deixaria o body travado em "hidden" para sempre, e a página
 * inteira parava de rolar. Só o último a fechar libera.
 */
let scrollLocks = 0;

function lockScroll() {
  scrollLocks += 1;
  if (scrollLocks === 1) document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = '';
}

// ---------------------------------------------------------------- Sheet
export function Sheet({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // ref para o Escape não entrar nas dependências e ficar re-travando a cada render
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        {(title || subtitle) && (
          <div className="sheet__head">
            <div className="grow">
              {title && <h2>{title}</h2>}
              {subtitle && <div className="small muted">{subtitle}</div>}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Fechar">✕</button>
          </div>
        )}
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Confirm
export function Confirm({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="muted">{message}</div>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn grow" onClick={onClose}>Cancelar</button>
          <button
            className={`btn grow ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Avatar
export function Avatar({
  member, size = 'md', emoji, color,
}: {
  member?: Pick<Member, 'emoji' | 'colorHex'> | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  emoji?: string;
  color?: string;
}) {
  return (
    <div
      className={`avatar avatar--${size}`}
      style={{ ['--am' as string]: color ?? member?.colorHex ?? 'var(--ac)' }}
    >
      {emoji ?? member?.emoji ?? '🐱'}
    </div>
  );
}

// ---------------------------------------------------------------- Steps
export function Steps({ total, current }: { total: number; current: number }) {
  return (
    <div className="steps">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`steps__dot ${i <= current ? 'steps__dot--on' : ''}`} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Field
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
      {hint && <div className="tiny muted">{hint}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Segmented
export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="wrap">
      {options.map((o) => (
        <button
          key={o.value}
          className={`chip ${value === o.value ? 'chip--on' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.emoji && <span>{o.emoji}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Option
export function Option({
  on, emoji, title, desc, onClick,
}: {
  on: boolean;
  emoji: string;
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button className={`opt ${on ? 'opt--on' : ''}`} onClick={onClick} type="button">
      <span className="opt__emoji">{emoji}</span>
      <span className="grow">
        <span className="opt__title">{title}</span>
        {desc && <div className="tiny muted">{desc}</div>}
      </span>
      {on && <span className="accent bold">✓</span>}
    </button>
  );
}

// ---------------------------------------------------------------- Empty
export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__emoji">{emoji}</span>
      <div className="bold">{title}</div>
      {text && <div className="small" style={{ marginTop: 4 }}>{text}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Loading
export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="center stack" style={{ minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
      <div className="spinner" />
      <div className="small muted">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Toasts
export function Toasts() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.text}</div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- SenhaField
/**
 * Campo da senha da casa. Aparece só onde a ação não tem volta: criar e apagar
 * casa. É um trinco contra o acidente e contra quem não mora aqui, não um
 * sistema de login.
 */
export function SenhaField({
  value, onChange, hint,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <Field label="Senha da casa" hint={hint ?? 'Quem mora aqui sabe qual é.'}>
      <input
        className="input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••"
        maxLength={40}
      />
    </Field>
  );
}

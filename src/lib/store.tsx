import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import {
  ApiError, getHouse, getMeta, getState, ping,
  type House, type HouseSummary, type Member, type Meta,
} from './api';

const LS_HOUSE = 'hk.houseId';
const LS_MEMBER = 'hk.memberId';

const readLS = (key: string): number | null => {
  try {
    const v = localStorage.getItem(key);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};
const writeLS = (key: string, value: number | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch { /* modo privado / storage bloqueado */ }
};

type Toast = { id: number; text: string };

type Ctx = {
  ready: boolean;
  /** Preenchido quando o servidor não responde ou não é o do House Kats. */
  bootError: { message: string; wrongServer: boolean } | null;
  meta: Meta | null;
  /** Só casas prontas. A que está em criação fica fora daqui. */
  houses: HouseSummary[];
  /** Casa em criação, se houver. Não é uma casa até o onboarding terminar. */
  draft: HouseSummary | null;
  house: House | null;
  me: Member | null;
  /** recarrega casas + casa ativa; preferId força qual casa abrir */
  refresh: (preferId?: number) => Promise<void>;
  openHouse: (id: number | null) => Promise<void>;
  setMe: (id: number | null) => void;
  toast: (text: string) => void;
  toasts: Toast[];
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<Ctx['bootError']>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [houses, setHouses] = useState<HouseSummary[]>([]);
  const [draft, setDraft] = useState<HouseSummary | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [meId, setMeId] = useState<number | null>(() => readLS(LS_MEMBER));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const toast = useCallback((text: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const loadHouse = useCallback(async (id: number | null) => {
    if (id === null) {
      setHouse(null);
      writeLS(LS_HOUSE, null);
      return;
    }
    try {
      const h = await getHouse(id);
      setHouse(h);
      writeLS(LS_HOUSE, id);
    } catch {
      // casa apagada em outro dispositivo
      setHouse(null);
      writeLS(LS_HOUSE, null);
      writeLS(LS_MEMBER, null);
      setMeId(null);
    }
  }, []);

  const refresh = useCallback(
    async (preferId?: number) => {
      const st = await getState();
      setHouses(st.houses);
      setDraft(st.draft);

      // a casa em criação tem prioridade: é onde o usuário parou
      const saved = preferId ?? readLS(LS_HOUSE);
      const pronta = st.houses.find((h) => h.id === saved)?.id;
      const target = pronta
        ?? (st.draft && (preferId === st.draft.id || saved === st.draft.id) ? st.draft.id : null)
        ?? st.houses[0]?.id
        ?? st.draft?.id
        ?? null;
      await loadHouse(target);
    },
    [loadHouse]
  );

  useEffect(() => {
    (async () => {
      try {
        // confere primeiro com quem estamos falando: outro app na mesma porta
        // responderia HTML e faria tudo quebrar mais adiante, sem explicação
        const id = await ping();
        if (id?.app !== 'house-kats') {
          setBootError({ message: 'Outro programa está respondendo nesta porta.', wrongServer: true });
          return;
        }
        setMeta(await getMeta());
        await refresh();
      } catch (e) {
        const err = e instanceof ApiError ? e : null;
        setBootError({
          message: err?.message ?? 'Não deu para falar com o servidor.',
          wrongServer: err?.wrongServer ?? false,
        });
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const me = useMemo(() => house?.members.find((m) => m.id === meId) ?? null, [house, meId]);

  // o integrante ativo pinta a UI inteira
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ac', me?.colorHex ?? '#8b5cf6');
    root.style.setProperty('--ac-soft', me?.colorSoft ?? '#c4b5fd');
  }, [me]);

  const setMe = useCallback((id: number | null) => {
    setMeId(id);
    writeLS(LS_MEMBER, id);
  }, []);

  const openHouse = useCallback(
    async (id: number | null) => {
      setMe(null);
      await loadHouse(id);
    },
    [loadHouse, setMe]
  );

  const value: Ctx = { ready, bootError, meta, houses, draft, house, me, refresh, openHouse, setMe, toast, toasts };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp fora do AppProvider');
  return ctx;
}

/** Casa garantidamente carregada, para telas que so rodam depois do onboarding. */
export function useHouse() {
  const { house } = useApp();
  if (!house) throw new Error('useHouse sem casa carregada');
  return house;
}

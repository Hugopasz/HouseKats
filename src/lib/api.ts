// Cliente da API. Tudo passa por aqui para o resto do app nao ver fetch.

export type Diet = 'pouca' | 'media' | 'grande';
export type Goal = 'reduzir' | 'massa' | 'manter';
export type Category = 'proteina' | 'carboidrato' | 'lipidio' | 'ultraprocessado' | 'hortifruti' | 'pet' | 'outro';
export type Unit = 'un' | 'g' | 'kg' | 'ml' | 'l' | 'pacote';

export type Targets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsPerDay: number;
  suggestedKcal?: number;
  customKcal?: number | null;
};

export type Member = {
  id: number;
  house_id: number;
  name: string;
  emoji: string;
  title: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  diet: Diet;
  goal: Goal;
  color: string;
  travel_until: string | null;
  created_at: string;
  colorHex: string;
  colorSoft: string;
  dietLabel: string;
  goalLabel: string;
  targets: Targets;
  traveling: boolean;
  kind: string;
  species: string;
  temporary: number;
  visit_until: string | null;
  coins: number;
  isPet: boolean;
  isVisitor: boolean;
  visitDaysLeft: number | null;
};

export type House = {
  id: number;
  name: string;
  emoji: string;
  chores_unlocked: number;
  travel_until: string | null;
  travel_started_at: string | null;
  onboarding_step: string;
  created_at: string;
  traveling: boolean;
  members: Member[];
};

export type HouseSummary = {
  id: number;
  name: string;
  emoji: string;
  members: number;
  created_at: string;
  onboarding_step: string;
};

export type LogEntry = {
  id: number;
  icon: string;
  message: string;
  kind: string;
  member_id: number | null;
  member_name: string | null;
  member_emoji: string | null;
  created_at: string;
};

export type ColorDef = { label: string; hex: string; soft: string };
export type CategoryDef = { label: string; emoji: string; color: string };
export type DietDef = { label: string; emoji: string; factor: number; mealsPerDay: number; desc: string };
export type GoalDef = { label: string; emoji: string; kcalAdj: number; proteinPerKg: number; desc: string };

export type Meta = {
  colors: Record<string, ColorDef>;
  titles: string[];
  avatars: string[];
  petAvatars: string[];
  species: Record<string, { emoji: string; label: string; racao: string }>;
  rewards: string[];
  roomEmojis: string[];
  categories: Record<Category, CategoryDef>;
  units: Unit[];
  diets: Record<Diet, DietDef>;
  goals: Record<Goal, GoalDef>;
};

export type FoodSuggestion = { name: string; category: Category; unit: Unit; emoji: string };

// ---------------------------------------------------------------- transporte
export class ApiError extends Error {
  status: number;
  /** true = quem respondeu não é o servidor do House Kats. */
  wrongServer: boolean;
  constructor(message: string, status: number, wrongServer = false) {
    super(message);
    this.status = status;
    this.wrongServer = wrongServer;
  }
}

const WRONG_SERVER =
  'A porta está ocupada por outro programa. Quem respondeu não foi o House Kats.';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = lerToken();
    if (token) headers['x-casa-token'] = token;

    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor. Ele ainda está rodando?', 0);
  }

  const text = await res.text();

  // Outro app na mesma porta responde HTML. Sem esta guarda, o JSON.parse
  // estoura um "Unexpected token '<'" que não ajuda ninguém.
  let data: { error?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(WRONG_SERVER, res.status, true);
    }
  }

  // porteiro recusou: o crachá venceu ou a senha mudou
  if (res.status === 401 && path !== '/entrar') {
    esquecerToken();
    aoTrancar?.();
  }

  if (!res.ok) throw new ApiError(data?.error ?? `Erro ${res.status}`, res.status);
  return data as T;
}

// ---------------------------------------------------------------- tranca
/**
 * Crachá do aparelho. Depois de acertar a senha da casa uma vez, ele fica
 * guardado aqui e vai junto em toda requisição, para ninguém digitar senha a
 * cada tela. Some quando o servidor recusa (senha trocada, sessão revogada).
 */
const CHAVE_TOKEN = 'hk.token';

export const lerToken = () => {
  try { return localStorage.getItem(CHAVE_TOKEN) ?? ''; } catch { return ''; }
};
export const guardarToken = (t: string) => {
  try { localStorage.setItem(CHAVE_TOKEN, t); } catch { /* modo anônimo */ }
};
export const esquecerToken = () => {
  try { localStorage.removeItem(CHAVE_TOKEN); } catch { /* modo anônimo */ }
};

/** Avisa o app inteiro que a casa trancou, para a tela da senha aparecer. */
let aoTrancar: (() => void) | null = null;
export const quandoTrancar = (fn: () => void) => { aoTrancar = fn; };

export const entrarNaCasa = async (senha: string) => {
  const r = await request<{ ok: true; token: string }>('POST', '/entrar', { senha });
  guardarToken(r.token);
  return r;
};

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T,>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};

// ---------------------------------------------------------------- endpoints
export const ping = () => api.get<{ app: string; ok: boolean }>('/ping');
export const getMeta = () => api.get<Meta>('/meta');
export const getState = () =>
  api.get<{ houses: HouseSummary[]; draft: HouseSummary | null; hasHouse: boolean }>('/state');

/** Joga fora a casa que ficou pela metade. */
export const discardDraft = () => api.del<{ ok: true; discarded: number }>('/draft');
export const getHouse = (id: number) => api.get<House>(`/houses/${id}`);
export const createHouse = (name: string, emoji: string, senha: string) =>
  api.post<House>('/houses', { name, emoji, senha });
export const patchHouse = (id: number, body: Record<string, unknown>) => api.patch<House>(`/houses/${id}`, body);
export const deleteHouse = (id: number, senha: string) => api.del<{ ok: true }>(`/houses/${id}`, { senha });

export const addMember = (houseId: number, body: Record<string, unknown>) =>
  api.post<Member>(`/houses/${houseId}/members`, body);
export const patchMember = (id: number, body: Record<string, unknown>) =>
  api.patch<Member>(`/members/${id}`, body);
export const deleteMember = (id: number) => api.del<{ ok: true }>(`/members/${id}`);

export const getLog = (houseId: number, limit = 60) =>
  api.get<LogEntry[]>(`/houses/${houseId}/log?limit=${limit}`);

export const randomTitle = (used: string[]) =>
  api.get<{ title: string }>(`/meta/title?used=${encodeURIComponent(used.join('|'))}`);
export const randomReward = () => api.get<{ text: string }>('/meta/reward');
export const searchFoods = (q: string) =>
  api.get<FoodSuggestion[]>(`/meta/foods?q=${encodeURIComponent(q)}`);

export type StarterItem = { name: string; qty: number; unit: Unit; category: Category; emoji: string };

/** Básicos da despensa sugeridos no passo inicial da geladeira. */
export const getStarterItems = () => api.get<StarterItem[]>('/meta/starter');

// ---------------------------------------------------------------- geladeira
export type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export type ItemStatus = 'ok' | 'atencao' | 'urgente' | 'vencido' | 'congelado';
export type Origin = 'comprado' | 'delivery' | 'ganho' | 'ajuste';
export type RemoveReason = 'consumido' | 'estragou' | 'ajuste';

export type PantryItem = {
  id: number;
  house_id: number;
  name: string;
  category: Category;
  qty: number;
  unit: Unit;
  expires_at: string | null;
  expiry_source: 'auto' | 'manual';
  for_member_id: number | null;
  macros: Macros;
  daysLeft: number | null;
  status: ItemStatus;
  frozen: boolean;
  isLeftover: boolean;
  kind: string;
  note: string;
  emoji: string;
  categoryLabel: string;
  categoryEmoji: string;
  categoryColor: string;
};

export type MealsInfo = {
  meals: number;
  days: number;
  bottleneck: 'proteina' | 'carboidrato';
  bottleneckLabel: string;
  totals: { protein: number; carbs: number; kcal: number };
  itemCount: number;
};

/** Quantas receitas do livro dão para fazer agora, por tipo. */
export type Cozinhavel = { key: string; label: string; emoji: string; n: number; total: number };

export type Dashboard = {
  meals: MealsInfo | null;
  cozinhaveis: Cozinhavel[];
  me: {
    targets: Targets;
    nutrition: Macros & { count: number };
    streak: { current: number; best: number };
    pct: { kcal: number; protein: number; carbs: number; fat: number };
  } | null;
  expiring: PantryItem[];
  leftoversExpired: PantryItem[];
  frozenCount: number;
  spentMonth: number;
  houseMembers: { id: number; name: string; emoji: string }[];
};

/**
 * Pendência de consumo. Quando veio de um preparo, os ingredientes chegam
 * agrupados numa linha só, com o nome do prato em item_name.
 */
export type Claim = {
  kind: 'item' | 'receita';
  id: number;
  /** todos os avisos que essa linha resolve de uma vez */
  ids: number[];
  share: number;
  status: string;
  day: string;
  item_name: string;
  delta: number;
  unit: Unit;
  category: Category;
  logged_by: number | null;
  logged_by_name: string | null;
  logged_by_emoji: string | null;
  // só nas linhas de receita
  cook_id?: number;
  emoji?: string;
  servings?: number;
  ingredientes?: { name: string; qty: number; unit: Unit }[];
};

export const getPantry = (houseId: number) => api.get<PantryItem[]>(`/houses/${houseId}/pantry`);

export const addPantryItem = (houseId: number, body: Record<string, unknown>) =>
  api.post<PantryItem>(`/houses/${houseId}/pantry`, body);

export const removePantryItems = (
  houseId: number,
  body: { loggedBy: number; reason: RemoveReason; lines: { item_id: number; qty: number }[]; consumers?: number[] }
) => api.post<{ ok: true; removed: number; pantry: PantryItem[] }>(`/houses/${houseId}/pantry/remove`, body);

export const patchPantryItem = (id: number, body: Record<string, unknown>) =>
  api.patch<PantryItem>(`/pantry/${id}`, body);

export const deletePantryItem = (id: number) => api.del<{ ok: true }>(`/pantry/${id}`);

export const getDashboard = (houseId: number, meId: number) =>
  api.get<Dashboard>(`/houses/${houseId}/dashboard?me=${meId}`);

export const getClaims = (memberId: number) => api.get<Claim[]>(`/members/${memberId}/claims`);

/** Resolve a linha inteira: um item solto ou todos os ingredientes de um prato. */
export const resolveClaimGroup = (ids: number[], action: 'confirm' | 'contest') =>
  api.post<{ ok: true; action: string; resolvidos: number }>('/claims/resolve-group', { ids, action });

export const resolveClaim = (id: number, action: 'confirm' | 'contest') =>
  api.post<{ ok: true }>(`/claims/${id}/resolve`, { action });

// ---------------------------------------------------------------- receitas
export type Ingredient = { name: string; qty: number; unit: Unit; category: Category; optional: number };

export type Recipe = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  minutes: number;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  steps: string[];
  ingredients: Ingredient[];
};

export type DiscoverCard = Recipe & { haveCount: number };

export type BookRecipe = Recipe & {
  hr_id: number;
  times_cooked: number;
  comfort: number;
  added_by_name: string | null;
  added_by_emoji: string | null;
  avg_stars: number | null;
  rating_count: number;
  my_stars: number | null;
  missing: string[];
  canCook: boolean;
};

export type CatalogRecipe = Recipe & { inBook: boolean };

export type ShoppingItem = {
  id: number;
  list_id: number;
  name: string;
  qty: number;
  unit: Unit;
  category: Category;
  checked: boolean;
  price: number | null;
  note: string;
  emoji: string;
  estimate: number;
  priceExact: boolean;
};

export type ShoppingList = {
  id: number;
  house_id: number;
  title: string;
  status: 'aberta' | 'fechada';
  days: number;
  meals_per_day: number;
  created_at: string;
  items: ShoppingItem[];
  total: number;
  previsto: number;
  estimado: number;
  precosAtualizadosEm: string;
  checkedCount: number;
};

export type ShoppingPreview = {
  days: number;
  mealsPerDay: number;
  totalMeals: number;
  items: (Omit<ShoppingItem, 'id' | 'list_id' | 'checked' | 'price'>)[];
  orcamento?: { total: number; exatos: number; itens: number; atualizadaEm: string };
  recipes: { id: number; name: string; emoji: string; meals: number; comfort: boolean; type: string }[];
  empty?: string;
};

export type ShoppingOptions = {
  days?: number;
  members?: number[];
  onlyFavorites?: boolean;
  includeExpiring?: boolean;
  created_by?: number;
  title?: string;
};

export const getDiscover = (houseId: number, memberId: number) =>
  api.get<{ done: boolean; remaining: number; cards: DiscoverCard[]; swipedToday: number }>(
    `/houses/${houseId}/discover?member=${memberId}`
  );

export const swipeRecipe = (houseId: number, body: { member_id: number; recipe_id: number; liked: boolean }) =>
  api.post<{ ok: true }>(`/houses/${houseId}/discover/swipe`, body);

export const getBook = (houseId: number, meId: number) =>
  api.get<BookRecipe[]>(`/houses/${houseId}/recipes?me=${meId}`);

export const getCatalog = (houseId: number, q = '') =>
  api.get<CatalogRecipe[]>(`/catalog?house=${houseId}&q=${encodeURIComponent(q)}`);

export const addToBook = (houseId: number, recipeId: number, memberId: number | null) =>
  api.post<{ ok: true }>(`/houses/${houseId}/recipes/${recipeId}`, { member_id: memberId });

export const removeFromBook = (houseId: number, recipeId: number) =>
  api.del<{ ok: true }>(`/houses/${houseId}/recipes/${recipeId}`);

export const rateRecipe = (hrId: number, memberId: number, stars: number) =>
  api.post<{ ok: true; avg: number }>(`/house-recipes/${hrId}/rate`, { member_id: memberId, stars });

/** O que falta no armário para fazer a receita em N porções. */
export type CookCheck = {
  servings: number;
  ok: boolean;
  faltando: { name: string; precisa: number; tem: number; unit: string; motivo: 'nao-tem' | 'pouco' }[];
};

export const checkRecipe = (hrId: number, servings: number) =>
  api.get<CookCheck>(`/house-recipes/${hrId}/check?servings=${servings}`);

export const cookRecipe = (hrId: number, body: { member_id: number; servings?: number; deduct?: boolean; eaters?: number[]; guests?: number }) =>
  api.post<{ ok: true; times_cooked: number; comfort: boolean; deducted: string[]; guests: number; servings: number; faltou: CookCheck['faltando'] }>(
    `/house-recipes/${hrId}/cook`, body
  );

// ---------------------------------------------------------------- compras
export const previewShopping = (houseId: number, opts: ShoppingOptions) =>
  api.post<ShoppingPreview>(`/houses/${houseId}/shopping/preview`, opts);

export const createShopping = (houseId: number, opts: ShoppingOptions) =>
  api.post<ShoppingList>(`/houses/${houseId}/shopping`, opts);

export const getShopping = (houseId: number) =>
  api.get<ShoppingList | null>(`/houses/${houseId}/shopping`);

export const addShoppingItem = (listId: number, body: Record<string, unknown>) =>
  api.post<ShoppingList>(`/shopping-lists/${listId}/items`, body);

export const patchShoppingItem = (id: number, body: Record<string, unknown>) =>
  api.patch<ShoppingList>(`/shopping-items/${id}`, body);

export const deleteShoppingItem = (id: number) => api.del<ShoppingList>(`/shopping-items/${id}`);

export const closeShopping = (listId: number, body: { stock: boolean; member_id: number }) =>
  api.post<{ ok: true; stocked: number }>(`/shopping-lists/${listId}/close`, body);

// ---------------------------------------------------------------- tarefinhas
export type RoomSize = 'pequeno' | 'medio' | 'grande';

export type Room = {
  id: number;
  house_id: number;
  name: string;
  emoji: string;
  size: RoomSize;
};

/** Tarefa especial. repeat_days = 0 some ao ser feita; N volta N dias depois. */
export type SpecialChore = {
  id: number;
  name: string;
  emoji: string;
  active: number;
  repeat_days: number;
  next_at: string | null;
  /** dias até voltar para a lista; null quando já está nela */
  voltaEm: number | null;
};

export type Chore = {
  id: number;
  house_id: number;
  name: string;
  emoji: string;
  room_id: number | null;
  is_special: boolean;
  owner_id: number | null;
  room_name: string | null;
  room_emoji: string | null;
  minutes: number;
  difficulty: number;
  stars: number;
  daysSince: number | null;
  neverDone: boolean;
  done_count: number;
};

export type SurveyMember = {
  id: number;
  name: string;
  emoji: string;
  choreVotes: number;
  roomVotes: number;
  completed: boolean;
  progress: number;
};

export type SetupState = {
  unlocked: boolean;
  rooms: (Room & { chores: { id: number; name: string; emoji: string }[]; avgDifficulty: number | null })[];
  survey: {
    members: SurveyMember[];
    totalChores: number;
    totalRooms: number;
    everyoneDone: boolean;
    pending: string[];
  };
  vetos?: { total: number; faltando: { id: number; name: string; emoji: string }[]; completo: boolean };
  ready: boolean;
};

export type SurveyChore = {
  id: number;
  name: string;
  emoji: string;
  room_name: string | null;
  room_emoji: string | null;
  myMinutes: number | null;
  myDifficulty: number | null;
  suggestedMinutes: number;
  suggestedDifficulty: number;
};

export type SurveyRoom = Room & { myVote: number | null; suggested: number };

export type Plan = {
  budget: number;
  plan: Chore[];
  totalMinutes: number;
  totalStars: number;
  leftover: number;
};

export type BoardRow = {
  id: number; name: string; emoji: string; color: string;
  stars: number; minutes: number; tasks: number; rank: number;
};

export type Board = { month: string; rows: BoardRow[]; total: number };

export type CalendarEntry = {
  id: number; chore_name: string; member_id: number; member_name: string;
  member_emoji: string; member_color: string; minutes: number; stars: number; day: string;
};

/** Especial que volta nesse dia. O calendário mostra junto com o que já foi feito. */
export type CalendarRepeat = {
  id: number; name: string; emoji: string; repeat_days: number; day: string;
  member_id: number; member_name: string; member_emoji: string;
};

export type CalendarData = { feitas: CalendarEntry[]; aRepetir: CalendarRepeat[] };

export type Reward = { id: number; month: string; text: string; chosen_by: number | null; chosen_by_name?: string | null };

export type ChoreDashboard = {
  board: Board;
  me: BoardRow | null;
  today: { count: number; stars: number };
  specials: SpecialChore[];
  stale: Chore[];
  reward: Reward | null;
};

export type RoomPreset = { key: string; name: string; emoji: string };

export const getChorePresets = () =>
  api.get<{ rooms: RoomPreset[]; chores: Record<string, { name: string; emoji: string }[]>; specials: string[] }>(
    '/chores/presets'
  );

export const getSetup = (houseId: number) => api.get<SetupState>(`/houses/${houseId}/chores/setup`);

export const addRoom = (houseId: number, body: Record<string, unknown>) =>
  api.post<Room>(`/houses/${houseId}/rooms`, body);

export const deleteRoom = (id: number) => api.del<{ ok: true }>(`/rooms/${id}`);

export const getSurvey = (houseId: number, memberId: number) =>
  api.get<{ rooms: SurveyRoom[]; chores: SurveyChore[]; completed: boolean; block: number }>(
    `/houses/${houseId}/survey?member=${memberId}`
  );

export const postSurvey = (houseId: number, body: Record<string, unknown>) =>
  api.post<SetupState['survey']>(`/houses/${houseId}/survey`, body);

export const getChores = (houseId: number, memberId: number) =>
  api.get<Chore[]>(`/houses/${houseId}/chores?member=${memberId}`);

export const addChore = (houseId: number, body: Record<string, unknown>) =>
  api.post<Chore>(`/houses/${houseId}/chores`, body);

export const deleteChore = (id: number) => api.del<{ ok: true }>(`/chores/${id}`);

/** Trazer de volta agora uma especial que estava esperando a data de repetir. */
export const reviveChore = (id: number) =>
  api.post<SpecialChore>(`/chores/${id}/revive`);

export const getPlan = (houseId: number, memberId: number, minutes: number) =>
  api.get<Plan>(`/houses/${houseId}/chores/plan?member=${memberId}&minutes=${minutes}`);

export const markDone = (houseId: number, memberId: number, choreIds: number[]) =>
  api.post<{ stars: number; minutes: number; count: number; board: Board }>(
    `/houses/${houseId}/chores/done`, { member_id: memberId, chore_ids: choreIds }
  );

export const getChoreDashboard = (houseId: number, memberId: number) =>
  api.get<ChoreDashboard>(`/houses/${houseId}/chores/dashboard?member=${memberId}`);

export const getCalendar = (houseId: number, month?: string) =>
  api.get<CalendarData>(`/houses/${houseId}/chores/calendar${month ? `?month=${month}` : ''}`);

export const setReward = (houseId: number, body: { text?: string; member_id: number }) =>
  api.post<Reward>(`/houses/${houseId}/reward`, body);

// ---------------------------------------------------------------- insights
export type Insights = {
  months: number;
  totalSpent: number;
  spendByMonth: { month: string; total: number; items: number }[];
  spendByCategory: { category: Category; total: number; items: number; label: string; emoji: string; color: string }[];
  spendBySource: { reason: string; total: number; items: number; label: string; emoji: string; color: string; pct: number }[];
  deliveryByMonth: { month: string; total: number; items: number }[];
  deliveryTotal: number;
  mercadoTotal: number;
  deliveryPct: number;
  topBought: { name: string; times: number; spent: number; emoji: string }[];
  wasted: { name: string; times: number; emoji: string }[];
  wastePct: number;
  spoiledCount: number;
  topCooked: { name: string; emoji: string; times: number; comfort: boolean; stars: number | null }[];
  topRated: { name: string; emoji: string; stars: number; votes: number }[];
  eatenByCategory: { category: Category; qty: number; times: number; label: string; emoji: string; color: string }[];
  byMember: {
    id: number; name: string; emoji: string; color: string;
    meals: number; purchases: number; spent: number; chores: number; stars: number;
  }[];
  costPerPersonDay: number;
  personDays: number;
  mealsLogged: number;
};

export const getInsights = (houseId: number, months = 6) =>
  api.get<Insights>(`/houses/${houseId}/insights?months=${months}`);

// ---------------------------------------------------------------- modo viagem
export type Travel = {
  id: number;
  house_id: number;
  member_id: number | null;
  member_name?: string | null;
  start_day: string;
  end_day: string;
  note: string;
};

export type TravelPlan = {
  days: number;
  returnDay: string;
  today: string;
  consumir: PantryItem[];
  congelar: PantryItem[];
  doar: PantryItem[];
  sobrevive: PantryItem[];
  atRisk: number;
  total: number;
};

export const getTravel = (houseId: number, memberId?: number) =>
  api.get<{ active: Travel | null; upcoming: Travel[] }>(
    `/houses/${houseId}/travel${memberId ? `?member=${memberId}` : ''}`
  );

export const getTravelPlan = (houseId: number, days: number) =>
  api.get<TravelPlan>(`/houses/${houseId}/travel/plan?days=${days}`);

export const startTravel = (houseId: number, body: { days: number; member_id?: number | null; note?: string }) =>
  api.post<Travel & { plan: TravelPlan }>(`/houses/${houseId}/travel`, body);

export const endTravel = (id: number) => api.del<{ ok: true }>(`/travel/${id}`);

export const resolveTravelItems = (
  houseId: number,
  body: { item_ids: number[]; action: 'consumido' | 'estragou' | 'ajuste'; member_id: number }
) => api.post<{ ok: true; resolved: number }>(`/houses/${houseId}/travel/resolve`, body);

// ---------------------------------------------------------------- modo demo
export type DemoProfile = {
  key: string; label: string; tag: string; emoji: string; desc: string;
  people: number; historyDays: number;
};

export const getDemoProfiles = () => api.get<DemoProfile[]>('/demo/profiles');

export const createDemo = (profile: string, senha: string) =>
  api.post<{ houseId: number; profile: string; members: number }>('/demo', { profile, senha });

export const clearDemos = (senha: string) => api.del<{ ok: true; removed: number }>('/demo', { senha });

// ---------------------------------------------------------------- sobras e congelador
export const getLeftovers = (houseId: number) =>
  api.get<{ ativas: PantryItem[]; vencidas: PantryItem[] }>(`/houses/${houseId}/leftovers`);

export const addLeftover = (houseId: number, body: Record<string, unknown>) =>
  api.post<PantryItem>(`/houses/${houseId}/leftovers`, body);

export const toggleFreeze = (itemId: number, frozen: boolean, memberId: number | null) =>
  api.post<PantryItem>(`/pantry/${itemId}/freeze`, { frozen, member_id: memberId });

/** Autocomplete com os alimentos que esta casa já usou, além da tabela do app. */
export const searchHouseFoods = (houseId: number, q: string) =>
  api.get<(FoodSuggestion & { daCasa?: boolean })[]>(`/houses/${houseId}/foods?q=${encodeURIComponent(q)}`);

// ---------------------------------------------------------------- humor
export type Mood = {
  id: number; member_id: number; member_name?: string;
  emoji: string; label: string; note: string; day: string;
};

export const getMoods = (houseId: number, memberId?: number) =>
  api.get<{ hoje: Mood | null; historico: Mood[] }>(
    `/houses/${houseId}/moods${memberId ? `?member=${memberId}` : ''}`
  );

export const setMood = (houseId: number, body: Record<string, unknown>) =>
  api.post<{ ok: true }>(`/houses/${houseId}/moods`, body);

// ---------------------------------------------------------------- veto de tarefas
export type Veto = {
  id: number; member_id: number; chore_id: number;
  member_name: string; member_emoji: string; chore_name: string; chore_emoji: string;
};

export const getVetos = (houseId: number) =>
  api.get<{
    vetos: Veto[]; tomadas: number[];
    faltam: { id: number; name: string; emoji: string }[];
    todosEscolheram: boolean;
  }>(`/houses/${houseId}/vetos`);

export const setVeto = (houseId: number, memberId: number, choreId: number) =>
  api.post<{ ok: true }>(`/houses/${houseId}/vetos`, { member_id: memberId, chore_id: choreId });

export const resetChorePrefs = (houseId: number, body: { member_id?: number; everyone?: boolean }) =>
  api.post<{ ok: true }>(`/houses/${houseId}/chores/reset`, body);

// ---------------------------------------------------------------- votação
export type RewardPoll = {
  id: number; month: string; status: 'aberta' | 'fechada'; winner: string | null;
  options: { id: number; text: string; votes: number }[];
  totalVotes: number;
  myVote: number | null;
  pending: { id: number; name: string; emoji: string }[];
  everyoneVoted: boolean;
};

export const getRewardPoll = (houseId: number, memberId?: number) =>
  api.get<RewardPoll | null>(`/houses/${houseId}/reward-poll${memberId ? `?member=${memberId}` : ''}`);

export const createRewardPoll = (houseId: number, memberId: number, options: string[]) =>
  api.post<{ ok: true; poll_id: number }>(`/houses/${houseId}/reward-poll`, { member_id: memberId, options });

export const voteReward = (pollId: number, memberId: number, optionId: number) =>
  api.post<{ ok: true; encerrada: boolean }>(`/reward-poll/${pollId}/vote`, {
    member_id: memberId, option_id: optionId,
  });

// ---------------------------------------------------------------- líquidos
export type Drink = {
  id: number; name: string; drink_key: string; kind: string;
  ml: number; water_ml: number; debt_ml: number; source: string; day: string;
};

export type DrinkCatalogItem = {
  key: string; label: string; emoji: string; hydration: number; debt: number; kind: string;
};

export type DrinkDay = {
  day: string;
  goles: Drink[];
  agua: number;
  volume: number;
  meta: { base: number; extra: number; total: number };
  pct: number;
  falta: number;
  porTipo: { kind: string; ml: number; water: number; count: number }[];
  avisos: { kind: string; emoji: string; titulo: string; texto: string; ml: number }[];
  naGeladeira: {
    id: number; name: string; qty: number; unit: Unit; emoji: string;
    hydration: number; kind: string; disponivelMl: number;
  }[];
  historico: { day: string; agua: number; volume: number; divida: number; meta: number; pct: number }[];
};

export const getDrinkCatalog = () =>
  api.get<{ bebidas: DrinkCatalogItem[]; copos: { ml: number; label: string; emoji: string }[] }>('/drinks/catalog');

export const getDrinks = (houseId: number, memberId: number) =>
  api.get<DrinkDay>(`/houses/${houseId}/drinks?member=${memberId}`);

export const logDrink = (houseId: number, body: Record<string, unknown>) =>
  api.post<{ ml: number; water_ml: number; debt_ml: number; resumo: DrinkDay }>(`/houses/${houseId}/drinks`, body);

export const deleteDrink = (id: number) => api.del<{ ok: true }>(`/drinks/${id}`);

// ---------------------------------------------------------------- a praça
export type Bichinho = {
  id: number; name: string; emoji: string; color: string; kind: string; species: string;
  temporary: boolean; coins: number;
  humor: string | null; humorLabel: string;
  animo: number; estado: string;
  streak: number; tarefasHoje: number; comeuHoje: number; agua: number;
};

export type PlazaItem = { id: number; item_key: string; x: number; y: number; emoji: string; label: string };
export type PlazaCatalogItem = { key: string; emoji: string; label: string; preco: number; dica: string; comprado: boolean };

/** Fundo da praça: `chao` pinta o gramado, `piso` o calçadão do meio. */
export type PlazaBackground = {
  key: string; emoji: string; label: string; preco: number; dica: string;
  chao: string; piso: string;
  comprado: boolean; ativo: boolean;
};

export type Plaza = {
  bichinhos: Bichinho[];
  itens: PlazaItem[];
  catalogo: PlazaCatalogItem[];
  fundo: { key: string; emoji: string; label: string; chao: string; piso: string };
  fundos: PlazaBackground[];
  cofre: number;
  conversas: { de: number | null; texto: string; sentimento?: string }[];
  sugestao: {
    member: { id: number; name: string; emoji: string };
    humor: string | null; humorLabel: string;
    recipe: { hr_id: number; name: string; emoji: string; minutes: number; servings: number };
    texto: string;
  } | null;
  treats: { id: number; label: string; emoji: string; quem: string | null }[];
  climaDaCasa: { emoji: string; texto: string };
};

export const getPlaza = (houseId: number) => api.get<Plaza>(`/houses/${houseId}/plaza`);

export const buyPlazaItem = (houseId: number, memberId: number, itemKey: string) =>
  api.post<{ ok: true; praca: Plaza }>(`/houses/${houseId}/plaza/buy`, { member_id: memberId, item_key: itemKey });

export const setPlazaBackground = (houseId: number, key: string) =>
  api.post<{ ok: true; praca: Plaza }>(`/houses/${houseId}/plaza/background`, { key });

export const throwTreat = (houseId: number, body: Record<string, unknown>) =>
  api.post<{
    ok: true; label: string; emoji: string;
    reacoes: { member: { id: number; name: string; emoji: string }; nota: number | null; fala: string; gostou: boolean | null }[];
  }>(`/houses/${houseId}/plaza/treat`, body);

export const getCoins = (houseId: number) =>
  api.get<{
    cofre: number;
    porIntegrante: { id: number; name: string; emoji: string; coins: number }[];
    historico: { id: number; amount: number; reason: string; ref: string; quem: string | null; day: string }[];
  }>(`/houses/${houseId}/coins`);

// ---------------------------------------------------------------- visitantes
export const getVisitors = (houseId: number) =>
  api.get<{ ativos: Member[]; vencidos: Member[] }>(`/houses/${houseId}/visitors`);

export const resolveVisit = (memberId: number, action: 'remover' | 'estender' | 'efetivar', days?: number) =>
  api.post<{ ok: true; action: string }>(`/members/${memberId}/visit`, { action, days });

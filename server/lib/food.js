// Referencia de alimentos: macros aproximados (por 100g ou 100ml), durabilidade
// estimada em dias e emoji. Serve para estimar nutrientes e alimentar o Modo Viagem.
// Os valores sao aproximacoes de uso domestico, nao tabela nutricional oficial.

export const CATEGORIES = {
  proteina: { label: 'Proteína', emoji: '🍗', color: '#e8615a' },
  carboidrato: { label: 'Carboidrato', emoji: '🍚', color: '#e5a13a' },
  lipidio: { label: 'Lipídios', emoji: '🥑', color: '#5aa86e' },
  ultraprocessado: { label: 'Ultraprocessados', emoji: '🍪', color: '#a06ad4' },
  hortifruti: { label: 'Hortifrúti', emoji: '🥬', color: '#3fae8f' },
  pet: { label: 'Pet', emoji: '🐾', color: '#c98a3c' },
  outro: { label: 'Outro', emoji: '🧂', color: '#7c8496' },
};

export const UNITS = ['un', 'g', 'kg', 'ml', 'l', 'pacote'];

// kcal / p (proteina) / c (carbo) / f (gordura) por 100g|100ml.
// days = validade estimada a partir da compra. unit = unidade sugerida no modal.
export const FOODS = {
  // ---- proteinas
  'frango': { e: '🍗', cat: 'proteina', kcal: 165, p: 31, c: 0, f: 3.6, days: 3, unit: 'g' },
  'peito de frango': { e: '🍗', cat: 'proteina', kcal: 165, p: 31, c: 0, f: 3.6, days: 3, unit: 'g' },
  'coxa de frango': { e: '🍗', cat: 'proteina', kcal: 209, p: 26, c: 0, f: 11, days: 3, unit: 'g' },
  'carne moida': { e: '🥩', cat: 'proteina', kcal: 250, p: 26, c: 0, f: 16, days: 2, unit: 'g' },
  'carne': { e: '🥩', cat: 'proteina', kcal: 250, p: 26, c: 0, f: 17, days: 3, unit: 'g' },
  'patinho': { e: '🥩', cat: 'proteina', kcal: 219, p: 32, c: 0, f: 9, days: 3, unit: 'g' },
  'alcatra': { e: '🥩', cat: 'proteina', kcal: 241, p: 28, c: 0, f: 14, days: 3, unit: 'g' },
  'bife': { e: '🥩', cat: 'proteina', kcal: 241, p: 28, c: 0, f: 14, days: 3, unit: 'g' },
  'linguica': { e: '🌭', cat: 'proteina', kcal: 296, p: 16, c: 2, f: 25, days: 5, unit: 'g' },
  'bacon': { e: '🥓', cat: 'lipidio', kcal: 541, p: 37, c: 1, f: 42, days: 10, unit: 'g' },
  'peixe': { e: '🐟', cat: 'proteina', kcal: 130, p: 24, c: 0, f: 3, days: 2, unit: 'g' },
  'tilapia': { e: '🐟', cat: 'proteina', kcal: 128, p: 26, c: 0, f: 2.7, days: 2, unit: 'g' },
  'salmao': { e: '🐟', cat: 'proteina', kcal: 208, p: 20, c: 0, f: 13, days: 2, unit: 'g' },
  'atum': { e: '🐟', cat: 'proteina', kcal: 132, p: 28, c: 0, f: 1, days: 365, unit: 'g' },
  'sardinha': { e: '🐟', cat: 'proteina', kcal: 208, p: 25, c: 0, f: 11, days: 365, unit: 'g' },
  'ovo': { e: '🥚', cat: 'proteina', kcal: 155, p: 13, c: 1.1, f: 11, days: 21, unit: 'un', gPerUn: 55 },
  'ovos': { e: '🥚', cat: 'proteina', kcal: 155, p: 13, c: 1.1, f: 11, days: 21, unit: 'un', gPerUn: 55 },
  'feijao': { e: '🫘', cat: 'proteina', kcal: 76, p: 4.8, c: 13.6, f: 0.5, days: 240, unit: 'g' },
  'lentilha': { e: '🫘', cat: 'proteina', kcal: 116, p: 9, c: 20, f: 0.4, days: 300, unit: 'g' },
  'grao de bico': { e: '🫘', cat: 'proteina', kcal: 164, p: 9, c: 27, f: 2.6, days: 300, unit: 'g' },
  'queijo': { e: '🧀', cat: 'proteina', kcal: 350, p: 25, c: 2, f: 27, days: 15, unit: 'g' },
  'queijo minas': { e: '🧀', cat: 'proteina', kcal: 264, p: 17, c: 3, f: 20, days: 7, unit: 'g' },
  'mussarela': { e: '🧀', cat: 'proteina', kcal: 300, p: 22, c: 2, f: 22, days: 12, unit: 'g' },
  'presunto': { e: '🥓', cat: 'proteina', kcal: 145, p: 18, c: 1.5, f: 7, days: 7, unit: 'g' },
  'iogurte': { e: '🥛', cat: 'proteina', kcal: 61, p: 3.5, c: 4.7, f: 3.3, days: 14, unit: 'ml' },
  'leite': { e: '🥛', cat: 'proteina', kcal: 61, p: 3.2, c: 4.8, f: 3.3, days: 5, unit: 'ml' },
  'requeijao': { e: '🧀', cat: 'lipidio', kcal: 257, p: 9, c: 3, f: 23, days: 15, unit: 'g' },
  'tofu': { e: '🧊', cat: 'proteina', kcal: 76, p: 8, c: 1.9, f: 4.8, days: 7, unit: 'g' },
  'whey': { e: '💪', cat: 'proteina', kcal: 400, p: 80, c: 8, f: 5, days: 365, unit: 'g' },

  // ---- pet (so aparece quando a casa tem bichinho)
  'racao': { e: '🐾', cat: 'pet', kcal: 350, p: 25, c: 45, f: 12, days: 60, unit: 'kg' },
  'racao de cachorro': { e: '🐶', cat: 'pet', kcal: 350, p: 25, c: 45, f: 12, days: 60, unit: 'kg' },
  'racao de gato': { e: '🐱', cat: 'pet', kcal: 380, p: 32, c: 32, f: 14, days: 60, unit: 'kg' },
  'racao de roedor': { e: '🐹', cat: 'pet', kcal: 330, p: 15, c: 55, f: 6, days: 90, unit: 'g' },
  'racao de peixe': { e: '🐠', cat: 'pet', kcal: 340, p: 40, c: 20, f: 8, days: 120, unit: 'g' },
  'racao de reptil': { e: '🦎', cat: 'pet', kcal: 320, p: 35, c: 25, f: 9, days: 90, unit: 'g' },
  'alpiste': { e: '🐦', cat: 'pet', kcal: 380, p: 14, c: 55, f: 8, days: 120, unit: 'g' },
  'petisco de pet': { e: '🦴', cat: 'pet', kcal: 320, p: 20, c: 50, f: 8, days: 90, unit: 'g' },
  'areia de gato': { e: '🐈', cat: 'pet', kcal: 0, p: 0, c: 0, f: 0, days: 180, unit: 'kg' },

  // ---- carboidratos
  'arroz': { e: '🍚', cat: 'carboidrato', kcal: 130, p: 2.7, c: 28, f: 0.3, days: 365, unit: 'g' },
  'arroz integral': { e: '🍚', cat: 'carboidrato', kcal: 124, p: 2.6, c: 26, f: 1, days: 300, unit: 'g' },
  'macarrao': { e: '🍝', cat: 'carboidrato', kcal: 158, p: 5.8, c: 31, f: 0.9, days: 365, unit: 'g' },
  'espaguete': { e: '🍝', cat: 'carboidrato', kcal: 158, p: 5.8, c: 31, f: 0.9, days: 365, unit: 'g' },
  'pao': { e: '🍞', cat: 'carboidrato', kcal: 265, p: 9, c: 49, f: 3.2, days: 4, unit: 'un', gPerUn: 50 },
  'pao de forma': { e: '🍞', cat: 'carboidrato', kcal: 265, p: 9, c: 49, f: 3.2, days: 7, unit: 'un', gPerUn: 25 },
  'batata': { e: '🥔', cat: 'carboidrato', kcal: 77, p: 2, c: 17, f: 0.1, days: 20, unit: 'g' },
  'batata doce': { e: '🍠', cat: 'carboidrato', kcal: 86, p: 1.6, c: 20, f: 0.1, days: 20, unit: 'g' },
  'mandioca': { e: '🥔', cat: 'carboidrato', kcal: 160, p: 1.4, c: 38, f: 0.3, days: 5, unit: 'g' },
  'aipim': { e: '🥔', cat: 'carboidrato', kcal: 160, p: 1.4, c: 38, f: 0.3, days: 5, unit: 'g' },
  'farinha': { e: '🌾', cat: 'carboidrato', kcal: 364, p: 10, c: 76, f: 1, days: 240, unit: 'g' },
  'farinha de trigo': { e: '🌾', cat: 'carboidrato', kcal: 364, p: 10, c: 76, f: 1, days: 240, unit: 'g' },
  'farinha de mandioca': { e: '🌾', cat: 'carboidrato', kcal: 361, p: 1.6, c: 87, f: 0.3, days: 240, unit: 'g' },
  'fuba': { e: '🌽', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },
  'tapioca': { e: '🥞', cat: 'carboidrato', kcal: 358, p: 0, c: 89, f: 0, days: 180, unit: 'g' },
  'aveia': { e: '🥣', cat: 'carboidrato', kcal: 389, p: 17, c: 66, f: 7, days: 180, unit: 'g' },
  'granola': { e: '🥣', cat: 'carboidrato', kcal: 450, p: 10, c: 64, f: 17, days: 120, unit: 'g' },
  'milho': { e: '🌽', cat: 'carboidrato', kcal: 86, p: 3.2, c: 19, f: 1.2, days: 365, unit: 'g' },
  'acucar': { e: '🍬', cat: 'carboidrato', kcal: 387, p: 0, c: 100, f: 0, days: 720, unit: 'g' },
  'cuscuz': { e: '🌽', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },

  // ---- lipidios
  'azeite': { e: '🫒', cat: 'lipidio', kcal: 884, p: 0, c: 0, f: 100, days: 540, unit: 'ml' },
  'oleo': { e: '🛢️', cat: 'lipidio', kcal: 884, p: 0, c: 0, f: 100, days: 365, unit: 'ml' },
  'manteiga': { e: '🧈', cat: 'lipidio', kcal: 717, p: 0.9, c: 0.1, f: 81, days: 60, unit: 'g' },
  'margarina': { e: '🧈', cat: 'ultraprocessado', kcal: 596, p: 0.2, c: 0.7, f: 66, days: 90, unit: 'g' },
  'castanha': { e: '🌰', cat: 'lipidio', kcal: 656, p: 14, c: 12, f: 66, days: 120, unit: 'g' },
  'amendoim': { e: '🥜', cat: 'lipidio', kcal: 567, p: 26, c: 16, f: 49, days: 150, unit: 'g' },
  'pasta de amendoim': { e: '🥜', cat: 'lipidio', kcal: 588, p: 25, c: 20, f: 50, days: 180, unit: 'g' },
  'abacate': { e: '🥑', cat: 'lipidio', kcal: 160, p: 2, c: 9, f: 15, days: 5, unit: 'un', gPerUn: 200 },
  'coco': { e: '🥥', cat: 'lipidio', kcal: 354, p: 3.3, c: 15, f: 33, days: 20, unit: 'g' },
  'leite de coco': { e: '🥥', cat: 'lipidio', kcal: 230, p: 2.3, c: 6, f: 24, days: 300, unit: 'ml' },
  'creme de leite': { e: '🥛', cat: 'lipidio', kcal: 195, p: 2.5, c: 4, f: 19, days: 180, unit: 'ml' },

  // ---- hortifruti
  'tomate': { e: '🍅', cat: 'hortifruti', kcal: 18, p: 0.9, c: 3.9, f: 0.2, days: 7, unit: 'un', gPerUn: 120 },
  'cebola': { e: '🧅', cat: 'hortifruti', kcal: 40, p: 1.1, c: 9.3, f: 0.1, days: 30, unit: 'un', gPerUn: 110 },
  'alho': { e: '🧄', cat: 'hortifruti', kcal: 149, p: 6.4, c: 33, f: 0.5, days: 60, unit: 'un', gPerUn: 5 },
  'alface': { e: '🥬', cat: 'hortifruti', kcal: 15, p: 1.4, c: 2.9, f: 0.2, days: 5, unit: 'un', gPerUn: 300 },
  'couve': { e: '🥬', cat: 'hortifruti', kcal: 49, p: 4.3, c: 8.8, f: 0.9, days: 5, unit: 'un', gPerUn: 200 },
  'cenoura': { e: '🥕', cat: 'hortifruti', kcal: 41, p: 0.9, c: 10, f: 0.2, days: 20, unit: 'un', gPerUn: 90 },
  'brocolis': { e: '🥦', cat: 'hortifruti', kcal: 34, p: 2.8, c: 7, f: 0.4, days: 6, unit: 'g' },
  'abobrinha': { e: '🥒', cat: 'hortifruti', kcal: 17, p: 1.2, c: 3.1, f: 0.3, days: 8, unit: 'un', gPerUn: 250 },
  'pimentao': { e: '🫑', cat: 'hortifruti', kcal: 31, p: 1, c: 6, f: 0.3, days: 10, unit: 'un', gPerUn: 150 },
  'banana': { e: '🍌', cat: 'hortifruti', kcal: 89, p: 1.1, c: 23, f: 0.3, days: 6, unit: 'un', gPerUn: 120 },
  'maca': { e: '🍎', cat: 'hortifruti', kcal: 52, p: 0.3, c: 14, f: 0.2, days: 20, unit: 'un', gPerUn: 180 },
  'laranja': { e: '🍊', cat: 'hortifruti', kcal: 47, p: 0.9, c: 12, f: 0.1, days: 15, unit: 'un', gPerUn: 180 },
  'limao': { e: '🍋', cat: 'hortifruti', kcal: 29, p: 1.1, c: 9, f: 0.3, days: 20, unit: 'un', gPerUn: 100 },
  'mamao': { e: '🍈', cat: 'hortifruti', kcal: 43, p: 0.5, c: 11, f: 0.3, days: 5, unit: 'un', gPerUn: 500 },
  'melancia': { e: '🍉', cat: 'hortifruti', kcal: 30, p: 0.6, c: 8, f: 0.2, days: 7, unit: 'g' },
  'uva': { e: '🍇', cat: 'hortifruti', kcal: 69, p: 0.7, c: 18, f: 0.2, days: 7, unit: 'g' },
  'morango': { e: '🍓', cat: 'hortifruti', kcal: 32, p: 0.7, c: 7.7, f: 0.3, days: 4, unit: 'g' },
  'batata inglesa': { e: '🥔', cat: 'carboidrato', kcal: 77, p: 2, c: 17, f: 0.1, days: 20, unit: 'g' },
  'salsinha': { e: '🌿', cat: 'hortifruti', kcal: 36, p: 3, c: 6, f: 0.8, days: 6, unit: 'un', gPerUn: 30 },
  'cheiro verde': { e: '🌿', cat: 'hortifruti', kcal: 36, p: 3, c: 6, f: 0.8, days: 6, unit: 'un', gPerUn: 30 },

  // ---- ultraprocessados
  'refrigerante': { e: '🥤', cat: 'ultraprocessado', kcal: 42, p: 0, c: 10.6, f: 0, days: 180, unit: 'ml' },
  'biscoito': { e: '🍪', cat: 'ultraprocessado', kcal: 480, p: 6, c: 65, f: 21, days: 120, unit: 'g' },
  'bolacha': { e: '🍪', cat: 'ultraprocessado', kcal: 480, p: 6, c: 65, f: 21, days: 120, unit: 'g' },
  'salgadinho': { e: '🍿', cat: 'ultraprocessado', kcal: 536, p: 6, c: 53, f: 33, days: 90, unit: 'g' },
  'chocolate': { e: '🍫', cat: 'ultraprocessado', kcal: 535, p: 8, c: 59, f: 30, days: 180, unit: 'g' },
  'sorvete': { e: '🍦', cat: 'ultraprocessado', kcal: 207, p: 3.5, c: 24, f: 11, days: 120, unit: 'ml' },
  'macarrao instantaneo': { e: '🍜', cat: 'ultraprocessado', kcal: 448, p: 9, c: 60, f: 18, days: 180, unit: 'un', gPerUn: 80 },
  'nuggets': { e: '🍗', cat: 'ultraprocessado', kcal: 296, p: 15, c: 19, f: 18, days: 120, unit: 'g' },
  'pizza congelada': { e: '🍕', cat: 'ultraprocessado', kcal: 266, p: 11, c: 33, f: 10, days: 120, unit: 'un', gPerUn: 400 },
  'suco de caixinha': { e: '🧃', cat: 'ultraprocessado', kcal: 45, p: 0.2, c: 11, f: 0, days: 180, unit: 'ml' },
  'cerveja': { e: '🍺', cat: 'ultraprocessado', kcal: 43, p: 0.5, c: 3.6, f: 0, days: 180, unit: 'ml' },

  // ---- outros
  'sal': { e: '🧂', cat: 'outro', kcal: 0, p: 0, c: 0, f: 0, days: 720, unit: 'g' },
  'cafe': { e: '☕', cat: 'outro', kcal: 2, p: 0.1, c: 0, f: 0, days: 180, unit: 'g' },
  'molho de tomate': { e: '🥫', cat: 'outro', kcal: 32, p: 1.3, c: 7, f: 0.2, days: 300, unit: 'g' },
  'vinagre': { e: '🍶', cat: 'outro', kcal: 18, p: 0, c: 0.9, f: 0, days: 720, unit: 'ml' },
  'temperos': { e: '🌶️', cat: 'outro', kcal: 0, p: 0, c: 0, f: 0, days: 365, unit: 'g' },
};

// media por categoria: usada quando o item nao esta na tabela
const CAT_FALLBACK = {
  proteina: { kcal: 180, p: 20, c: 3, f: 9, days: 5 },
  carboidrato: { kcal: 250, p: 6, c: 50, f: 2, days: 90 },
  lipidio: { kcal: 600, p: 5, c: 8, f: 60, days: 120 },
  ultraprocessado: { kcal: 400, p: 6, c: 50, f: 20, days: 120 },
  hortifruti: { kcal: 45, p: 1.5, c: 9, f: 0.3, days: 8 },
  outro: { kcal: 100, p: 3, c: 15, f: 3, days: 90 },
};

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Acha a melhor entrada da tabela para um nome livre digitado pelo usuario. */
export function matchFood(name) {
  const n = norm(name);
  if (!n) return null;
  if (FOODS[n]) return FOODS[n];
  // preferimos a chave mais longa que aparece no nome ("peito de frango" > "frango")
  let best = null;
  let bestLen = 0;
  for (const key of Object.keys(FOODS)) {
    if ((n.includes(key) || key.includes(n)) && key.length > bestLen) {
      best = FOODS[key];
      bestLen = key.length;
    }
  }
  return best;
}

export function guessCategory(name) {
  return matchFood(name)?.cat ?? 'outro';
}

export function guessEmoji(name, category = 'outro') {
  return matchFood(name)?.e ?? CATEGORIES[category]?.emoji ?? '🧂';
}

export function guessUnit(name) {
  return matchFood(name)?.unit ?? 'un';
}

/** Dias de validade estimados a partir de hoje. */
export function shelfLifeDays(name, category = 'outro') {
  return matchFood(name)?.days ?? CAT_FALLBACK[category]?.days ?? 30;
}

export function estimateExpiry(name, category = 'outro', fromISO = null) {
  const base = fromISO ? new Date(fromISO) : new Date();
  base.setDate(base.getDate() + shelfLifeDays(name, category));
  return base.toISOString().slice(0, 10);
}

/** Converte qualquer quantidade para gramas/ml aproximados. */
export function toBase(qty, unit, name = '') {
  const q = Number(qty) || 0;
  switch (unit) {
    case 'kg': return q * 1000;
    case 'l': return q * 1000;
    case 'g':
    case 'ml': return q;
    case 'pacote': return q * 400;
    case 'un':
    default: {
      const f = matchFood(name);
      return q * (f?.gPerUn ?? 150);
    }
  }
}

const MASS = ['g', 'kg'];
const VOLUME = ['ml', 'l'];
const FACTOR = { g: 1, kg: 1000, ml: 1, l: 1000 };

/**
 * Converte entre unidades da mesma família (g<->kg, ml<->l).
 * Devolve null quando a conversão não é segura (ex: "un" para "g"), para o
 * chamador decidir o que fazer em vez de estragar o estoque.
 */
export function convertQty(qty, from, to) {
  if (from === to) return Number(qty);
  const sameFamily =
    (MASS.includes(from) && MASS.includes(to)) || (VOLUME.includes(from) && VOLUME.includes(to));
  if (!sameFamily) return null;
  return (Number(qty) * FACTOR[from]) / FACTOR[to];
}

/** Macros totais de uma quantidade. Retorna { kcal, protein, carbs, fat }. */
export function macrosFor(name, category, qty, unit) {
  const f = matchFood(name);
  const ref = f ?? CAT_FALLBACK[category] ?? CAT_FALLBACK.outro;
  const grams = toBase(qty, unit, name);
  const k = grams / 100;
  return {
    kcal: +(ref.kcal * k).toFixed(1),
    protein: +(ref.p * k).toFixed(1),
    carbs: +(ref.c * k).toFixed(1),
    fat: +(ref.f * k).toFixed(1),
  };
}

/** Sugestoes de autocomplete para o modal de adicionar. */
export function suggest(term, limit = 8) {
  const n = norm(term);
  const keys = Object.keys(FOODS);
  const pool = n ? keys.filter((k) => k.includes(n)) : keys;
  return pool.slice(0, limit).map((k) => ({
    name: k.replace(/\b\w/g, (c) => c.toUpperCase()),
    category: FOODS[k].cat,
    unit: FOODS[k].unit,
    emoji: FOODS[k].e,
  }));
}

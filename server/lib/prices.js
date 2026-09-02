import { norm } from './food.js';

/**
 * Preços médios de mercado, em reais, por unidade base (kg, litro ou unidade).
 *
 * São ESTIMATIVAS para dar uma ordem de grandeza à lista de compras, não cotação
 * real: preço de comida varia muito por região, marca e promoção. Ancorados em
 * levantamentos de supermercado de 2026 (arroz 5 kg a R$ 13,69, feijão a R$ 6,89/kg,
 * frango a R$ 8,45/kg, óleo a R$ 5,65/900 ml, leite entre R$ 4,19 e R$ 5,49/L) e
 * completados por proporção para o resto da tabela.
 *
 * Para atualizar: mexa só nos números daqui e ajuste TABELA_ATUALIZADA_EM.
 */
export const TABELA_ATUALIZADA_EM = '2026-09';

/** preço por kg (sólidos), por litro (líquidos) ou por unidade (contáveis). */
export const PRECOS = {
  // ---- básicos secos
  'arroz': 2.9, 'arroz integral': 6.5, 'feijão': 6.9, 'lentilha': 12.5, 'grão de bico': 14.9,
  'macarrão': 6.5, 'espaguete': 6.5, 'farinha de trigo': 5.2, 'farinha de mandioca': 7.5,
  'fubá': 4.5, 'tapioca': 9.9, 'cuscuz': 5.5, 'aveia': 12.9, 'granola': 24.9,
  'açúcar': 4.6, 'sal': 2.5, 'café': 39.9,

  // ---- proteínas
  'frango': 12.9, 'peito de frango': 18.9, 'coxa de frango': 11.9,
  'carne': 42.0, 'carne moída': 32.9, 'patinho': 44.9, 'alcatra': 52.9, 'bife': 45.9,
  'linguiça': 22.9, 'bacon': 34.9,
  'peixe': 32.9, 'tilápia': 34.9, 'salmão': 89.9, 'atum': 9.9, 'sardinha': 6.9,
  'ovo': 1.1, 'ovos': 1.1,
  'queijo': 48.9, 'queijo minas': 39.9, 'mussarela': 44.9, 'presunto': 34.9,
  'requeijão': 12.9, 'tofu': 24.9, 'whey': 149.0,
  'leite': 5.2, 'iogurte': 12.9,

  // ---- gorduras
  'azeite': 52.9, 'óleo': 6.3, 'manteiga': 44.9, 'margarina': 14.9,
  'castanha': 89.9, 'amendoim': 19.9, 'pasta de amendoim': 34.9,
  'coco': 12.9, 'leite de coco': 11.9, 'creme de leite': 9.9,

  // ---- hortifrúti
  'tomate': 1.5, 'cebola': 0.9, 'alho': 0.6, 'alface': 3.9, 'couve': 3.9,
  'cenoura': 1.2, 'brócolis': 9.9, 'abobrinha': 3.5, 'pimentão': 2.5,
  'batata': 5.5, 'batata doce': 5.9, 'mandioca': 5.5, 'aipim': 5.5,
  'banana': 0.9, 'maçã': 1.8, 'laranja': 0.9, 'limão': 0.7, 'mamão': 6.9,
  'melancia': 2.9, 'uva': 14.9, 'morango': 19.9, 'abacate': 7.9,
  'salsinha': 2.5, 'cheiro verde': 2.5, 'milho': 6.9,

  // ---- padaria e prontos
  'pão': 0.9, 'pão de forma': 0.4, 'molho de tomate': 8.9, 'vinagre': 5.9,

  // ---- ultraprocessados
  'refrigerante': 4.5, 'biscoito': 12.9, 'bolacha': 12.9, 'salgadinho': 29.9,
  'chocolate': 79.9, 'sorvete': 19.9, 'macarrão instantâneo': 2.9,
  'nuggets': 29.9, 'pizza congelada': 24.9, 'suco de caixinha': 6.9, 'cerveja': 6.9,

  // ---- pet (preço por kg de ração seca; os pequenos vêm em pacote menor)
  'ração': 14.9, 'ração de cachorro': 13.9, 'ração de gato': 22.9,
  'ração de roedor': 24.9, 'ração de peixe': 89.9, 'ração de réptil': 79.9,
  'alpiste': 12.9, 'petisco de pet': 39.9, 'areia de gato': 4.5,

  // ---- não alimentos comuns na feira
  'papel higiênico': 1.8, 'detergente': 3.2,
};

/** Quando o item não está na tabela, o preço sai da média da categoria. */
const POR_CATEGORIA = {
  proteina: 28.0,
  carboidrato: 7.5,
  lipidio: 30.0,
  ultraprocessado: 22.0,
  hortifruti: 6.0,
  outro: 12.0,
};

/** Converte a quantidade para a unidade em que o preço está cotado. */
function emUnidadeDePreco(qty, unit) {
  switch (unit) {
    case 'g': return qty / 1000;      // preço por kg
    case 'kg': return qty;
    case 'ml': return qty / 1000;     // preço por litro
    case 'l': return qty;
    case 'pacote': return qty;
    case 'un':
    default: return qty;
  }
}

/** Preço por unidade base de um alimento, com a mesma busca tolerante do catálogo. */
export function precoUnitario(name, category = 'outro') {
  const n = norm(name);
  if (PRECOS[n] !== undefined) return { valor: PRECOS[n], exato: true };

  let melhor = null;
  let tamanho = 0;
  for (const chave of Object.keys(PRECOS)) {
    const c = norm(chave);
    if ((n.includes(c) || c.includes(n)) && c.length > tamanho) {
      melhor = PRECOS[chave];
      tamanho = c.length;
    }
  }
  if (melhor !== null) return { valor: melhor, exato: false };
  return { valor: POR_CATEGORIA[category] ?? POR_CATEGORIA.outro, exato: false };
}

/** Quanto deve custar comprar essa quantidade. */
export function estimarPreco(name, category, qty, unit) {
  const { valor, exato } = precoUnitario(name, category);
  // itens contáveis com preço cotado por kg (tomate, banana) já vêm por unidade
  const total = valor * emUnidadeDePreco(qty, unit);
  return { total: Math.round(total * 100) / 100, unitario: valor, exato };
}

/** Total estimado de uma lista inteira. */
export function estimarLista(itens) {
  let total = 0;
  let exatos = 0;
  for (const it of itens) {
    const e = estimarPreco(it.name, it.category, it.qty, it.unit);
    it.estimate = e.total;
    it.priceExact = e.exato;
    total += e.total;
    if (e.exato) exatos += 1;
  }
  return {
    total: Math.round(total * 100) / 100,
    exatos,
    itens: itens.length,
    atualizadaEm: TABELA_ATUALIZADA_EM,
  };
}

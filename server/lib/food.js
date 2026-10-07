// Referencia de alimentos: macros aproximados (por 100g ou 100ml), durabilidade
// estimada em dias e emoji. Serve para estimar nutrientes e alimentar o Modo Viagem.
// Os valores sao aproximacoes de uso domestico, nao tabela nutricional oficial.
//
// As chaves ficam SEM acento de proposito: elas sao o indice de busca. O nome
// bonito, com acento, vai no campo `l` (label) e e o que a tela mostra.

export const CATEGORIES = {
  proteina: { label: 'Proteína', emoji: '🍗', color: '#e8615a' },
  carboidrato: { label: 'Carboidrato', emoji: '🍚', color: '#e5a13a' },
  lipidio: { label: 'Lipídios', emoji: '🥑', color: '#5aa86e' },
  ultraprocessado: { label: 'Ultraprocessados', emoji: '🍪', color: '#a06ad4' },
  hortifruti: { label: 'Hortifrúti', emoji: '🥬', color: '#3fae8f' },
  tempero: { label: 'Temperos', emoji: '🌶️', color: '#d4694a' },
  pet: { label: 'Pet', emoji: '🐾', color: '#c98a3c' },
  outro: { label: 'Outro', emoji: '🧂', color: '#7c8496' },
};

export const UNITS = ['un', 'g', 'kg', 'ml', 'l', 'pacote'];

// kcal / p (proteina) / c (carbo) / f (gordura) por 100g|100ml.
// days = validade estimada a partir da compra. unit = unidade sugerida no modal.
// l = nome com acento para mostrar na tela (opcional; sem ele a chave e capitalizada).
export const FOODS = {
  // ---- proteinas
  'frango': { e: '🍗', cat: 'proteina', kcal: 165, p: 31, c: 0, f: 3.6, days: 3, unit: 'g' },
  'peito de frango': { e: '🍗', cat: 'proteina', kcal: 165, p: 31, c: 0, f: 3.6, days: 3, unit: 'g' },
  'file de frango': { e: '🍗', l: 'Filé de Frango', cat: 'proteina', kcal: 165, p: 31, c: 0, f: 3.6, days: 3, unit: 'g' },
  'coxa de frango': { e: '🍗', cat: 'proteina', kcal: 209, p: 26, c: 0, f: 11, days: 3, unit: 'g' },
  'sobrecoxa': { e: '🍗', cat: 'proteina', kcal: 211, p: 25, c: 0, f: 12, days: 3, unit: 'g' },
  'asa de frango': { e: '🍗', cat: 'proteina', kcal: 203, p: 30, c: 0, f: 8.1, days: 3, unit: 'g' },
  'frango inteiro': { e: '🍗', cat: 'proteina', kcal: 190, p: 27, c: 0, f: 9, days: 3, unit: 'un', gPerUn: 1600 },
  'galinha caipira': { e: '🐔', cat: 'proteina', kcal: 180, p: 28, c: 0, f: 7, days: 3, unit: 'un', gPerUn: 1800 },
  'carne moida': { e: '🥩', l: 'Carne Moída', cat: 'proteina', kcal: 250, p: 26, c: 0, f: 16, days: 2, unit: 'g' },
  'carne': { e: '🥩', cat: 'proteina', kcal: 250, p: 26, c: 0, f: 17, days: 3, unit: 'g' },
  'patinho': { e: '🥩', cat: 'proteina', kcal: 219, p: 32, c: 0, f: 9, days: 3, unit: 'g' },
  'alcatra': { e: '🥩', cat: 'proteina', kcal: 241, p: 28, c: 0, f: 14, days: 3, unit: 'g' },
  'contrafile': { e: '🥩', l: 'Contrafilé', cat: 'proteina', kcal: 245, p: 28, c: 0, f: 14, days: 3, unit: 'g' },
  'file mignon': { e: '🥩', l: 'Filé Mignon', cat: 'proteina', kcal: 219, p: 30, c: 0, f: 11, days: 3, unit: 'g' },
  'coxao mole': { e: '🥩', l: 'Coxão Mole', cat: 'proteina', kcal: 219, p: 32, c: 0, f: 9, days: 3, unit: 'g' },
  'coxao duro': { e: '🥩', l: 'Coxão Duro', cat: 'proteina', kcal: 215, p: 31, c: 0, f: 9, days: 3, unit: 'g' },
  'maminha': { e: '🥩', cat: 'proteina', kcal: 230, p: 29, c: 0, f: 12, days: 3, unit: 'g' },
  'fraldinha': { e: '🥩', cat: 'proteina', kcal: 245, p: 27, c: 0, f: 15, days: 3, unit: 'g' },
  'picanha': { e: '🥩', cat: 'proteina', kcal: 290, p: 26, c: 0, f: 20, days: 3, unit: 'g' },
  'musculo': { e: '🥩', l: 'Músculo', cat: 'proteina', kcal: 201, p: 30, c: 0, f: 8, days: 3, unit: 'g' },
  'acem': { e: '🥩', l: 'Acém', cat: 'proteina', kcal: 226, p: 28, c: 0, f: 12, days: 3, unit: 'g' },
  'paleta': { e: '🥩', cat: 'proteina', kcal: 230, p: 28, c: 0, f: 13, days: 3, unit: 'g' },
  'cupim': { e: '🥩', cat: 'proteina', kcal: 320, p: 22, c: 0, f: 26, days: 3, unit: 'g' },
  'costela': { e: '🥩', cat: 'proteina', kcal: 291, p: 20, c: 0, f: 23, days: 3, unit: 'g' },
  'bife': { e: '🥩', cat: 'proteina', kcal: 241, p: 28, c: 0, f: 14, days: 3, unit: 'g' },
  'carne seca': { e: '🥩', cat: 'proteina', kcal: 313, p: 33, c: 0, f: 20, days: 30, unit: 'g' },
  'carne de sol': { e: '🥩', cat: 'proteina', kcal: 290, p: 32, c: 0, f: 18, days: 12, unit: 'g' },
  'charque': { e: '🥩', cat: 'proteina', kcal: 313, p: 33, c: 0, f: 20, days: 45, unit: 'g' },
  'lombo': { e: '🐖', cat: 'proteina', kcal: 143, p: 21, c: 0, f: 6, days: 3, unit: 'g' },
  'pernil': { e: '🐖', cat: 'proteina', kcal: 211, p: 25, c: 0, f: 12, days: 3, unit: 'g' },
  'costelinha': { e: '🐖', cat: 'proteina', kcal: 278, p: 21, c: 0, f: 21, days: 3, unit: 'g' },
  'bisteca': { e: '🐖', cat: 'proteina', kcal: 231, p: 24, c: 0, f: 15, days: 3, unit: 'g' },
  'linguica': { e: '🌭', l: 'Linguiça', cat: 'proteina', kcal: 296, p: 16, c: 2, f: 25, days: 5, unit: 'g' },
  'linguica calabresa': { e: '🌭', l: 'Linguiça Calabresa', cat: 'proteina', kcal: 296, p: 16, c: 2, f: 25, days: 12, unit: 'g' },
  'linguica toscana': { e: '🌭', l: 'Linguiça Toscana', cat: 'proteina', kcal: 290, p: 15, c: 1, f: 25, days: 5, unit: 'g' },
  'paio': { e: '🌭', cat: 'proteina', kcal: 320, p: 18, c: 1, f: 27, days: 20, unit: 'g' },
  'bacon': { e: '🥓', cat: 'lipidio', kcal: 541, p: 37, c: 1, f: 42, days: 10, unit: 'g' },
  'toucinho': { e: '🥓', cat: 'lipidio', kcal: 541, p: 37, c: 1, f: 42, days: 10, unit: 'g' },
  'peixe': { e: '🐟', cat: 'proteina', kcal: 130, p: 24, c: 0, f: 3, days: 2, unit: 'g' },
  'tilapia': { e: '🐟', l: 'Tilápia', cat: 'proteina', kcal: 128, p: 26, c: 0, f: 2.7, days: 2, unit: 'g' },
  'pescada': { e: '🐟', cat: 'proteina', kcal: 110, p: 23, c: 0, f: 1.5, days: 2, unit: 'g' },
  'merluza': { e: '🐟', cat: 'proteina', kcal: 90, p: 19, c: 0, f: 1.3, days: 2, unit: 'g' },
  'cacao': { e: '🦈', l: 'Cação', cat: 'proteina', kcal: 130, p: 24, c: 0, f: 3.5, days: 2, unit: 'g' },
  'robalo': { e: '🐟', cat: 'proteina', kcal: 124, p: 23, c: 0, f: 2.9, days: 2, unit: 'g' },
  'badejo': { e: '🐟', cat: 'proteina', kcal: 105, p: 22, c: 0, f: 1.5, days: 2, unit: 'g' },
  'pirarucu': { e: '🐟', cat: 'proteina', kcal: 100, p: 21, c: 0, f: 1.5, days: 2, unit: 'g' },
  'tambaqui': { e: '🐟', cat: 'proteina', kcal: 155, p: 19, c: 0, f: 9, days: 2, unit: 'g' },
  'salmao': { e: '🐟', l: 'Salmão', cat: 'proteina', kcal: 208, p: 20, c: 0, f: 13, days: 2, unit: 'g' },
  'atum': { e: '🐟', cat: 'proteina', kcal: 132, p: 28, c: 0, f: 1, days: 365, unit: 'g' },
  'sardinha': { e: '🐟', cat: 'proteina', kcal: 208, p: 25, c: 0, f: 11, days: 365, unit: 'g' },
  'bacalhau': { e: '🐟', cat: 'proteina', kcal: 290, p: 62, c: 0, f: 2.4, days: 90, unit: 'g' },
  'camarao': { e: '🦐', l: 'Camarão', cat: 'proteina', kcal: 99, p: 24, c: 0.2, f: 0.3, days: 2, unit: 'g' },
  'camarao seco': { e: '🦐', l: 'Camarão Seco', cat: 'proteina', kcal: 290, p: 62, c: 0, f: 4, days: 90, unit: 'g' },
  'siri': { e: '🦀', cat: 'proteina', kcal: 87, p: 18, c: 0, f: 1.1, days: 2, unit: 'g' },
  'caranguejo': { e: '🦀', cat: 'proteina', kcal: 87, p: 18, c: 0, f: 1.1, days: 2, unit: 'g' },
  'ovo': { e: '🥚', cat: 'proteina', kcal: 155, p: 13, c: 1.1, f: 11, days: 21, unit: 'un', gPerUn: 55 },
  'ovos': { e: '🥚', cat: 'proteina', kcal: 155, p: 13, c: 1.1, f: 11, days: 21, unit: 'un', gPerUn: 55 },
  'feijao': { e: '🫘', l: 'Feijão', cat: 'proteina', kcal: 76, p: 4.8, c: 13.6, f: 0.5, days: 240, unit: 'g' },
  'feijao de corda': { e: '🫘', l: 'Feijão de Corda', cat: 'proteina', kcal: 77, p: 5, c: 14, f: 0.5, days: 240, unit: 'g' },
  'feijao verde': { e: '🫘', l: 'Feijão Verde', cat: 'proteina', kcal: 77, p: 5, c: 14, f: 0.5, days: 6, unit: 'g' },
  'feijao fradinho': { e: '🫘', l: 'Feijão-Fradinho', cat: 'proteina', kcal: 76, p: 5, c: 13, f: 0.5, days: 240, unit: 'g' },
  'feijao preto': { e: '🫘', l: 'Feijão Preto', cat: 'proteina', kcal: 77, p: 4.5, c: 14, f: 0.5, days: 240, unit: 'g' },
  'lentilha': { e: '🫘', cat: 'proteina', kcal: 116, p: 9, c: 20, f: 0.4, days: 300, unit: 'g' },
  'grao de bico': { e: '🫘', l: 'Grão-de-Bico', cat: 'proteina', kcal: 164, p: 9, c: 27, f: 2.6, days: 300, unit: 'g' },
  'queijo': { e: '🧀', cat: 'proteina', kcal: 350, p: 25, c: 2, f: 27, days: 15, unit: 'g' },
  'queijo minas': { e: '🧀', cat: 'proteina', kcal: 264, p: 17, c: 3, f: 20, days: 7, unit: 'g' },
  'queijo coalho': { e: '🧀', cat: 'proteina', kcal: 330, p: 24, c: 2, f: 25, days: 10, unit: 'g' },
  'queijo manteiga': { e: '🧀', cat: 'lipidio', kcal: 380, p: 15, c: 2, f: 35, days: 20, unit: 'g' },
  'queijo prato': { e: '🧀', cat: 'proteina', kcal: 360, p: 25, c: 2, f: 28, days: 15, unit: 'g' },
  'queijo parmesao': { e: '🧀', l: 'Queijo Parmesão', cat: 'proteina', kcal: 431, p: 38, c: 4, f: 29, days: 60, unit: 'g' },
  'provolone': { e: '🧀', cat: 'proteina', kcal: 351, p: 26, c: 2.1, f: 27, days: 20, unit: 'g' },
  'gorgonzola': { e: '🧀', cat: 'proteina', kcal: 353, p: 21, c: 2.3, f: 29, days: 20, unit: 'g' },
  'ricota': { e: '🧀', cat: 'proteina', kcal: 174, p: 11, c: 3, f: 13, days: 7, unit: 'g' },
  'mussarela': { e: '🧀', cat: 'proteina', kcal: 300, p: 22, c: 2, f: 22, days: 12, unit: 'g' },
  'catupiry': { e: '🧀', cat: 'lipidio', kcal: 264, p: 9, c: 3, f: 24, days: 20, unit: 'g' },
  'presunto': { e: '🥓', cat: 'proteina', kcal: 145, p: 18, c: 1.5, f: 7, days: 7, unit: 'g' },
  'iogurte': { e: '🥛', cat: 'proteina', kcal: 61, p: 3.5, c: 4.7, f: 3.3, days: 14, unit: 'ml' },
  'leite': { e: '🥛', cat: 'proteina', kcal: 61, p: 3.2, c: 4.8, f: 3.3, days: 5, unit: 'ml' },
  'requeijao': { e: '🧀', l: 'Requeijão', cat: 'lipidio', kcal: 257, p: 9, c: 3, f: 23, days: 15, unit: 'g' },
  'tofu': { e: '🧊', cat: 'proteina', kcal: 76, p: 8, c: 1.9, f: 4.8, days: 7, unit: 'g' },
  'whey': { e: '💪', cat: 'proteina', kcal: 400, p: 80, c: 8, f: 5, days: 365, unit: 'g' },

  // ---- pet (so aparece quando a casa tem bichinho)
  'racao': { e: '🐾', l: 'Ração', cat: 'pet', kcal: 350, p: 25, c: 45, f: 12, days: 60, unit: 'kg' },
  'racao de cachorro': { e: '🐶', l: 'Ração de Cachorro', cat: 'pet', kcal: 350, p: 25, c: 45, f: 12, days: 60, unit: 'kg' },
  'racao de gato': { e: '🐱', l: 'Ração de Gato', cat: 'pet', kcal: 380, p: 32, c: 32, f: 14, days: 60, unit: 'kg' },
  'racao de roedor': { e: '🐹', l: 'Ração de Roedor', cat: 'pet', kcal: 330, p: 15, c: 55, f: 6, days: 90, unit: 'g' },
  'racao de peixe': { e: '🐠', l: 'Ração de Peixe', cat: 'pet', kcal: 340, p: 40, c: 20, f: 8, days: 120, unit: 'g' },
  'racao de reptil': { e: '🦎', l: 'Ração de Réptil', cat: 'pet', kcal: 320, p: 35, c: 25, f: 9, days: 90, unit: 'g' },
  'alpiste': { e: '🐦', cat: 'pet', kcal: 380, p: 14, c: 55, f: 8, days: 120, unit: 'g' },
  'petisco de pet': { e: '🦴', cat: 'pet', kcal: 320, p: 20, c: 50, f: 8, days: 90, unit: 'g' },
  'areia de gato': { e: '🐈', cat: 'pet', kcal: 0, p: 0, c: 0, f: 0, days: 180, unit: 'kg' },

  // ---- carboidratos
  'arroz': { e: '🍚', cat: 'carboidrato', kcal: 130, p: 2.7, c: 28, f: 0.3, days: 365, unit: 'g' },
  'arroz integral': { e: '🍚', cat: 'carboidrato', kcal: 124, p: 2.6, c: 26, f: 1, days: 300, unit: 'g' },
  'macarrao': { e: '🍝', l: 'Macarrão', cat: 'carboidrato', kcal: 158, p: 5.8, c: 31, f: 0.9, days: 365, unit: 'g' },
  'espaguete': { e: '🍝', cat: 'carboidrato', kcal: 158, p: 5.8, c: 31, f: 0.9, days: 365, unit: 'g' },
  'pao': { e: '🍞', l: 'Pão', cat: 'carboidrato', kcal: 265, p: 9, c: 49, f: 3.2, days: 4, unit: 'un', gPerUn: 50 },
  'pao de forma': { e: '🍞', l: 'Pão de Forma', cat: 'carboidrato', kcal: 265, p: 9, c: 49, f: 3.2, days: 7, unit: 'un', gPerUn: 25 },
  'batata': { e: '🥔', cat: 'carboidrato', kcal: 77, p: 2, c: 17, f: 0.1, days: 20, unit: 'g' },
  'batata doce': { e: '🍠', cat: 'carboidrato', kcal: 86, p: 1.6, c: 20, f: 0.1, days: 20, unit: 'g' },
  'mandioca': { e: '🥔', cat: 'carboidrato', kcal: 160, p: 1.4, c: 38, f: 0.3, days: 5, unit: 'g' },
  'aipim': { e: '🥔', cat: 'carboidrato', kcal: 160, p: 1.4, c: 38, f: 0.3, days: 5, unit: 'g' },
  'macaxeira': { e: '🥔', cat: 'carboidrato', kcal: 160, p: 1.4, c: 38, f: 0.3, days: 5, unit: 'g' },
  'inhame': { e: '🍠', cat: 'carboidrato', kcal: 118, p: 1.5, c: 28, f: 0.2, days: 14, unit: 'g' },
  'cara': { e: '🍠', l: 'Cará', cat: 'carboidrato', kcal: 118, p: 1.5, c: 28, f: 0.2, days: 14, unit: 'g' },
  'farinha': { e: '🌾', cat: 'carboidrato', kcal: 364, p: 10, c: 76, f: 1, days: 240, unit: 'g' },
  'farinha de trigo': { e: '🌾', cat: 'carboidrato', kcal: 364, p: 10, c: 76, f: 1, days: 240, unit: 'g' },
  'farinha de mandioca': { e: '🌾', cat: 'carboidrato', kcal: 361, p: 1.6, c: 87, f: 0.3, days: 240, unit: 'g' },
  'farinha de milho': { e: '🌽', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },
  'farinha de rosca': { e: '🍞', cat: 'carboidrato', kcal: 395, p: 13, c: 72, f: 5, days: 180, unit: 'g' },
  'fuba': { e: '🌽', l: 'Fubá', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },
  'polvilho doce': { e: '🌾', cat: 'carboidrato', kcal: 358, p: 0, c: 89, f: 0, days: 365, unit: 'g' },
  'polvilho azedo': { e: '🌾', cat: 'carboidrato', kcal: 358, p: 0, c: 89, f: 0, days: 365, unit: 'g' },
  'tapioca': { e: '🥞', cat: 'carboidrato', kcal: 358, p: 0, c: 89, f: 0, days: 180, unit: 'g' },
  'goma de tapioca': { e: '🥞', cat: 'carboidrato', kcal: 358, p: 0, c: 89, f: 0, days: 20, unit: 'g' },
  'aveia': { e: '🥣', cat: 'carboidrato', kcal: 389, p: 17, c: 66, f: 7, days: 180, unit: 'g' },
  'granola': { e: '🥣', cat: 'carboidrato', kcal: 450, p: 10, c: 64, f: 17, days: 120, unit: 'g' },
  'milho': { e: '🌽', cat: 'carboidrato', kcal: 86, p: 3.2, c: 19, f: 1.2, days: 365, unit: 'g' },
  'milho verde': { e: '🌽', cat: 'carboidrato', kcal: 86, p: 3.2, c: 19, f: 1.2, days: 365, unit: 'g' },
  'milho para pipoca': { e: '🍿', cat: 'carboidrato', kcal: 375, p: 12, c: 74, f: 4.3, days: 365, unit: 'g' },
  'canjica': { e: '🌽', cat: 'carboidrato', kcal: 358, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },
  'acucar': { e: '🍬', l: 'Açúcar', cat: 'carboidrato', kcal: 387, p: 0, c: 100, f: 0, days: 720, unit: 'g' },
  'cuscuz': { e: '🌽', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },
  'flocao de milho': { e: '🌽', l: 'Flocão de Milho', cat: 'carboidrato', kcal: 353, p: 7, c: 79, f: 1.5, days: 240, unit: 'g' },

  // ---- massas (peso seco, do jeito que a receita pede)
  'massa de lasanha': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'massa fresca': { e: '🍝', cat: 'carboidrato', kcal: 288, p: 11, c: 55, f: 2, days: 5, unit: 'g' },
  'penne': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'parafuso': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'gravatinha': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'conchinha': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'talharim': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'fettuccine': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'cabelo de anjo': { e: '🍝', cat: 'carboidrato', kcal: 360, p: 12, c: 72, f: 1.5, days: 365, unit: 'g' },
  'macarrao de arroz': { e: '🍜', l: 'Macarrão de Arroz', cat: 'carboidrato', kcal: 364, p: 6, c: 82, f: 0.6, days: 365, unit: 'g' },
  'macarrao para yakisoba': { e: '🍜', l: 'Macarrão para Yakisoba', cat: 'carboidrato', kcal: 320, p: 11, c: 62, f: 2.5, days: 30, unit: 'g' },
  'capeletti': { e: '🍝', cat: 'carboidrato', kcal: 288, p: 12, c: 48, f: 5, days: 5, unit: 'g' },
  'ravioli': { e: '🍝', cat: 'carboidrato', kcal: 288, p: 12, c: 48, f: 5, days: 5, unit: 'g' },
  'nhoque': { e: '🥟', cat: 'carboidrato', kcal: 180, p: 4, c: 38, f: 1, days: 5, unit: 'g' },
  'massa de pastel': { e: '🥟', cat: 'carboidrato', kcal: 320, p: 8, c: 58, f: 6, days: 20, unit: 'g' },
  'massa de pizza': { e: '🍕', cat: 'carboidrato', kcal: 280, p: 9, c: 50, f: 5, days: 10, unit: 'un', gPerUn: 250 },
  'massa folhada': { e: '🥐', cat: 'carboidrato', kcal: 558, p: 7, c: 45, f: 38, days: 60, unit: 'g' },
  'massa de panqueca': { e: '🥞', cat: 'carboidrato', kcal: 220, p: 7, c: 33, f: 6, days: 4, unit: 'g' },

  // ---- lipidios
  'azeite': { e: '🫒', cat: 'lipidio', kcal: 884, p: 0, c: 0, f: 100, days: 540, unit: 'ml' },
  'oleo': { e: '🛢️', l: 'Óleo', cat: 'lipidio', kcal: 884, p: 0, c: 0, f: 100, days: 365, unit: 'ml' },
  'azeite de dende': { e: '🌴', l: 'Azeite de Dendê', cat: 'lipidio', kcal: 884, p: 0, c: 0, f: 100, days: 365, unit: 'ml' },
  'oleo de coco': { e: '🥥', l: 'Óleo de Coco', cat: 'lipidio', kcal: 892, p: 0, c: 0, f: 99, days: 540, unit: 'ml' },
  'manteiga': { e: '🧈', cat: 'lipidio', kcal: 717, p: 0.9, c: 0.1, f: 81, days: 60, unit: 'g' },
  'manteiga de garrafa': { e: '🧈', cat: 'lipidio', kcal: 876, p: 0.3, c: 0, f: 99, days: 180, unit: 'ml' },
  'banha': { e: '🥓', cat: 'lipidio', kcal: 898, p: 0, c: 0, f: 100, days: 180, unit: 'g' },
  'margarina': { e: '🧈', cat: 'ultraprocessado', kcal: 596, p: 0.2, c: 0.7, f: 66, days: 90, unit: 'g' },
  'castanha': { e: '🌰', cat: 'lipidio', kcal: 656, p: 14, c: 12, f: 66, days: 120, unit: 'g' },
  'castanha de caju': { e: '🌰', cat: 'lipidio', kcal: 553, p: 18, c: 30, f: 44, days: 120, unit: 'g' },
  'castanha do para': { e: '🌰', l: 'Castanha-do-Pará', cat: 'lipidio', kcal: 656, p: 14, c: 12, f: 66, days: 120, unit: 'g' },
  'amendoim': { e: '🥜', cat: 'lipidio', kcal: 567, p: 26, c: 16, f: 49, days: 150, unit: 'g' },
  'pasta de amendoim': { e: '🥜', cat: 'lipidio', kcal: 588, p: 25, c: 20, f: 50, days: 180, unit: 'g' },
  'nozes': { e: '🌰', cat: 'lipidio', kcal: 654, p: 15, c: 14, f: 65, days: 120, unit: 'g' },
  'abacate': { e: '🥑', cat: 'lipidio', kcal: 160, p: 2, c: 9, f: 15, days: 5, unit: 'un', gPerUn: 200 },
  'coco': { e: '🥥', cat: 'lipidio', kcal: 354, p: 3.3, c: 15, f: 33, days: 20, unit: 'g' },
  'coco ralado': { e: '🥥', cat: 'lipidio', kcal: 660, p: 6.9, c: 24, f: 65, days: 180, unit: 'g' },
  'leite de coco': { e: '🥥', cat: 'lipidio', kcal: 230, p: 2.3, c: 6, f: 24, days: 300, unit: 'ml' },
  'creme de leite': { e: '🥛', cat: 'lipidio', kcal: 195, p: 2.5, c: 4, f: 19, days: 180, unit: 'ml' },
  'azeitona': { e: '🫒', cat: 'lipidio', kcal: 115, p: 0.8, c: 6, f: 11, days: 120, unit: 'g' },

  // ---- hortifruti (legumes e verduras)
  'tomate': { e: '🍅', cat: 'hortifruti', kcal: 18, p: 0.9, c: 3.9, f: 0.2, days: 7, unit: 'un', gPerUn: 120 },
  'cebola': { e: '🧅', cat: 'hortifruti', kcal: 40, p: 1.1, c: 9.3, f: 0.1, days: 30, unit: 'un', gPerUn: 110 },
  'alho': { e: '🧄', cat: 'hortifruti', kcal: 149, p: 6.4, c: 33, f: 0.5, days: 60, unit: 'un', gPerUn: 5 },
  'alface': { e: '🥬', cat: 'hortifruti', kcal: 15, p: 1.4, c: 2.9, f: 0.2, days: 5, unit: 'un', gPerUn: 300 },
  'rucula': { e: '🥬', l: 'Rúcula', cat: 'hortifruti', kcal: 25, p: 2.6, c: 3.7, f: 0.7, days: 4, unit: 'un', gPerUn: 100 },
  'agriao': { e: '🥬', l: 'Agrião', cat: 'hortifruti', kcal: 11, p: 2.3, c: 1.3, f: 0.1, days: 4, unit: 'un', gPerUn: 100 },
  'espinafre': { e: '🥬', cat: 'hortifruti', kcal: 23, p: 2.9, c: 3.6, f: 0.4, days: 5, unit: 'un', gPerUn: 200 },
  'couve': { e: '🥬', cat: 'hortifruti', kcal: 49, p: 4.3, c: 8.8, f: 0.9, days: 5, unit: 'un', gPerUn: 200 },
  'repolho': { e: '🥬', cat: 'hortifruti', kcal: 25, p: 1.3, c: 5.8, f: 0.1, days: 15, unit: 'un', gPerUn: 900 },
  'cenoura': { e: '🥕', cat: 'hortifruti', kcal: 41, p: 0.9, c: 10, f: 0.2, days: 20, unit: 'un', gPerUn: 90 },
  'beterraba': { e: '🥬', cat: 'hortifruti', kcal: 43, p: 1.6, c: 10, f: 0.2, days: 20, unit: 'un', gPerUn: 150 },
  'brocolis': { e: '🥦', l: 'Brócolis', cat: 'hortifruti', kcal: 34, p: 2.8, c: 7, f: 0.4, days: 6, unit: 'g' },
  'couve flor': { e: '🥦', l: 'Couve-Flor', cat: 'hortifruti', kcal: 25, p: 1.9, c: 5, f: 0.3, days: 7, unit: 'g' },
  'abobrinha': { e: '🥒', cat: 'hortifruti', kcal: 17, p: 1.2, c: 3.1, f: 0.3, days: 8, unit: 'un', gPerUn: 250 },
  'abobora': { e: '🎃', l: 'Abóbora', cat: 'hortifruti', kcal: 26, p: 1, c: 6.5, f: 0.1, days: 20, unit: 'g' },
  'jerimum': { e: '🎃', cat: 'hortifruti', kcal: 26, p: 1, c: 6.5, f: 0.1, days: 20, unit: 'g' },
  'chuchu': { e: '🥒', cat: 'hortifruti', kcal: 19, p: 0.8, c: 4.5, f: 0.1, days: 12, unit: 'un', gPerUn: 200 },
  'maxixe': { e: '🥒', cat: 'hortifruti', kcal: 15, p: 1.2, c: 3, f: 0.1, days: 5, unit: 'g' },
  'quiabo': { e: '🌿', cat: 'hortifruti', kcal: 33, p: 1.9, c: 7, f: 0.2, days: 5, unit: 'g' },
  'berinjela': { e: '🍆', cat: 'hortifruti', kcal: 25, p: 1, c: 6, f: 0.2, days: 8, unit: 'un', gPerUn: 250 },
  'pepino': { e: '🥒', cat: 'hortifruti', kcal: 15, p: 0.7, c: 3.6, f: 0.1, days: 8, unit: 'un', gPerUn: 200 },
  'vagem': { e: '🫛', cat: 'hortifruti', kcal: 31, p: 1.8, c: 7, f: 0.2, days: 6, unit: 'g' },
  'ervilha': { e: '🫛', cat: 'hortifruti', kcal: 81, p: 5.4, c: 14, f: 0.4, days: 300, unit: 'g' },
  'pimentao': { e: '🫑', l: 'Pimentão', cat: 'hortifruti', kcal: 31, p: 1, c: 6, f: 0.3, days: 10, unit: 'un', gPerUn: 150 },
  'pimenta de cheiro': { e: '🌶️', cat: 'hortifruti', kcal: 40, p: 1.9, c: 9, f: 0.4, days: 12, unit: 'g' },
  'batata inglesa': { e: '🥔', cat: 'carboidrato', kcal: 77, p: 2, c: 17, f: 0.1, days: 20, unit: 'g' },
  'salsinha': { e: '🌿', cat: 'hortifruti', kcal: 36, p: 3, c: 6, f: 0.8, days: 6, unit: 'un', gPerUn: 30 },
  'cheiro verde': { e: '🌿', cat: 'hortifruti', kcal: 36, p: 3, c: 6, f: 0.8, days: 6, unit: 'un', gPerUn: 30 },
  'coentro': { e: '🌿', cat: 'hortifruti', kcal: 23, p: 2.1, c: 3.7, f: 0.5, days: 5, unit: 'un', gPerUn: 30 },
  'cebolinha': { e: '🌿', cat: 'hortifruti', kcal: 32, p: 1.8, c: 7.3, f: 0.7, days: 6, unit: 'un', gPerUn: 30 },
  'manjericao': { e: '🌿', l: 'Manjericão', cat: 'hortifruti', kcal: 23, p: 3.2, c: 2.7, f: 0.6, days: 5, unit: 'un', gPerUn: 25 },
  'hortela': { e: '🌿', l: 'Hortelã', cat: 'hortifruti', kcal: 44, p: 3.3, c: 8, f: 0.7, days: 5, unit: 'un', gPerUn: 25 },
  'jambu': { e: '🌿', cat: 'hortifruti', kcal: 30, p: 2.5, c: 4, f: 0.5, days: 4, unit: 'un', gPerUn: 100 },
  'maniva': { e: '🌿', cat: 'hortifruti', kcal: 60, p: 3, c: 10, f: 1, days: 5, unit: 'g' },
  'gengibre': { e: '🫚', cat: 'hortifruti', kcal: 80, p: 1.8, c: 18, f: 0.8, days: 21, unit: 'g' },

  // ---- frutas
  'banana': { e: '🍌', cat: 'hortifruti', kcal: 89, p: 1.1, c: 23, f: 0.3, days: 6, unit: 'un', gPerUn: 120 },
  'maca': { e: '🍎', l: 'Maçã', cat: 'hortifruti', kcal: 52, p: 0.3, c: 14, f: 0.2, days: 20, unit: 'un', gPerUn: 180 },
  'laranja': { e: '🍊', cat: 'hortifruti', kcal: 47, p: 0.9, c: 12, f: 0.1, days: 15, unit: 'un', gPerUn: 180 },
  'limao': { e: '🍋', l: 'Limão', cat: 'hortifruti', kcal: 29, p: 1.1, c: 9, f: 0.3, days: 20, unit: 'un', gPerUn: 100 },
  'tangerina': { e: '🍊', cat: 'hortifruti', kcal: 53, p: 0.8, c: 13, f: 0.3, days: 12, unit: 'un', gPerUn: 120 },
  'mexerica': { e: '🍊', cat: 'hortifruti', kcal: 53, p: 0.8, c: 13, f: 0.3, days: 12, unit: 'un', gPerUn: 120 },
  'mamao': { e: '🍈', l: 'Mamão', cat: 'hortifruti', kcal: 43, p: 0.5, c: 11, f: 0.3, days: 5, unit: 'un', gPerUn: 500 },
  'melancia': { e: '🍉', cat: 'hortifruti', kcal: 30, p: 0.6, c: 8, f: 0.2, days: 7, unit: 'g' },
  'melao': { e: '🍈', l: 'Melão', cat: 'hortifruti', kcal: 34, p: 0.8, c: 8, f: 0.2, days: 8, unit: 'g' },
  'uva': { e: '🍇', cat: 'hortifruti', kcal: 69, p: 0.7, c: 18, f: 0.2, days: 7, unit: 'g' },
  'morango': { e: '🍓', cat: 'hortifruti', kcal: 32, p: 0.7, c: 7.7, f: 0.3, days: 4, unit: 'g' },
  'abacaxi': { e: '🍍', cat: 'hortifruti', kcal: 50, p: 0.5, c: 13, f: 0.1, days: 6, unit: 'un', gPerUn: 900 },
  'manga': { e: '🥭', cat: 'hortifruti', kcal: 60, p: 0.8, c: 15, f: 0.4, days: 6, unit: 'un', gPerUn: 300 },
  'goiaba': { e: '🍐', cat: 'hortifruti', kcal: 68, p: 2.6, c: 14, f: 1, days: 6, unit: 'un', gPerUn: 150 },
  'pera': { e: '🍐', cat: 'hortifruti', kcal: 57, p: 0.4, c: 15, f: 0.1, days: 12, unit: 'un', gPerUn: 170 },
  'pessego': { e: '🍑', l: 'Pêssego', cat: 'hortifruti', kcal: 39, p: 0.9, c: 10, f: 0.3, days: 6, unit: 'un', gPerUn: 150 },
  'ameixa': { e: '🍑', cat: 'hortifruti', kcal: 46, p: 0.7, c: 11, f: 0.3, days: 7, unit: 'un', gPerUn: 70 },
  'kiwi': { e: '🥝', cat: 'hortifruti', kcal: 61, p: 1.1, c: 15, f: 0.5, days: 14, unit: 'un', gPerUn: 90 },
  'caqui': { e: '🍅', cat: 'hortifruti', kcal: 70, p: 0.6, c: 19, f: 0.2, days: 7, unit: 'un', gPerUn: 170 },
  'figo': { e: '🍇', cat: 'hortifruti', kcal: 74, p: 0.8, c: 19, f: 0.3, days: 5, unit: 'g' },
  'roma': { e: '🍎', l: 'Romã', cat: 'hortifruti', kcal: 83, p: 1.7, c: 19, f: 1.2, days: 20, unit: 'un', gPerUn: 280 },
  'carambola': { e: '⭐', cat: 'hortifruti', kcal: 31, p: 1, c: 6.7, f: 0.3, days: 7, unit: 'g' },
  'amora': { e: '🫐', cat: 'hortifruti', kcal: 43, p: 1.4, c: 10, f: 0.5, days: 3, unit: 'g' },
  'framboesa': { e: '🫐', cat: 'hortifruti', kcal: 52, p: 1.2, c: 12, f: 0.7, days: 3, unit: 'g' },
  'mirtilo': { e: '🫐', cat: 'hortifruti', kcal: 57, p: 0.7, c: 14, f: 0.3, days: 7, unit: 'g' },
  'acerola': { e: '🍒', cat: 'hortifruti', kcal: 32, p: 0.4, c: 8, f: 0.3, days: 4, unit: 'g' },
  'maracuja': { e: '🍋', l: 'Maracujá', cat: 'hortifruti', kcal: 97, p: 2.2, c: 23, f: 0.7, days: 10, unit: 'un', gPerUn: 130 },
  'jabuticaba': { e: '🫐', cat: 'hortifruti', kcal: 58, p: 0.6, c: 15, f: 0.1, days: 4, unit: 'g' },
  'caju': { e: '🍐', cat: 'hortifruti', kcal: 43, p: 1, c: 11, f: 0.2, days: 4, unit: 'un', gPerUn: 100 },
  'caja': { e: '🥭', l: 'Cajá', cat: 'hortifruti', kcal: 46, p: 0.8, c: 12, f: 0.2, days: 4, unit: 'g' },
  'umbu': { e: '🍈', cat: 'hortifruti', kcal: 44, p: 0.6, c: 11, f: 0.2, days: 5, unit: 'g' },
  'seriguela': { e: '🍒', cat: 'hortifruti', kcal: 76, p: 0.8, c: 19, f: 0.2, days: 4, unit: 'g' },
  'pitanga': { e: '🍒', cat: 'hortifruti', kcal: 41, p: 0.9, c: 10, f: 0.4, days: 3, unit: 'g' },
  'graviola': { e: '🍈', cat: 'hortifruti', kcal: 66, p: 1, c: 17, f: 0.3, days: 5, unit: 'g' },
  'cupuacu': { e: '🥥', l: 'Cupuaçu', cat: 'hortifruti', kcal: 49, p: 1.7, c: 10, f: 0.6, days: 5, unit: 'g' },
  'acai': { e: '🫐', l: 'Açaí', cat: 'hortifruti', kcal: 70, p: 1.3, c: 6.2, f: 4.8, days: 4, unit: 'g' },
  'bacuri': { e: '🍈', cat: 'hortifruti', kcal: 105, p: 1.9, c: 25, f: 0.2, days: 5, unit: 'g' },
  'murici': { e: '🍈', cat: 'hortifruti', kcal: 76, p: 0.7, c: 17, f: 1, days: 4, unit: 'g' },
  'tucuma': { e: '🥥', l: 'Tucumã', cat: 'lipidio', kcal: 247, p: 3, c: 20, f: 24, days: 5, unit: 'g' },
  'buriti': { e: '🥥', cat: 'lipidio', kcal: 256, p: 2, c: 27, f: 16, days: 5, unit: 'g' },
  'pequi': { e: '🥭', cat: 'lipidio', kcal: 205, p: 2.7, c: 13, f: 18, days: 7, unit: 'un', gPerUn: 60 },
  'jaca': { e: '🍈', cat: 'hortifruti', kcal: 95, p: 1.7, c: 23, f: 0.6, days: 5, unit: 'g' },
  'fruta do conde': { e: '🍈', cat: 'hortifruti', kcal: 94, p: 2.1, c: 24, f: 0.3, days: 4, unit: 'un', gPerUn: 250 },

  // ---- temperos e ervas secas
  'sal': { e: '🧂', cat: 'tempero', kcal: 0, p: 0, c: 0, f: 0, days: 720, unit: 'g' },
  'sal grosso': { e: '🧂', cat: 'tempero', kcal: 0, p: 0, c: 0, f: 0, days: 720, unit: 'g' },
  'pimenta do reino': { e: '🌶️', l: 'Pimenta-do-Reino', cat: 'tempero', kcal: 251, p: 10, c: 64, f: 3.3, days: 720, unit: 'g' },
  'pimenta calabresa': { e: '🌶️', cat: 'tempero', kcal: 318, p: 12, c: 57, f: 17, days: 365, unit: 'g' },
  'oregano': { e: '🌿', l: 'Orégano', cat: 'tempero', kcal: 265, p: 9, c: 69, f: 4.3, days: 365, unit: 'g' },
  'alecrim': { e: '🌿', cat: 'tempero', kcal: 131, p: 3.3, c: 21, f: 5.9, days: 365, unit: 'g' },
  'tomilho': { e: '🌿', cat: 'tempero', kcal: 276, p: 9, c: 64, f: 7.4, days: 365, unit: 'g' },
  'louro': { e: '🍃', cat: 'tempero', kcal: 313, p: 7.6, c: 75, f: 8.4, days: 720, unit: 'g' },
  'cominho': { e: '🌾', cat: 'tempero', kcal: 375, p: 18, c: 44, f: 22, days: 365, unit: 'g' },
  'colorau': { e: '🌶️', cat: 'tempero', kcal: 300, p: 10, c: 50, f: 10, days: 365, unit: 'g' },
  'urucum': { e: '🌶️', cat: 'tempero', kcal: 300, p: 10, c: 50, f: 10, days: 365, unit: 'g' },
  'paprica': { e: '🌶️', l: 'Páprica', cat: 'tempero', kcal: 282, p: 14, c: 54, f: 13, days: 365, unit: 'g' },
  'canela': { e: '🌿', cat: 'tempero', kcal: 247, p: 4, c: 81, f: 1.2, days: 720, unit: 'g' },
  'cravo': { e: '🌿', cat: 'tempero', kcal: 274, p: 6, c: 66, f: 13, days: 720, unit: 'g' },
  'noz moscada': { e: '🌰', l: 'Noz-Moscada', cat: 'tempero', kcal: 525, p: 6, c: 49, f: 36, days: 720, unit: 'g' },
  'acafrao': { e: '🌼', l: 'Açafrão-da-Terra', cat: 'tempero', kcal: 354, p: 8, c: 65, f: 10, days: 365, unit: 'g' },
  'curcuma': { e: '🌼', l: 'Cúrcuma', cat: 'tempero', kcal: 354, p: 8, c: 65, f: 10, days: 365, unit: 'g' },
  'curry': { e: '🍛', cat: 'tempero', kcal: 325, p: 14, c: 58, f: 14, days: 365, unit: 'g' },
  'erva doce': { e: '🌿', l: 'Erva-Doce', cat: 'tempero', kcal: 345, p: 16, c: 52, f: 15, days: 720, unit: 'g' },
  'tempero baiano': { e: '🌶️', cat: 'tempero', kcal: 300, p: 10, c: 50, f: 8, days: 365, unit: 'g' },
  'tempero pronto': { e: '🧂', cat: 'tempero', kcal: 150, p: 5, c: 25, f: 3, days: 365, unit: 'g' },
  'alho em po': { e: '🧄', l: 'Alho em Pó', cat: 'tempero', kcal: 331, p: 17, c: 73, f: 0.7, days: 365, unit: 'g' },
  'temperos': { e: '🌶️', cat: 'tempero', kcal: 0, p: 0, c: 0, f: 0, days: 365, unit: 'g' },
  'caldo de galinha': { e: '🍲', cat: 'ultraprocessado', kcal: 240, p: 10, c: 20, f: 14, days: 365, unit: 'un', gPerUn: 10 },
  'caldo de carne': { e: '🍲', cat: 'ultraprocessado', kcal: 240, p: 10, c: 20, f: 14, days: 365, unit: 'un', gPerUn: 10 },

  // ---- condimentos e molhos
  'molho de tomate': { e: '🥫', cat: 'outro', kcal: 32, p: 1.3, c: 7, f: 0.2, days: 300, unit: 'g' },
  'extrato de tomate': { e: '🥫', cat: 'outro', kcal: 82, p: 4, c: 19, f: 0.5, days: 300, unit: 'g' },
  'tomate pelado': { e: '🥫', cat: 'outro', kcal: 32, p: 1.3, c: 7, f: 0.2, days: 540, unit: 'g' },
  'molho branco': { e: '🥛', cat: 'outro', kcal: 120, p: 3, c: 8, f: 8, days: 4, unit: 'ml' },
  'molho pesto': { e: '🌿', cat: 'lipidio', kcal: 450, p: 5, c: 6, f: 45, days: 30, unit: 'g' },
  'molho de pimenta': { e: '🌶️', cat: 'outro', kcal: 21, p: 0.9, c: 4, f: 0.4, days: 540, unit: 'ml' },
  'molho ingles': { e: '🍶', l: 'Molho Inglês', cat: 'outro', kcal: 78, p: 0, c: 19, f: 0, days: 540, unit: 'ml' },
  'molho barbecue': { e: '🍖', cat: 'ultraprocessado', kcal: 172, p: 0.8, c: 41, f: 0.6, days: 180, unit: 'g' },
  'molho de alho': { e: '🧄', cat: 'lipidio', kcal: 350, p: 2, c: 8, f: 35, days: 60, unit: 'g' },
  'shoyu': { e: '🍶', cat: 'outro', kcal: 53, p: 8, c: 5, f: 0.1, days: 365, unit: 'ml' },
  'ketchup': { e: '🍅', cat: 'ultraprocessado', kcal: 101, p: 1.2, c: 25, f: 0.1, days: 180, unit: 'g' },
  'maionese': { e: '🥚', cat: 'ultraprocessado', kcal: 680, p: 1, c: 2, f: 75, days: 90, unit: 'g' },
  'mostarda': { e: '🌭', cat: 'outro', kcal: 66, p: 4, c: 5, f: 3.3, days: 180, unit: 'g' },
  'vinagre': { e: '🍶', cat: 'outro', kcal: 18, p: 0, c: 0.9, f: 0, days: 720, unit: 'ml' },
  'vinagre balsamico': { e: '🍶', l: 'Vinagre Balsâmico', cat: 'outro', kcal: 88, p: 0.5, c: 17, f: 0, days: 720, unit: 'ml' },
  'tucupi': { e: '🍶', cat: 'outro', kcal: 25, p: 0.5, c: 5, f: 0.1, days: 30, unit: 'ml' },
  'geleia': { e: '🍯', cat: 'outro', kcal: 278, p: 0.4, c: 68, f: 0.1, days: 180, unit: 'g' },
  'mel': { e: '🍯', cat: 'outro', kcal: 304, p: 0.3, c: 82, f: 0, days: 720, unit: 'g' },
  'melado': { e: '🍯', cat: 'carboidrato', kcal: 297, p: 0, c: 76, f: 0, days: 365, unit: 'g' },

  // ---- ajudantes de cozinha (fermentos, amidos, confeitaria)
  'amido de milho': { e: '🌽', cat: 'outro', kcal: 381, p: 0.3, c: 91, f: 0.1, days: 720, unit: 'g' },
  'maisena': { e: '🌽', cat: 'outro', kcal: 381, p: 0.3, c: 91, f: 0.1, days: 720, unit: 'g' },
  'fermento em po': { e: '🧁', l: 'Fermento em Pó', cat: 'outro', kcal: 53, p: 0, c: 28, f: 0, days: 365, unit: 'g' },
  'fermento biologico': { e: '🍞', l: 'Fermento Biológico', cat: 'outro', kcal: 325, p: 40, c: 41, f: 7.6, days: 180, unit: 'g' },
  'bicarbonato de sodio': { e: '🧂', l: 'Bicarbonato de Sódio', cat: 'outro', kcal: 0, p: 0, c: 0, f: 0, days: 720, unit: 'g' },
  'gelatina': { e: '🍮', cat: 'outro', kcal: 335, p: 85, c: 0, f: 0, days: 720, unit: 'g' },
  'leite condensado': { e: '🥫', cat: 'ultraprocessado', kcal: 321, p: 7.9, c: 54, f: 8.7, days: 365, unit: 'g' },
  'leite em po': { e: '🥛', l: 'Leite em Pó', cat: 'proteina', kcal: 496, p: 26, c: 38, f: 27, days: 365, unit: 'g' },
  'chocolate em po': { e: '🍫', l: 'Chocolate em Pó', cat: 'ultraprocessado', kcal: 400, p: 5, c: 80, f: 5, days: 365, unit: 'g' },
  'cacau em po': { e: '🍫', l: 'Cacau em Pó', cat: 'outro', kcal: 228, p: 20, c: 58, f: 14, days: 365, unit: 'g' },
  'essencia de baunilha': { e: '🌼', l: 'Essência de Baunilha', cat: 'outro', kcal: 288, p: 0, c: 13, f: 0, days: 720, unit: 'ml' },
  'acucar de confeiteiro': { e: '🍬', l: 'Açúcar de Confeiteiro', cat: 'carboidrato', kcal: 389, p: 0, c: 100, f: 0, days: 540, unit: 'g' },
  'acucar mascavo': { e: '🍬', l: 'Açúcar Mascavo', cat: 'carboidrato', kcal: 380, p: 0.1, c: 98, f: 0, days: 540, unit: 'g' },
  'rapadura': { e: '🍬', cat: 'carboidrato', kcal: 352, p: 0.5, c: 90, f: 0.1, days: 365, unit: 'g' },
  'adocante': { e: '🍬', l: 'Adoçante', cat: 'outro', kcal: 0, p: 0, c: 0, f: 0, days: 720, unit: 'ml' },

  // ---- ultraprocessados
  'refrigerante': { e: '🥤', cat: 'ultraprocessado', kcal: 42, p: 0, c: 10.6, f: 0, days: 180, unit: 'ml' },
  'biscoito': { e: '🍪', cat: 'ultraprocessado', kcal: 480, p: 6, c: 65, f: 21, days: 120, unit: 'g' },
  'bolacha': { e: '🍪', cat: 'ultraprocessado', kcal: 480, p: 6, c: 65, f: 21, days: 120, unit: 'g' },
  'salgadinho': { e: '🍿', cat: 'ultraprocessado', kcal: 536, p: 6, c: 53, f: 33, days: 90, unit: 'g' },
  'chocolate': { e: '🍫', cat: 'ultraprocessado', kcal: 535, p: 8, c: 59, f: 30, days: 180, unit: 'g' },
  'sorvete': { e: '🍦', cat: 'ultraprocessado', kcal: 207, p: 3.5, c: 24, f: 11, days: 120, unit: 'ml' },
  'macarrao instantaneo': { e: '🍜', l: 'Macarrão Instantâneo', cat: 'ultraprocessado', kcal: 448, p: 9, c: 60, f: 18, days: 180, unit: 'un', gPerUn: 80 },
  'nuggets': { e: '🍗', cat: 'ultraprocessado', kcal: 296, p: 15, c: 19, f: 18, days: 120, unit: 'g' },
  'pizza congelada': { e: '🍕', cat: 'ultraprocessado', kcal: 266, p: 11, c: 33, f: 10, days: 120, unit: 'un', gPerUn: 400 },
  'suco de caixinha': { e: '🧃', cat: 'ultraprocessado', kcal: 45, p: 0.2, c: 11, f: 0, days: 180, unit: 'ml' },
  'cerveja': { e: '🍺', cat: 'ultraprocessado', kcal: 43, p: 0.5, c: 3.6, f: 0, days: 180, unit: 'ml' },

  // ---- outros
  'cafe': { e: '☕', l: 'Café', cat: 'outro', kcal: 2, p: 0.1, c: 0, f: 0, days: 180, unit: 'g' },
  'goiabada': { e: '🍐', cat: 'ultraprocessado', kcal: 260, p: 0.4, c: 65, f: 0.1, days: 180, unit: 'g' },
  'doce de leite': { e: '🍯', cat: 'ultraprocessado', kcal: 315, p: 6.8, c: 55, f: 7.4, days: 180, unit: 'g' },
  'pato': { e: '🦆', cat: 'proteina', kcal: 337, p: 19, c: 0, f: 28, days: 3, unit: 'un', gPerUn: 2000 },
};

// media por categoria: usada quando o item nao esta na tabela
const CAT_FALLBACK = {
  proteina: { kcal: 180, p: 20, c: 3, f: 9, days: 5 },
  carboidrato: { kcal: 250, p: 6, c: 50, f: 2, days: 90 },
  lipidio: { kcal: 600, p: 5, c: 8, f: 60, days: 120 },
  ultraprocessado: { kcal: 400, p: 6, c: 50, f: 20, days: 120 },
  hortifruti: { kcal: 45, p: 1.5, c: 9, f: 0.3, days: 8 },
  tempero: { kcal: 250, p: 8, c: 50, f: 8, days: 365 },
  outro: { kcal: 100, p: 3, c: 15, f: 3, days: 90 },
};

/**
 * Conjuntos de substitutos aceitos. A receita aponta para um grupo e ganha as
 * opcoes recomendadas para AQUELE prato: o queijo que derrete no forno nao e o
 * mesmo que vai na salada, e a carne de bife nao e a carne de cozido.
 */
export const GRUPOS = {
  'bife': ['Contrafilé', 'Patinho', 'Alcatra', 'Coxão Mole', 'Maminha'],
  'carne-cozido': ['Músculo', 'Acém', 'Coxão Duro', 'Paleta', 'Costela'],
  'carne-moida': ['Patinho', 'Acém', 'Coxão Mole'],
  'carne-assado': ['Alcatra', 'Maminha', 'Picanha', 'Fraldinha'],
  'carne-seca': ['Carne Seca', 'Carne de Sol', 'Charque'],
  'frango-file': ['Peito de Frango', 'Filé de Frango', 'Sobrecoxa'],
  'frango-pedaco': ['Coxa de Frango', 'Sobrecoxa', 'Asa de Frango', 'Frango Inteiro'],
  'porco': ['Lombo', 'Pernil', 'Costelinha', 'Bisteca'],
  'peixe-branco': ['Tilápia', 'Pescada', 'Merluza', 'Cação'],
  'peixe-moqueca': ['Robalo', 'Badejo', 'Cação', 'Tilápia'],
  'peixe-amazonia': ['Pirarucu', 'Tambaqui', 'Tilápia'],
  'linguica': ['Linguiça Calabresa', 'Linguiça Toscana', 'Paio'],
  'queijo-derrete': ['Mussarela', 'Queijo Prato', 'Provolone', 'Queijo Coalho'],
  'queijo-branco': ['Queijo Minas', 'Ricota', 'Queijo Coalho'],
  'queijo-ralado': ['Queijo Parmesão', 'Queijo Prato'],
  'queijo-cremoso': ['Requeijão', 'Catupiry', 'Creme de Leite'],
  'massa-curta': ['Penne', 'Parafuso', 'Gravatinha', 'Conchinha'],
  'massa-longa': ['Espaguete', 'Talharim', 'Fettuccine', 'Cabelo de Anjo'],
  'gordura-refogar': ['Óleo', 'Azeite', 'Manteiga'],
  'folha-salada': ['Alface', 'Rúcula', 'Agrião', 'Espinafre'],
  'raiz-cozida': ['Mandioca', 'Macaxeira', 'Aipim', 'Inhame', 'Cará'],
  'farinha-mesa': ['Farinha de Mandioca', 'Farinha de Milho'],
  'feijao-nordeste': ['Feijão de Corda', 'Feijão Verde', 'Feijão-Fradinho'],
  'leite-cremoso': ['Creme de Leite', 'Leite de Coco', 'Leite'],
  'fruta-vitamina': ['Banana', 'Manga', 'Morango', 'Mamão', 'Abacate'],
  'fruta-acida': ['Limão', 'Laranja', 'Maracujá', 'Abacaxi'],
  'cheiro-verde': ['Cheiro Verde', 'Salsinha', 'Cebolinha', 'Coentro'],
};

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Reduz uma palavra ao radical usado nas comparacoes: sem acento (ja veio do
 * norm) e sem plural. "Limoes" e "limao", "ovos" e "ovo", "pastEis" e "pastel".
 * Nao e gramatica de verdade, e um denominador comum: o que importa e que os
 * dois lados da comparacao caiam no mesmo lugar.
 */
function raiz(palavra) {
  const p = palavra;
  if (p.length < 4 || !p.endsWith('s')) return p;
  if (p.endsWith('oes') || p.endsWith('aes')) return `${p.slice(0, -3)}ao`;
  if (p.endsWith('ais')) return `${p.slice(0, -3)}al`;
  if (p.endsWith('eis')) return `${p.slice(0, -3)}el`;
  if (p.endsWith('ois')) return `${p.slice(0, -3)}ol`;
  if (p.endsWith('is')) return `${p.slice(0, -2)}il`;
  if (p.endsWith('ns')) return `${p.slice(0, -2)}m`;
  if (p.endsWith('res') || p.endsWith('zes') || p.endsWith('ses')) return p.slice(0, -2);
  return p.slice(0, -1);
}

/** Chave de comparacao: minusculo, sem acento e sem plural, palavra por palavra. */
export const chave = (s) => norm(s).split(' ').filter(Boolean).map(raiz).join(' ');

/**
 * "carne" esta dentro de "carne moida"? Sim. Dentro de "salada"? Nao.
 * A checagem e por palavra inteira, senao "sal" casa com "salsinha" e o app
 * passa a achar que tem tempero porque tem salada.
 */
function contemTermo(texto, termo) {
  if (!termo || !texto) return false;
  if (texto === termo) return true;
  let de = texto.indexOf(termo);
  while (de !== -1) {
    const antes = de === 0 || texto[de - 1] === ' ';
    const depois = de + termo.length === texto.length || texto[de + termo.length] === ' ';
    if (antes && depois) return true;
    de = texto.indexOf(termo, de + 1);
  }
  return false;
}

/**
 * Produtos feitos A PARTIR de outro alimento. "Farinha de mandioca" contém a
 * palavra mandioca mas não é mandioca, e quem tem molho de tomate na despensa
 * não tem tomate. Já "peito de frango" é frango de verdade — por isso a lista
 * é de cabeças de produto, não de qualquer composto com "de".
 */
const DERIVADOS = new Set([
  'farinha', 'leite', 'molho', 'oleo', 'azeite', 'suco', 'extrato', 'essencia',
  'creme', 'pasta', 'massa', 'caldo', 'racao', 'goma', 'polvilho', 'vinagre',
  'amido', 'fermento', 'macarrao', 'geleia', 'doce', 'petisco', 'areia', 'casca',
]);

/**
 * O nome mais longo é um derivado que não serve pelo mais curto?
 * Só serve quando o pedido inclui a cabeça: "farinha de trigo" atende "farinha",
 * mas não atende "trigo".
 */
function derivadoBloqueia(longo, curto) {
  const partes = longo.split(' ');
  if (partes.length < 2 || !DERIVADOS.has(partes[0])) return false;
  return !contemTermo(curto, partes[0]);
}

/** Dois nomes livres falam do mesmo alimento? */
export function mesmoAlimento(a, b) {
  const x = chave(a);
  const y = chave(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (contemTermo(x, y) && !derivadoBloqueia(x, y)) return true;
  if (contemTermo(y, x) && !derivadoBloqueia(y, x)) return true;
  return false;
}

// indice pre-calculado: chave de comparacao -> chave original da tabela
const IDX = new Map();
for (const key of Object.keys(FOODS)) IDX.set(chave(key), key);

const MINUSCULAS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'com', 'ao', 'para', 'em', 'no', 'na']);

/** "pao de forma" -> "Pao de Forma": preposição no meio fica minúscula. */
const titulo = (s) =>
  s
    .split(' ')
    .map((w, i) => (i > 0 && MINUSCULAS.has(w) ? w : w.replace(/^\w/, (c) => c.toUpperCase())))
    .join(' ');

/** Nome bonito de uma chave da tabela ("pao de forma" -> "Pão de Forma"). */
export function labelDe(key) {
  return FOODS[key]?.l ?? titulo(key);
}

/** Acha a melhor entrada da tabela para um nome livre digitado pelo usuario. */
export function matchFood(name) {
  const n = chave(name);
  if (!n) return null;

  const direto = IDX.get(n);
  if (direto) return FOODS[direto];

  // preferimos a chave mais longa que aparece no nome ("peito de frango" > "frango")
  let best = null;
  let bestLen = 0;
  for (const [cmp, key] of IDX) {
    const casa =
      (contemTermo(n, cmp) && !derivadoBloqueia(n, cmp)) ||
      (contemTermo(cmp, n) && !derivadoBloqueia(cmp, n));
    if (cmp.length > bestLen && casa) {
      best = FOODS[key];
      bestLen = cmp.length;
    }
  }
  return best;
}

/** Como o app prefere escrever esse alimento, com acento e maiuscula. */
export function nomeBonito(name) {
  const n = chave(name);
  const key = IDX.get(n);
  return key ? labelDe(key) : titulo(String(name || '').trim());
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

// ---------------------------------------------------------------- opcoes
/**
 * As opcoes de um ingrediente: aceita o nome de um grupo ("queijo-derrete"),
 * uma lista pronta, ou o JSON que veio do banco.
 */
export function opcoesDe(alts) {
  if (!alts) return [];
  let lista = alts;
  if (typeof lista === 'string') {
    const t = lista.trim();
    if (!t || t === '[]') return [];
    if (GRUPOS[t]) return [...GRUPOS[t]];
    try {
      lista = JSON.parse(t);
    } catch {
      lista = [t];
    }
  }
  if (!Array.isArray(lista)) return [];
  return lista.flatMap((x) => (GRUPOS[x] ? GRUPOS[x] : [String(x)])).filter(Boolean);
}

/** Todos os nomes que servem para esse ingrediente: o principal e os substitutos. */
export function nomesAceitos(ing) {
  const alts = opcoesDe(ing?.alts);
  return [ing?.name, ...alts].filter(Boolean);
}

/**
 * O armario atende esse ingrediente? Basta UM dos nomes aceitos bater.
 * `armario` e uma lista de nomes (string) ou de itens ({ name }).
 */
export function armarioAtende(armario, ing) {
  return !!acharNoArmario(armario, ing);
}

/** O item do armario que atende o ingrediente, ou null. Respeita a ordem das opcoes. */
export function acharNoArmario(armario, ing) {
  const itens = armario.map((x) => (typeof x === 'string' ? { name: x } : x));
  for (const nome of nomesAceitos(ing)) {
    const achado = itens.find((it) => mesmoAlimento(it.name, nome));
    if (achado) return achado;
  }
  return null;
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
  const n = chave(term);
  const keys = Object.keys(FOODS);
  const pool = n ? keys.filter((k) => chave(k).includes(n)) : keys;
  return pool.slice(0, limit).map((k) => ({
    name: labelDe(k),
    category: FOODS[k].cat,
    unit: FOODS[k].unit,
    emoji: FOODS[k].e,
  }));
}

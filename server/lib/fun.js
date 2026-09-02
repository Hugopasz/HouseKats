// Conteudo "divertido" do app: titulos aleatorios, paleta de cores individual,
// emojis de avatar e recompensas do mes. Fonte unica: o front busca em /api/meta.

export const TITLES = [
  'Guardião da Geladeira',
  'Lorde do Miojo',
  'Rei da Louça Empilhada',
  'Sommelier de Café Requentado',
  'Mestre Jedi do Fogão',
  'Doutor em Sobras',
  'Caçador de Validade Vencida',
  'Duque do Domingo Preguiçoso',
  'Embaixador do Delivery',
  'Xerife da Pia',
  'Ministro do Papel Higiênico',
  'Zelador de Tupperware Perdido',
  'Capitão do Feijão de Segunda',
  'Barão do Arroz Requentado',
  'General das Meias Solteiras',
  'Alquimista de Ingrediente Aleatório',
  'Vidente do Que Tem na Geladeira',
  'Curador do Vale-Tudo do Almoço',
  'Arquiteto de Sanduíche Improvável',
  'Pastor do Pão Amanhecido',
  'Fiscal do Controle Remoto',
  'Guru do Modo Avião Doméstico',
  'Titã da Torneira Pingando',
  'Cavaleiro do Cesto de Roupa',
  'Comandante do Micro-ondas',
  'Filósofo das 3 da Manhã',
  'Bibliotecário de Potes sem Tampa',
  'Domador de Panela Queimada',
  'Prefeito da Bagunça Organizada',
  'Escudeiro do Detergente',
  'Profeta do Café Acabando',
  'Herdeiro do Sofá Melhor',
  'Anfitrião de Formiga',
  'Colecionador de Sacola Retornável',
  'Regente da Playlist da Faxina',
  'Corregedor da Geladeira Alheia',
  'Ilusionista do Prato Limpo',
  'Cronista do Jantar de Ontem',
  'Bacharel em Ficar com Fome Tarde',
  'Sentinela do Último Iogurte',
];

// Cada integrante escolhe a sua, e ela muda a UI inteira para essa pessoa.
export const COLORS = {
  roxo: { label: 'Roxo', hex: '#8b5cf6', soft: '#c4b5fd' },
  rosa: { label: 'Rosa', hex: '#ec4899', soft: '#f9a8d4' },
  vermelho: { label: 'Vermelho', hex: '#ef4444', soft: '#fca5a5' },
  laranja: { label: 'Laranja', hex: '#f97316', soft: '#fdba74' },
  amarelo: { label: 'Amarelo', hex: '#eab308', soft: '#fde047' },
  verde: { label: 'Verde', hex: '#22c55e', soft: '#86efac' },
  menta: { label: 'Menta', hex: '#14b8a6', soft: '#5eead4' },
  azul: { label: 'Azul', hex: '#3b82f6', soft: '#93c5fd' },
  anil: { label: 'Anil', hex: '#6366f1', soft: '#a5b4fc' },
  grafite: { label: 'Grafite', hex: '#64748b', soft: '#cbd5e1' },
};

export const AVATARS = [
  '🐱', '🐈', '🐈‍⬛', '😺', '😸', '🙀', '😹', '🐯', '🦁', '🐭',
  '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐵', '🐶', '🐷',
  '🦉', '🦆', '🐧', '🦖', '🐙', '🦄', '🐢', '🦔', '🐮', '👾',
];

export const ROOM_EMOJIS = ['🛏️', '🍳', '🚿', '🛋️', '🚪', '🧺', '🌿', '🚗', '📚', '🧸'];

// modo aleatorio do "escolher recompensa do mes"
export const REWARDS = [
  'Escolhe o filme da sexta',
  'Fica isento da louça por 3 dias',
  'Pede o delivery que quiser (a casa paga)',
  'Escolhe o cardápio do fim de semana inteiro',
  'Ganha o lado bom do sofá por um mês',
  'Manda outra pessoa fazer uma tarefa sua',
  'Sobremesa preferida na geladeira a semana toda',
  'Escolhe a playlist da faxina do mês',
  'Um dia inteiro sem tarefa nenhuma',
  'Vale um café especial pago pela casa',
  'Decide o passeio do fim de semana',
  'Pode adiar uma tarefa chata para o mês seguinte',
  'Ganha o último pedaço de qualquer coisa',
  'Escolhe o jantar de aniversário da casa',
  'Vale-abraço: alguém organiza seu armário',
];

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomTitle(used = []) {
  const free = TITLES.filter((t) => !used.includes(t));
  return pick(free.length ? free : TITLES);
}

/** Caras para os moradores de quatro patas (e afins). */
export const PET_AVATARS = [
  '🐶', '🐕', '🦮', '🐩', '🐱', '🐈', '🐈‍⬛', '🐹',
  '🐰', '🐢', '🐦', '🦜', '🐠', '🐍', '🦎', '🐷',
];

/** Espécie muda o apetite estimado e o que aparece na praça. */
export const SPECIES = {
  cachorro: { emoji: '🐶', label: 'Cachorro', racao: 'Ração de cachorro' },
  gato: { emoji: '🐱', label: 'Gato', racao: 'Ração de gato' },
  passaro: { emoji: '🐦', label: 'Pássaro', racao: 'Alpiste' },
  roedor: { emoji: '🐹', label: 'Roedor', racao: 'Ração de roedor' },
  peixe: { emoji: '🐠', label: 'Peixe', racao: 'Ração de peixe' },
  reptil: { emoji: '🦎', label: 'Réptil', racao: 'Ração de réptil' },
  outro: { emoji: '🐾', label: 'Outro', racao: 'Ração' },
};

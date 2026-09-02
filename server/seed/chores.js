// Cômodos sugeridos e as tarefas que nascem com cada um.
// minutes/difficulty aqui são só o palpite inicial. O questionário da casa
// substitui esses números pela média dos integrantes.

export const ROOM_PRESETS = [
  { key: 'cozinha', name: 'Cozinha', emoji: '🍳' },
  { key: 'banheiro', name: 'Banheiro', emoji: '🚿' },
  { key: 'quarto', name: 'Quarto', emoji: '🛏️' },
  { key: 'sala', name: 'Sala', emoji: '🛋️' },
  { key: 'area', name: 'Área de serviço', emoji: '🧺' },
  { key: 'varanda', name: 'Varanda', emoji: '🌿' },
  { key: 'escritorio', name: 'Escritório', emoji: '📚' },
  { key: 'garagem', name: 'Garagem', emoji: '🚗' },
  { key: 'geral', name: 'Casa toda', emoji: '🏠' },
];

export const CHORE_PRESETS = {
  cozinha: [
    { name: 'Lavar a louça', emoji: '🍽️', minutes: 15, difficulty: 3 },
    { name: 'Limpar o fogão', emoji: '🔥', minutes: 10, difficulty: 3 },
    { name: 'Limpar a bancada', emoji: '🧽', minutes: 5, difficulty: 1 },
    { name: 'Tirar o lixo', emoji: '🗑️', minutes: 5, difficulty: 2 },
    { name: 'Varrer a cozinha', emoji: '🧹', minutes: 10, difficulty: 2 },
    { name: 'Passar pano na cozinha', emoji: '🪣', minutes: 15, difficulty: 3 },
    { name: 'Limpar a geladeira', emoji: '🧊', minutes: 20, difficulty: 4 },
    { name: 'Guardar as compras', emoji: '🛍️', minutes: 10, difficulty: 2 },
  ],
  banheiro: [
    { name: 'Limpar o vaso', emoji: '🚽', minutes: 10, difficulty: 4 },
    { name: 'Limpar o box', emoji: '🚿', minutes: 15, difficulty: 4 },
    { name: 'Limpar a pia e o espelho', emoji: '🪞', minutes: 10, difficulty: 2 },
    { name: 'Trocar as toalhas', emoji: '🧻', minutes: 5, difficulty: 1 },
    { name: 'Passar pano no banheiro', emoji: '🪣', minutes: 10, difficulty: 3 },
  ],
  quarto: [
    { name: 'Arrumar a cama', emoji: '🛏️', minutes: 5, difficulty: 1 },
    { name: 'Varrer o quarto', emoji: '🧹', minutes: 10, difficulty: 2 },
    { name: 'Passar pano no quarto', emoji: '🪣', minutes: 10, difficulty: 3 },
    { name: 'Trocar o lençol', emoji: '🛌', minutes: 10, difficulty: 3 },
    { name: 'Organizar o armário', emoji: '👕', minutes: 25, difficulty: 4 },
    { name: 'Tirar o pó', emoji: '🪶', minutes: 10, difficulty: 2 },
  ],
  sala: [
    { name: 'Varrer a sala', emoji: '🧹', minutes: 10, difficulty: 2 },
    { name: 'Passar pano na sala', emoji: '🪣', minutes: 15, difficulty: 3 },
    { name: 'Tirar o pó dos móveis', emoji: '🪶', minutes: 10, difficulty: 2 },
    { name: 'Organizar a bagunça', emoji: '📦', minutes: 10, difficulty: 2 },
    { name: 'Aspirar o sofá', emoji: '🛋️', minutes: 15, difficulty: 3 },
  ],
  area: [
    { name: 'Colocar roupa para lavar', emoji: '🧼', minutes: 5, difficulty: 1 },
    { name: 'Estender a roupa', emoji: '🧺', minutes: 15, difficulty: 3 },
    { name: 'Recolher e dobrar a roupa', emoji: '👔', minutes: 20, difficulty: 3 },
    { name: 'Passar roupa', emoji: '🔥', minutes: 30, difficulty: 5 },
    { name: 'Guardar a roupa', emoji: '🗄️', minutes: 10, difficulty: 2 },
  ],
  varanda: [
    { name: 'Regar as plantas', emoji: '🪴', minutes: 5, difficulty: 1 },
    { name: 'Varrer a varanda', emoji: '🧹', minutes: 10, difficulty: 2 },
    { name: 'Limpar os vidros', emoji: '🪟', minutes: 20, difficulty: 4 },
  ],
  escritorio: [
    { name: 'Organizar a mesa', emoji: '🗂️', minutes: 10, difficulty: 2 },
    { name: 'Tirar o pó', emoji: '🪶', minutes: 5, difficulty: 1 },
    { name: 'Varrer o escritório', emoji: '🧹', minutes: 10, difficulty: 2 },
  ],
  garagem: [
    { name: 'Varrer a garagem', emoji: '🧹', minutes: 15, difficulty: 3 },
    { name: 'Organizar as ferramentas', emoji: '🔧', minutes: 20, difficulty: 3 },
    { name: 'Levar o lixo para a rua', emoji: '🗑️', minutes: 5, difficulty: 2 },
  ],
  geral: [
    { name: 'Tirar o lixo geral', emoji: '🗑️', minutes: 10, difficulty: 2 },
    { name: 'Limpar os interruptores e maçanetas', emoji: '🚪', minutes: 10, difficulty: 2 },
    { name: 'Ir ao mercado', emoji: '🛒', minutes: 45, difficulty: 4 },
  ],
};

/** Sugestões para a lista particular de tarefas especiais. */
export const SPECIAL_SUGGESTIONS = [
  'Consertar o liquidificador',
  'Trocar a lâmpada queimada',
  'Ligar para o senhorio',
  'Levar o gato ao veterinário',
  'Pendurar aquele quadro',
  'Desentupir a pia',
  'Fazer backup do computador',
  'Trocar a resistência do chuveiro',
  'Organizar as fotos do celular',
  'Devolver o que pegou emprestado',
  'Marcar o dentista',
  'Limpar o filtro do ar-condicionado',
];

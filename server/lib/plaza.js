import { all, get, run, logEvent } from '../db.js';

/**
 * A Praça é o lado social da casa: os bichinhos de cada integrante ficam
 * perambulando, conversando e reagindo ao que rola na vida real. Eles não têm
 * necessidades e não dá para perder o jogo. É um termômetro do humor da casa.
 */

/** Enfeites compráveis. O preço é em moedas ganhas comendo bem e fazendo tarefa. */
export const CATALOGO = [
  { key: 'banco',    emoji: '🪑', label: 'Banco de praça',   preco: 10, dica: 'Lugar para sentar e conversar' },
  { key: 'arvore',   emoji: '🌳', label: 'Árvore',           preco: 15, dica: 'Sombra para as tardes' },
  { key: 'fonte',    emoji: '⛲', label: 'Fonte',            preco: 40, dica: 'O ponto de encontro da praça' },
  { key: 'flores',   emoji: '🌷', label: 'Canteiro',         preco: 12, dica: 'Deixa tudo mais bonito' },
  { key: 'lampada',  emoji: '🏮', label: 'Lampião',          preco: 18, dica: 'Ilumina as conversas noturnas' },
  { key: 'quiosque', emoji: '🏪', label: 'Quiosque',         preco: 55, dica: 'Onde eles fofocam sobre as receitas' },
  { key: 'gato',     emoji: '🐈', label: 'Gato de rua',      preco: 30, dica: 'Aparece e some quando quer' },
  { key: 'radio',    emoji: '📻', label: 'Rádio',            preco: 25, dica: 'Música ambiente para a praça' },
  { key: 'churrasco',emoji: '🔥', label: 'Churrasqueira',    preco: 70, dica: 'Reúne todo mundo em volta' },
  { key: 'piscina',  emoji: '🏊', label: 'Piscininha',       preco: 90, dica: 'Luxo de praça' },
  { key: 'balanco',  emoji: '🛝', label: 'Playground',       preco: 45, dica: 'Diversão garantida' },
  { key: 'horta',    emoji: '🌱', label: 'Horta comunitária', preco: 35, dica: 'Combina com quem cozinha' },
];

/**
 * Fundos da praça. `chao` pinta o gramado e `piso` o calçadão redondo do meio;
 * o front joga os dois em variáveis CSS, então dá para trocar sem tocar no
 * estilo. O gramado é de graça: toda casa começa com ele.
 */
export const FUNDOS = [
  { key: 'gramado',  emoji: '🌿', label: 'Gramado',      preco: 0,  dica: 'O verde de sempre',            chao: '#4f9d7a', piso: '#c9a227' },
  { key: 'outono',   emoji: '🍂', label: 'Outono',       preco: 20, dica: 'Folhas secas no chão',         chao: '#b5762c', piso: '#8a4b1d' },
  { key: 'cerrado',  emoji: '🌾', label: 'Cerrado',      preco: 20, dica: 'Capim alto e terra batida',    chao: '#a89a4f', piso: '#8a6b3a' },
  { key: 'noite',    emoji: '🌙', label: 'Noite',        preco: 25, dica: 'Para as conversas tardias',    chao: '#2f3f6b', piso: '#6478b4' },
  { key: 'praia',    emoji: '🏖️', label: 'Beira-mar',    preco: 30, dica: 'Areia fofa até o calçadão',    chao: '#d9bd82', piso: '#3aa0bd' },
  { key: 'neve',     emoji: '❄️', label: 'Nevado',       preco: 30, dica: 'Frio de rachar, mas bonito',   chao: '#bcd6e8', piso: '#8fa9bd' },
  { key: 'floresta', emoji: '🌲', label: 'Floresta',     preco: 35, dica: 'Sombra fechada o dia todo',    chao: '#2f6b4a', piso: '#6b5a3a' },
  { key: 'lavanda',  emoji: '💜', label: 'Lavanda',      preco: 40, dica: 'Um campo roxo inteiro',        chao: '#8b6fc4', piso: '#c9a9e0' },
  { key: 'lunar',    emoji: '🌕', label: 'Solo lunar',   preco: 70, dica: 'Ninguém sabe como foi parar lá', chao: '#8a8f99', piso: '#5f646d' },
];

export const FUNDO_PADRAO = 'gramado';

/** Enfeite e fundo vivem na mesma tabela; o prefixo separa os dois. */
const chaveDeFundo = (key) => `bg:${key}`;

export const acharFundo = (key) => FUNDOS.find((f) => f.key === key) ?? FUNDOS[0];

/** Quanto vale cada coisa boa que a pessoa faz. */
export const MOEDAS = {
  refeicaoCerta: 2,      // dia fechado dentro da meta
  streakDia: 1,          // bônus por manter a sequência
  tarefa: 0.5,           // por estrelinha da tarefa
  receitaFeita: 1,
  hidratacao: 2,         // bateu a meta de água
};

const HUMOR_PESO = {
  '😄': 2, '🥳': 2, '🙂': 1, '😐': 0, '😴': -1, '😔': -2, '😤': -2, '🤒': -2,
};

/** Credita moedas e deixa rastro, para dar para auditar depois. */
export function creditar(houseId, memberId, amount, reason, ref = '') {
  if (!memberId || !amount) return;
  run(
    'INSERT INTO coin_log (house_id, member_id, amount, reason, ref) VALUES (?,?,?,?,?)',
    houseId, memberId, amount, reason, String(ref)
  );
  run('UPDATE member SET coins = ROUND(coins + ?, 2) WHERE id = ?', amount, memberId);
}

export function saldo(memberId) {
  return get('SELECT coins FROM member WHERE id = ?', memberId)?.coins ?? 0;
}

/** Cofre da casa: a praça é comprada com o esforço de todo mundo. */
export function saldoDaCasa(houseId) {
  return Math.round((get(
    "SELECT COALESCE(SUM(coins),0) AS c FROM member WHERE house_id = ? AND kind = 'pessoa'", houseId
  )?.c ?? 0) * 100) / 100;
}

/**
 * Estado de espírito de cada bichinho, a partir do humor do dia e de como a
 * pessoa está indo na comida e nas tarefas. É isso que muda o jeito deles
 * andarem e o que falam.
 */
export function bichinhos(houseId) {
  const hoje = new Date().toISOString().slice(0, 10);
  const membros = all('SELECT * FROM member WHERE house_id = ? ORDER BY id', houseId);

  return membros.map((m) => {
    const humor = get('SELECT * FROM mood WHERE member_id = ? AND day = ?', m.id, hoje);
    const streak = get('SELECT current FROM streak WHERE member_id = ?', m.id)?.current ?? 0;
    const tarefasHoje = get(
      'SELECT COUNT(*) AS n FROM chore_done WHERE member_id = ? AND day = ?', m.id, hoje
    ).n;
    const comeuHoje = get(
      "SELECT COUNT(*) AS n FROM consumption_claim WHERE member_id = ? AND day = ? AND status != 'contested'",
      m.id, hoje
    ).n;
    const agua = get(
      'SELECT COALESCE(SUM(water_ml),0) AS ml FROM drink_log WHERE member_id = ? AND day = ?', m.id, hoje
    ).ml;

    // ânimo de -3 a +3, misturando humor declarado com o que a pessoa fez
    const declarado = humor?.emoji ? (HUMOR_PESO[humor.emoji] ?? 0) : null;
    let animo = declarado ?? 0;
    if (streak >= 3) animo += 1;
    if (tarefasHoje > 0) animo += 1;
    if (comeuHoje === 0) animo -= 1;

    // Quem não marcou humor está neutro, ponto. Ainda não ter registrado comida
    // hoje não é motivo para o app decidir que a pessoa está mal: às vezes são
    // dez da manhã. Sem humor declarado, o piso é o neutro; os sinais bons ainda
    // levantam, os ruins só empurram para baixo quem disse que não está bem.
    if (declarado === null) animo = Math.max(0, animo);
    animo = Math.max(-3, Math.min(3, animo));

    return {
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      kind: m.kind,
      species: m.species,
      temporary: !!m.temporary,
      coins: m.coins,
      humor: humor?.emoji ?? null,
      humorLabel: humor?.label ?? '',
      animo,
      estado: animo >= 2 ? 'radiante' : animo >= 1 ? 'contente' : animo === 0 ? 'neutro' : animo >= -1 ? 'quieto' : 'pra baixo',
      streak,
      tarefasHoje,
      comeuHoje,
      agua,
    };
  });
}

/** Cada bicho fala do seu jeito. Espécie sem lista própria cai em 'outro'. */
const FALAS_PET = {
  cachorro: [
    'au au!', '*abana o rabo*', '*persegue o próprio rabo*', '*traz a bolinha*',
    '*late para nada*', 'passeio? passeio? passeio?', '*deita no pé de alguém*',
    '*cheira o chão*', 'cadê a bolinha?', '*se joga de barriga para cima*',
  ],
  gato: [
    'miau...', '*cochila ao sol*', '*derruba algo da mesa*', '*ignora todo mundo*',
    '*se espreguiça devagar*', '*olha fixo para o nada*', 'prrr prrr',
    '*senta em cima do que você estava lendo*', 'me alimenta, humano',
    '*decide que hoje não quer carinho*',
  ],
  passaro: [
    'piu piu!', '*canta sozinho*', '*balança no poleiro*', '*imita alguém da casa*',
    '*bica o espelho*', '*arruma as penas*', 'oi! oi! oi!',
  ],
  roedor: [
    '*enche as bochechas*', '*corre na rodinha*', '*rói tudo que vê*',
    '*esconde comida no canto*', '*bocejo minúsculo*', '*cavuca a serragem*',
    '*cochila numa bolinha*',
  ],
  peixe: [
    '*blub*', '*dá uma volta no aquário*', '*encara o vidro*',
    '*finge que não lembra de nada*', '*sobe até a superfície*',
  ],
  reptil: [
    '*fica parado uma hora*', '*pisca bem devagar*', '*toma sol*',
    '*muda de pedra*', '*mostra a língua*',
  ],
  outro: [
    '*faz um barulhinho*', '*observa a praça*', '*cochila*', '*bocejo*',
    'cadê a comida?', '*anda em círculos*',
  ],
};

/** Conversa fiada: qualquer um pode soltar, independente do que rolou. */
const PAPO_SOLTO = [
  'que dia é hoje mesmo?', 'a praça tá boa hoje', 'alguém viu meu chinelo?',
  'tô pensando em nada', 'esse banco é confortável', 'depois eu vejo isso',
  'a gente devia sair mais', 'juro que já arrumei aquilo', 'silêncio bom, esse',
  'tava pensando em um lanche', 'que preguiça gostosa', 'amanhã eu começo tudo',
  'alguém trouxe música?', 'tô só de passagem', 'me chama se precisar',
];

const PAPO_MANHA = [
  'bom dia, gente', 'ainda tô acordando', 'preciso de um café',
  'o dia mal começou e já tô cansado', 'hoje eu rendo, prometo',
];
const PAPO_TARDE = [
  'que sono depois do almoço', 'a tarde passa devagar', 'tá quente hoje, né?',
  'já é essa hora?',
];
const PAPO_NOITE = [
  'dia longo, esse', 'já pensou em dormir cedo?', 'a casa fica bonita à noite',
  'só mais um pouquinho e eu vou',
];

const FALAS_TRISTE = [
  'hoje foi puxado...', 'preciso de um abraço', 'queria um dia mais leve',
  'não tô muito bem hoje', 'me deixa quieto um pouco', 'tá difícil, mas passa',
  'nada demais, só cansaço', 'amanhã melhora',
];
const FALAS_FELIZ = [
  'que dia bom!', 'tô muito bem hoje', 'alguém quer conversar?',
  'a casa tá em ordem!', 'hoje deu tudo certo', 'tô de bem com a vida',
  'vontade de dançar', 'olha esse solzinho',
];
const FALAS_NEUTRO = [
  'dia normal, tá tudo certo', 'sem novidade por aqui', 'tô de boa',
  'nem bom nem ruim, tá valendo',
];
const FALAS_TAREFA = [
  'fiz minha parte hoje', 'a casa tá limpa graças a mim', 'olha o trabalho aí',
  'terminei o que era meu', 'ninguém reparou, mas eu limpei',
  'tarefa feita, consciência limpa',
];
const FALAS_FOME = [
  'tô com fome...', 'ninguém registrou nada hoje', 'cadê o almoço?',
  'meu estômago tá reclamando', 'hoje eu ainda não comi nada',
];

/**
 * Falas da praça. Elas saem do que realmente aconteceu na casa, então a praça
 * vira um jeito leve de saber como os outros estão. A lista é grande de
 * propósito: quanto mais falas cabem no sorteio, menos a praça se repete.
 */
export function conversas(houseId, bichos) {
  const falas = [];
  const hoje = new Date().toISOString().slice(0, 10);
  const hora = new Date().getHours();
  const papoDaHora = hora < 12 ? PAPO_MANHA : hora < 18 ? PAPO_TARDE : PAPO_NOITE;

  const pessoas = bichos.filter((b) => b.kind !== 'pet');
  const pets = bichos.filter((b) => b.kind === 'pet');
  /** Outra pessoa da casa, para a conversa ter destinatário. Pet tem fala própria. */
  const outroQue = (b) => {
    const outros = pessoas.filter((x) => x.id !== b.id);
    return outros.length ? pick(outros) : null;
  };

  for (const b of bichos) {
    if (b.kind === 'pet') {
      const lista = FALAS_PET[b.species] ?? FALAS_PET.outro;
      falas.push({ de: b.id, texto: pick(lista) });
      const dono = pick(pessoas);
      if (dono) falas.push({ de: b.id, texto: pick([`*segue ${dono.name} pela praça*`, `*pede colo para ${dono.name}*`, `*encara ${dono.name}*`]) });
      continue;
    }

    // sempre tem papo solto no sorteio, para nunca ficar só a mesma frase
    falas.push({ de: b.id, texto: pick(PAPO_SOLTO) });
    falas.push({ de: b.id, texto: pick(papoDaHora) });

    if (b.humor === '😔' || b.humor === '😤') {
      falas.push({ de: b.id, texto: pick(FALAS_TRISTE), sentimento: 'triste' });
    } else if (b.animo >= 2) {
      falas.push({ de: b.id, texto: pick(FALAS_FELIZ), sentimento: 'feliz' });
    } else if (b.animo === 0) {
      falas.push({ de: b.id, texto: pick(FALAS_NEUTRO) });
    }

    if (b.streak >= 3) {
      falas.push({ de: b.id, texto: pick([
        `${b.streak} dias comendo direito!`,
        `tô numa sequência de ${b.streak} dias`,
        'não quero quebrar minha sequência',
      ]), sentimento: 'orgulho' });
    }
    if (b.tarefasHoje > 0) {
      falas.push({ de: b.id, texto: pick(FALAS_TAREFA), sentimento: 'orgulho' });
    }
    if (b.comeuHoje === 0) {
      falas.push({ de: b.id, texto: pick(FALAS_FOME), sentimento: 'fome' });
    }
    if (b.agua > 0 && b.agua < 800) {
      falas.push({ de: b.id, texto: pick([
        'preciso beber mais água', 'faz horas que não bebo água', 'boca seca, socorro',
      ]), sentimento: 'sede' });
    }
    if (b.coins >= 10) {
      falas.push({ de: b.id, texto: pick([
        'tô rico, dá para comprar algo pra praça', `guardei ${Math.floor(b.coins)} moedas`,
      ]), sentimento: 'orgulho' });
    }
    if (b.temporary) {
      falas.push({ de: b.id, texto: pick([
        'tô só de visita, mas já me acostumei', 'obrigado por me receberem',
        'vou embora e vou sentir falta daqui',
      ]) });
    }

    // conversa entre eles: citar o nome do outro faz a praça parecer viva
    const outro = outroQue(b);
    if (outro) {
      falas.push({ de: b.id, texto: pick([
        `e aí, ${outro.name}?`,
        `${outro.name}, senta aqui`,
        `${outro.name} tá quieto hoje`,
        `bom te ver, ${outro.name}`,
        `${outro.name}, sua vez de lavar a louça`,
      ]) });
    }
    if (pets.length) {
      const pet = pick(pets);
      falas.push({ de: b.id, texto: pick([
        `${pet.name} tá aprontando de novo`, `${pet.name} já comeu hoje?`,
        `${pet.name} é o melhor morador daqui`, `alguém viu ${pet.name}?`,
      ]) });
    }
  }

  // ---------------------------------------------------------- fofoca da casa
  const fofoca = (texto) => falas.push({ de: null, texto, sentimento: 'fofoca' });

  const ultima = get(
    `SELECT r.name, r.emoji, m.name AS quem FROM cook_log c
     JOIN recipe r ON r.id = c.recipe_id LEFT JOIN member m ON m.id = c.member_id
     WHERE c.house_id = ? ORDER BY c.id DESC LIMIT 1`,
    houseId
  );
  if (ultima) {
    fofoca(`${ultima.quem ?? 'Alguém'} fez ${ultima.name} ${ultima.emoji}`);
    fofoca(`o cheiro de ${ultima.name} ainda tá no ar`);
  }

  const sobra = get(
    "SELECT name FROM pantry_item WHERE house_id = ? AND kind = 'sobra' AND expires_at < ? AND qty > 0 LIMIT 1",
    houseId, hoje
  );
  // sem artigo antes do nome do alimento: "o Carne Moída" fica esquisito
  if (sobra) fofoca(pick([`${sobra.name} passou do prazo...`, `alguém joga fora ${sobra.name}?`]));

  // o que está para vencer vira assunto antes de estragar
  const vencendo = get(
    `SELECT name FROM pantry_item
     WHERE house_id = ? AND qty > 0 AND frozen = 0 AND expires_at IS NOT NULL
       AND expires_at >= ? AND expires_at <= date(?, '+2 day')
     ORDER BY expires_at LIMIT 1`,
    houseId, hoje, hoje
  );
  if (vencendo) {
    fofoca(pick([
      `${vencendo.name} tá quase vencendo`,
      `alguém come ${vencendo.name} antes que estrague?`,
    ]));
  }

  const lista = get(
    "SELECT id FROM shopping_list WHERE house_id = ? AND status = 'aberta' LIMIT 1", houseId
  );
  if (lista) fofoca(pick(['tem lista de compras aberta, alguém vai ao mercado?', 'a lista tá lá esperando']));

  // último enfeite comprado: eles reparam nas novidades da praça
  const ultimoKey = get(
    'SELECT item_key FROM plaza_item WHERE house_id = ? ORDER BY id DESC LIMIT 1', houseId
  )?.item_key;
  const enfeite = CATALOGO.find((c) => c.key === ultimoKey);
  if (enfeite) {
    const nome = enfeite.label.toLowerCase();
    fofoca(pick([`gostei do ${nome} novo ${enfeite.emoji}`, `quem escolheu esse ${nome}?`]));
  }

  // quem mandou nas tarefas do mês
  const lider = get(
    `SELECT m.name, ROUND(SUM(cd.stars), 1) AS estrelas FROM chore_done cd
     JOIN member m ON m.id = cd.member_id
     WHERE m.house_id = ? AND cd.month = ?
     GROUP BY m.id ORDER BY estrelas DESC LIMIT 1`,
    houseId, hoje.slice(0, 7)
  );
  if (lider?.estrelas > 0) {
    fofoca(pick([
      `${lider.name} tá liderando o mês com ${lider.estrelas} estrelas`,
      `ninguém alcança ${lider.name} esse mês`,
    ]));
  }

  // quem saiu de viagem deixa saudade
  const viajando = get(
    'SELECT name FROM member WHERE house_id = ? AND travel_until >= ? LIMIT 1', houseId, hoje
  );
  if (viajando) fofoca(`${viajando.name} tá viajando, a casa fica mais quieta`);

  if (falas.length < 6) {
    for (const b of pessoas) falas.push({ de: b.id, texto: pick(PAPO_SOLTO) });
  }

  return falas;
}

/**
 * Se alguém está pra baixo, o app sugere um prato que essa pessoa adora.
 * É o empurrãozinho para a casa cuidar de quem não está bem.
 */
export function sugestaoDeCarinho(houseId, bichos) {
  // só sugere para quem realmente disse que não está bem: adivinhar humor pelo
  // que a pessoa deixou de registrar seria chute, e chute ruim
  const triste = bichos
    .filter((b) => b.kind !== 'pet' && b.humor && b.animo <= -1)
    .sort((a, b) => a.animo - b.animo)[0];
  if (!triste) return null;

  // a receita mais bem avaliada por quem está pra baixo
  // hr_id vai junto para a praça conseguir cozinhar o prato ali mesmo
  const favorita = get(
    `SELECT r.name, r.emoji, r.minutes, r.servings, hr.id AS hr_id, rr.stars FROM recipe_rating rr
     JOIN house_recipe hr ON hr.id = rr.house_recipe_id
     JOIN recipe r ON r.id = hr.recipe_id
     WHERE hr.house_id = ? AND rr.member_id = ?
     ORDER BY rr.stars DESC, r.name LIMIT 1`,
    houseId, triste.id
  ) ?? get(
    `SELECT r.name, r.emoji, r.minutes, r.servings, hr.id AS hr_id, hr.times_cooked AS stars
     FROM house_recipe hr JOIN recipe r ON r.id = hr.recipe_id WHERE hr.house_id = ?
     ORDER BY hr.times_cooked DESC LIMIT 1`,
    houseId
  );

  if (!favorita) return null;
  return {
    member: { id: triste.id, name: triste.name, emoji: triste.emoji },
    humor: triste.humor,
    humorLabel: triste.humorLabel,
    recipe: {
      hr_id: favorita.hr_id,
      name: favorita.name,
      emoji: favorita.emoji,
      minutes: favorita.minutes,
      servings: favorita.servings,
    },
    texto: `${triste.name} não está no melhor dia. Que tal fazer ${favorita.name} ${favorita.emoji}?`,
  };
}

/** Como a praça está montada agora. */
export function praca(houseId) {
  const bichos = bichinhos(houseId);
  const linhas = all('SELECT * FROM plaza_item WHERE house_id = ? ORDER BY id', houseId);

  // fundo comprado também mora em plaza_item, mas não é enfeite para desenhar
  const comprados = linhas
    .filter((i) => !i.item_key.startsWith('bg:'))
    .map((i) => ({ ...i, ...(CATALOGO.find((c) => c.key === i.item_key) ?? { emoji: '❓', label: i.item_key }) }));

  const treats = all(
    `SELECT t.*, m.name AS quem FROM plaza_treat t LEFT JOIN member m ON m.id = t.member_id
     WHERE t.house_id = ? ORDER BY t.id DESC LIMIT 8`,
    houseId
  );

  const ativo = get('SELECT plaza_bg FROM house WHERE id = ?', houseId)?.plaza_bg ?? FUNDO_PADRAO;

  return {
    bichinhos: bichos,
    itens: comprados,
    catalogo: CATALOGO.map((c) => ({ ...c, comprado: comprados.some((i) => i.item_key === c.key) })),
    fundo: acharFundo(ativo),
    fundos: FUNDOS.map((f) => ({
      ...f,
      comprado: temFundo(houseId, f.key),
      ativo: f.key === ativo,
    })),
    cofre: saldoDaCasa(houseId),
    conversas: conversas(houseId, bichos),
    sugestao: sugestaoDeCarinho(houseId, bichos),
    treats,
    climaDaCasa: climaDaCasa(bichos),
  };
}

/** Uma frase que resume como a casa está hoje. */
function climaDaCasa(bichos) {
  const gente = bichos.filter((b) => b.kind !== 'pet');
  if (!gente.length) return { emoji: '🏡', texto: 'A praça está vazia por enquanto.' };

  const media = gente.reduce((s, b) => s + b.animo, 0) / gente.length;
  if (media >= 1.5) return { emoji: '🌞', texto: 'A casa está num dia ótimo.' };
  if (media >= 0.5) return { emoji: '🙂', texto: 'Clima tranquilo por aqui.' };
  if (media > -0.5) return { emoji: '😐', texto: 'Dia comum na casa.' };
  if (media > -1.5) return { emoji: '🌧️', texto: 'A casa está meio pra baixo hoje.' };
  return { emoji: '⛈️', texto: 'Dia pesado para a galera. Vale um carinho.' };
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Tira o preço do cofre coletivo, começando por quem tem mais, para ninguém ficar negativo. */
function debitarCofre(houseId, preco, ref) {
  let restante = preco;
  const ricos = all(
    "SELECT id, coins FROM member WHERE house_id = ? AND kind = 'pessoa' AND coins > 0 ORDER BY coins DESC",
    houseId
  );
  for (const r of ricos) {
    if (restante <= 0) break;
    const tira = Math.min(r.coins, restante);
    run('UPDATE member SET coins = ROUND(coins - ?, 2) WHERE id = ?', tira, r.id);
    run(
      'INSERT INTO coin_log (house_id, member_id, amount, reason, ref) VALUES (?,?,?,?,?)',
      houseId, r.id, -tira, 'praca', ref
    );
    restante -= tira;
  }
}

/**
 * Comprar da loja. Enfeite ganha um lugar no mapa; fundo já entra em uso na
 * hora, porque não faz sentido comprar uma cor e ela não aparecer.
 */
export function comprar(houseId, memberId, itemKey) {
  const fundo = FUNDOS.find((f) => f.key === itemKey);
  if (fundo) return comprarFundo(houseId, memberId, fundo);

  const item = CATALOGO.find((c) => c.key === itemKey);
  if (!item) return { erro: 'Enfeite não existe' };
  if (get('SELECT id FROM plaza_item WHERE house_id = ? AND item_key = ?', houseId, itemKey)) {
    return { erro: 'A praça já tem esse' };
  }

  const cofre = saldoDaCasa(houseId);
  if (cofre < item.preco) return { erro: `Faltam ${Math.ceil(item.preco - cofre)} moedas` };

  debitarCofre(houseId, item.preco, itemKey);
  run(
    'INSERT INTO plaza_item (house_id, item_key, bought_by, x, y) VALUES (?,?,?,?,?)',
    houseId, itemKey, memberId ?? null,
    10 + Math.random() * 75, 25 + Math.random() * 55
  );

  const quem = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  logEvent(houseId, item.emoji, `${quem?.name ?? 'A casa'} comprou ${item.label} para a praça`, 'praca', memberId);
  return { ok: true, item };
}

function comprarFundo(houseId, memberId, fundo) {
  if (temFundo(houseId, fundo.key)) return { erro: 'A casa já tem esse fundo' };

  const cofre = saldoDaCasa(houseId);
  if (cofre < fundo.preco) return { erro: `Faltam ${Math.ceil(fundo.preco - cofre)} moedas` };

  debitarCofre(houseId, fundo.preco, chaveDeFundo(fundo.key));
  run(
    'INSERT INTO plaza_item (house_id, item_key, bought_by, x, y) VALUES (?,?,?,0,0)',
    houseId, chaveDeFundo(fundo.key), memberId ?? null
  );
  run('UPDATE house SET plaza_bg = ? WHERE id = ?', fundo.key, houseId);

  const quem = memberId ? get('SELECT name FROM member WHERE id = ?', memberId) : null;
  logEvent(houseId, fundo.emoji, `${quem?.name ?? 'A casa'} pintou a praça de ${fundo.label}`, 'praca', memberId);
  return { ok: true, item: fundo, fundo: fundo.key };
}

const temFundo = (houseId, key) => {
  const f = FUNDOS.find((x) => x.key === key);
  if (!f) return false;
  if (f.preco === 0) return true;                                   // o padrão vem junto com a casa
  return !!get('SELECT id FROM plaza_item WHERE house_id = ? AND item_key = ?', houseId, chaveDeFundo(key));
};

/** Trocar para um fundo que a casa já comprou. */
export function usarFundo(houseId, key) {
  const fundo = FUNDOS.find((f) => f.key === key);
  if (!fundo) return { erro: 'Esse fundo não existe' };
  if (!temFundo(houseId, key)) return { erro: 'A casa ainda não comprou esse fundo' };

  run('UPDATE house SET plaza_bg = ? WHERE id = ?', key, houseId);
  return { ok: true, fundo: key };
}

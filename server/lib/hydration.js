import { all, get, run } from '../db.js';
import { norm } from './food.js';

/**
 * Gestor de líquidos.
 *
 * A ideia central: nem todo líquido hidrata igual, e alguns ainda AUMENTAM a
 * necessidade de água. Café e álcool puxam água do corpo; bebida muito doce
 * também cobra o seu preço. Então cada bebida tem dois números:
 *
 *   hydration: quanto do volume conta como água de verdade (0 a 1)
 *   debt:      quanto de água EXTRA aquele volume adiciona à meta
 *
 * Os valores são aproximações de uso doméstico, não fisiologia de precisão.
 */
export const BEBIDAS = {
  'agua':          { e: '💧', label: 'Água',            hydration: 1.00, debt: 0,    kind: 'agua' },
  'agua com gas':  { e: '🫧', label: 'Água com gás',    hydration: 1.00, debt: 0,    kind: 'agua' },
  'cha':           { e: '🍵', label: 'Chá',             hydration: 0.98, debt: 0,    kind: 'cha' },
  'agua de coco':  { e: '🥥', label: 'Água de coco',    hydration: 0.95, debt: 0,    kind: 'agua' },
  'suco natural':  { e: '🧃', label: 'Suco natural',    hydration: 0.85, debt: 0.05, kind: 'suco' },
  'suco de caixinha': { e: '🧃', label: 'Suco de caixinha', hydration: 0.80, debt: 0.15, kind: 'doce' },
  'leite':         { e: '🥛', label: 'Leite',           hydration: 0.87, debt: 0,    kind: 'leite' },
  'iogurte':       { e: '🥛', label: 'Iogurte líquido', hydration: 0.80, debt: 0,    kind: 'leite' },
  'cafe':          { e: '☕', label: 'Café',            hydration: 0.85, debt: 0.25, kind: 'cafe' },
  'cafe com leite':{ e: '☕', label: 'Café com leite',  hydration: 0.88, debt: 0.15, kind: 'cafe' },
  'refrigerante':  { e: '🥤', label: 'Refrigerante',    hydration: 0.85, debt: 0.20, kind: 'doce' },
  'energetico':    { e: '⚡', label: 'Energético',      hydration: 0.75, debt: 0.40, kind: 'cafe' },
  'cerveja':       { e: '🍺', label: 'Cerveja',         hydration: 0.75, debt: 0.50, kind: 'alcool' },
  'vinho':         { e: '🍷', label: 'Vinho',           hydration: 0.50, debt: 1.20, kind: 'alcool' },
  'destilado':     { e: '🥃', label: 'Destilado',       hydration: 0.20, debt: 3.00, kind: 'alcool' },
  'isotonico':     { e: '🥤', label: 'Isotônico',       hydration: 0.95, debt: 0,    kind: 'agua' },
};

/** Copos comuns, para não precisar digitar mililitro. */
export const COPOS = [
  { ml: 200, label: 'Copo', emoji: '🥛' },
  { ml: 300, label: 'Caneca', emoji: '☕' },
  { ml: 500, label: 'Garrafinha', emoji: '🍶' },
  { ml: 1000, label: 'Garrafão', emoji: '🪣' },
];

const CAFE_LIMITE_SEMANA = 1000;   // ml de café puro por semana
const ALCOOL_LIMITE_SEMANA = 1000; // ml de bebida alcoólica por semana

/** Acha a bebida na tabela, com a mesma busca tolerante do resto do app. */
export function acharBebida(nome) {
  const n = norm(nome);
  if (!n) return null;
  if (BEBIDAS[n]) return { key: n, ...BEBIDAS[n] };

  let melhor = null;
  let tamanho = 0;
  for (const chave of Object.keys(BEBIDAS)) {
    if ((n.includes(chave) || chave.includes(n)) && chave.length > tamanho) {
      melhor = { key: chave, ...BEBIDAS[chave] };
      tamanho = chave.length;
    }
  }
  return melhor;
}

/** Um item da geladeira é bebida? Serve para o "beber da geladeira". */
export function ehBebida(nome, unit) {
  if (unit !== 'ml' && unit !== 'l') return false;
  return !!acharBebida(nome);
}

/**
 * Meta de água do dia: 35 ml por quilo, com piso e teto sensatos.
 * Some a isso a dívida deixada pelas bebidas de hoje e de ontem, porque álcool
 * cobra no dia seguinte.
 */
export function metaDeAgua(member, dividaHoje = 0) {
  const peso = Number(member.weight_kg) || 70;
  const base = Math.round(Math.min(4000, Math.max(1500, peso * 35)) / 50) * 50;
  return { base, extra: Math.round(dividaHoje), total: base + Math.round(dividaHoje) };
}

/** Registra um gole. volume em ml. */
export function beber(houseId, memberId, { name, ml, source = 'manual', itemId = null, day = null }) {
  const bebida = acharBebida(name) ?? { key: norm(name), hydration: 0.9, debt: 0, kind: 'outro', e: '🥤' };
  const volume = Math.max(1, Math.round(Number(ml) || 0));
  const agua = Math.round(volume * bebida.hydration);
  const divida = Math.round(volume * bebida.debt);

  const info = run(
    `INSERT INTO drink_log (house_id, member_id, name, drink_key, kind, ml, water_ml, debt_ml, source, item_id, day)
     VALUES (?,?,?,?,?,?,?,?,?,?, COALESCE(?, date('now')))`,
    houseId, memberId, String(name).trim(), bebida.key, bebida.kind,
    volume, agua, divida, source, itemId, day
  );
  return { id: Number(info.lastInsertRowid), ml: volume, water_ml: agua, debt_ml: divida, kind: bebida.kind };
}

/**
 * Dívida de água que ainda pesa hoje: o que foi bebido hoje conta inteiro, e o
 * de ontem conta pela metade, porque a ressaca não acaba à meia-noite.
 */
export function dividaAtual(memberId, day) {
  const hoje = get(
    'SELECT COALESCE(SUM(debt_ml),0) AS d FROM drink_log WHERE member_id = ? AND day = ?',
    memberId, day
  ).d;
  const ontem = get(
    "SELECT COALESCE(SUM(debt_ml),0) AS d FROM drink_log WHERE member_id = ? AND day = date(?, '-1 day')",
    memberId, day
  ).d;
  return Math.round(hoje + ontem * 0.5);
}

/** Tudo que a tela de líquidos precisa de um integrante. */
export function resumoDoDia(houseId, memberId, day = new Date().toISOString().slice(0, 10)) {
  const member = get('SELECT * FROM member WHERE id = ?', memberId);
  if (!member) return null;

  const goles = all(
    'SELECT * FROM drink_log WHERE member_id = ? AND day = ? ORDER BY id DESC',
    memberId, day
  );

  const agua = goles.reduce((s, g) => s + g.water_ml, 0);
  const volume = goles.reduce((s, g) => s + g.ml, 0);
  const divida = dividaAtual(memberId, day);
  const meta = metaDeAgua(member, divida);

  // por tipo de bebida, para a pessoa ver de onde veio a hidratação
  const porTipo = {};
  for (const g of goles) {
    porTipo[g.kind] ??= { kind: g.kind, ml: 0, water: 0, count: 0 };
    porTipo[g.kind].ml += g.ml;
    porTipo[g.kind].water += g.water_ml;
    porTipo[g.kind].count += 1;
  }

  return {
    day,
    goles,
    agua,
    volume,
    meta,
    pct: Math.min(999, Math.round((agua / Math.max(1, meta.total)) * 100)),
    falta: Math.max(0, meta.total - agua),
    porTipo: Object.values(porTipo).sort((a, b) => b.ml - a.ml),
    avisos: avisosDaSemana(memberId, day),
  };
}

/**
 * Avisos simpáticos, nunca bloqueios. Se a semana passou de 1 L de café ou de
 * álcool, o app comenta e sugere uma pausa. A decisão continua sendo da pessoa.
 */
export function avisosDaSemana(memberId, day = new Date().toISOString().slice(0, 10)) {
  const semana = all(
    `SELECT kind, SUM(ml) AS ml, COUNT(*) AS n FROM drink_log
     WHERE member_id = ? AND day > date(?, '-7 day') AND day <= ?
     GROUP BY kind`,
    memberId, day, day
  );
  const porTipo = Object.fromEntries(semana.map((s) => [s.kind, s.ml]));
  const out = [];

  const cafe = porTipo.cafe ?? 0;
  if (cafe > CAFE_LIMITE_SEMANA) {
    out.push({
      kind: 'cafe',
      emoji: '☕',
      titulo: 'Bastante café nesta semana',
      texto: `Foram ${(cafe / 1000).toFixed(1).replace('.', ',')} L em sete dias. Uns dias de pausa costumam melhorar o sono, mas quem manda é você.`,
      ml: cafe,
    });
  }

  const alcool = porTipo.alcool ?? 0;
  if (alcool > ALCOOL_LIMITE_SEMANA) {
    out.push({
      kind: 'alcool',
      emoji: '🍺',
      titulo: 'Semana bem regada',
      texto: `Foram ${(alcool / 1000).toFixed(1).replace('.', ',')} L de bebida alcoólica em sete dias. Que tal alguns dias de folga? Fica a sugestão, sem cobrança.`,
      ml: alcool,
    });
  }

  const doce = porTipo.doce ?? 0;
  if (doce > 2000) {
    out.push({
      kind: 'doce',
      emoji: '🥤',
      titulo: 'Muito líquido açucarado',
      texto: `${(doce / 1000).toFixed(1).replace('.', ',')} L de bebida doce na semana. Elas hidratam menos e ainda pedem água extra.`,
      ml: doce,
    });
  }

  return out;
}

/** Histórico curto, para o gráfico da tela. */
export function ultimosDias(memberId, dias = 7) {
  const member = get('SELECT * FROM member WHERE id = ?', memberId);
  const rows = all(
    `SELECT day, SUM(water_ml) AS agua, SUM(ml) AS volume, SUM(debt_ml) AS divida
     FROM drink_log WHERE member_id = ? AND day > date('now', ?) GROUP BY day ORDER BY day`,
    memberId, `-${dias} day`
  );
  const base = metaDeAgua(member ?? {}).base;
  return rows.map((r) => ({ ...r, meta: base, pct: Math.round((r.agua / Math.max(1, base)) * 100) }));
}

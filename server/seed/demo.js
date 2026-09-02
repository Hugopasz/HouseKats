import { all, get, run, logEvent, db } from '../db.js';
import { estimateExpiry, guessCategory, guessUnit, macrosFor } from '../lib/food.js';
import { starsFor, roundBlock } from '../lib/chores.js';
import { recomputeStreak } from '../lib/fridge.js';
import { targetsFor } from '../lib/nutrition.js';
import { validadeDe } from '../lib/pantryExtras.js';
import { acharBebida } from '../lib/hydration.js';
import { CHORE_PRESETS } from './chores.js';
import { TITLES, COLORS, REWARDS } from '../lib/fun.js';

const AVATARS = Object.keys(COLORS);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const monthOf = (day) => day.slice(0, 7);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (a, b) => a + Math.random() * (b - a);
const money = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- perfis
export const PROFILES = {
  solo: {
    key: 'solo',
    label: '1 pessoa',
    tag: 'Dados médios',
    emoji: '🧍',
    desc: 'Uma casa de uma pessoa só, com algumas semanas de uso. Armário médio, receitas favoritas definidas e tarefas rodando.',
    houseName: 'Apê do Gato',
    houseEmoji: '🏠',
    people: [{ name: 'Alex', emoji: '🐈‍⬛', age: 31, weight: 72, height: 175, diet: 'media', goal: 'manter' }],
    historyDays: 30,
    purchasesPerWeek: 6,
    recipes: 12,
    cookEvents: 14,
    choreDays: 20,
    rooms: ['cozinha', 'banheiro', 'quarto', 'sala'],
    openList: false,
    comfortBoost: 1,
  },
  dupla: {
    key: 'dupla',
    label: '2 pessoas',
    tag: 'Dados de iniciante',
    emoji: '👥',
    desc: 'Casal que acabou de começar. Poucos dias de histórico, livro de receitas pequeno e o questionário recém respondido.',
    houseName: 'Casa dos Kats',
    houseEmoji: '🐈',
    people: [
      { name: 'Bia', emoji: '🦊', age: 28, weight: 61, height: 165, diet: 'media', goal: 'reduzir' },
      { name: 'Caio', emoji: '🐻', age: 30, weight: 84, height: 182, diet: 'grande', goal: 'massa' },
    ],
    historyDays: 8,
    purchasesPerWeek: 8,
    recipes: 6,
    cookEvents: 4,
    choreDays: 5,
    rooms: ['cozinha', 'banheiro', 'quarto'],
    openList: true,
    comfortBoost: 0,
  },
  familia: {
    key: 'familia',
    label: '4 pessoas',
    tag: 'Dados avançados',
    emoji: '👨‍👩‍👧‍👦',
    desc: 'Casa cheia e rodando há meses: muito histórico de compras, Pratos Conforto definidos, disputa apertada de estrelinhas e uma lista de compras aberta.',
    houseName: 'República Miau',
    houseEmoji: '🏡',
    people: [
      { name: 'Dani', emoji: '🦄', age: 34, weight: 68, height: 170, diet: 'media', goal: 'manter' },
      { name: 'Edu', emoji: '🐯', age: 36, weight: 90, height: 185, diet: 'grande', goal: 'reduzir' },
      { name: 'Fê', emoji: '🐸', age: 19, weight: 55, height: 160, diet: 'pouca', goal: 'massa' },
      { name: 'Gui', emoji: '🦁', age: 23, weight: 77, height: 178, diet: 'grande', goal: 'massa' },
    ],
    historyDays: 120,
    purchasesPerWeek: 14,
    recipes: 24,
    cookEvents: 70,
    choreDays: 90,
    rooms: ['cozinha', 'banheiro', 'quarto', 'sala', 'area', 'varanda'],
    openList: true,
    comfortBoost: 3,
  },
};

// itens típicos de compra, com faixa de preço realista
const BASKET = [
  ['Arroz', 5, 'kg', 24, 32], ['Feijão', 1, 'kg', 8, 12], ['Peito de Frango', 1, 'kg', 22, 34],
  ['Carne Moída', 500, 'g', 18, 28], ['Ovo', 12, 'un', 10, 18], ['Leite', 1, 'l', 4.5, 7],
  ['Macarrão', 500, 'g', 4, 8], ['Tomate', 4, 'un', 6, 12], ['Cebola', 3, 'un', 4, 8],
  ['Alho', 5, 'un', 3, 6], ['Batata', 1, 'kg', 5, 10], ['Cenoura', 3, 'un', 4, 7],
  ['Banana', 6, 'un', 5, 9], ['Maçã', 4, 'un', 8, 14], ['Alface', 1, 'un', 3, 6],
  ['Queijo', 300, 'g', 15, 26], ['Presunto', 200, 'g', 9, 15], ['Pão', 6, 'un', 6, 12],
  ['Azeite', 500, 'ml', 26, 42], ['Óleo', 900, 'ml', 6, 10], ['Café', 500, 'g', 16, 28],
  ['Açúcar', 1, 'kg', 4, 7], ['Iogurte', 500, 'ml', 6, 11], ['Linguiça', 500, 'g', 14, 22],
  ['Biscoito', 200, 'g', 4, 8], ['Chocolate', 100, 'g', 6, 12], ['Refrigerante', 2, 'l', 7, 12],
  ['Papel Higiênico', 12, 'un', 18, 30, true], ['Detergente', 500, 'ml', 2.5, 5, true],
];

// não-alimentos entram na conta do mercado, mas ninguém come
const NON_FOOD = new Set(BASKET.filter((b) => b[5]).map((b) => String(b[0]).toLowerCase()));

// ---------------------------------------------------------------- construção
function insertMove({ houseId, itemId, name, category, qty, unit, reason, price, loggedBy, day }) {
  const delta = reason === 'consumido' || reason === 'estragou' ? -Math.abs(qty) : qty;
  const info = run(
    `INSERT INTO stock_move (house_id, item_id, item_name, category, delta, unit, reason, price, logged_by, created_at, day)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    houseId, itemId, name, category, delta, unit, reason,
    price ?? null, loggedBy ?? null, `${day} 12:00:00`, day
  );
  return Number(info.lastInsertRowid);
}

function upsertItem(houseId, name, category, qty, unit, day) {
  const found = get(
    'SELECT * FROM pantry_item WHERE house_id = ? AND lower(name) = lower(?) AND unit = ?',
    houseId, name, unit
  );
  if (found) {
    // repor renova a validade, senão o item fica eternamente vencido no demo
    run(
      'UPDATE pantry_item SET qty = ?, expires_at = ? WHERE id = ?',
      Math.round((found.qty + qty) * 1000) / 1000, estimateExpiry(name, category, day), found.id
    );
    return found.id;
  }
  const info = run(
    'INSERT INTO pantry_item (house_id, name, category, qty, unit, expires_at, created_at) VALUES (?,?,?,?,?,?,?)',
    houseId, name, category, qty, unit, estimateExpiry(name, category, day), `${day} 12:00:00`
  );
  return Number(info.lastInsertRowid);
}

/**
 * Cria uma casa de exemplo completa: geladeira com histórico, livro de receitas,
 * cômodos, questionário respondido e tarefas feitas ao longo das últimas semanas.
 * Serve para ver o app cheio sem precisar cadastrar nada à mão.
 */
export function buildDemo(profileKey) {
  const cfg = PROFILES[profileKey];
  if (!cfg) throw new Error('Perfil de demonstração inválido');

  db.exec('BEGIN');
  try {
    // ---------------------------------------------------- casa e integrantes
    const houseInfo = run(
      "INSERT INTO house (name, emoji, onboarding_step, chores_unlocked, created_at) VALUES (?,?,'done',1,?)",
      `${cfg.houseName} (demo)`, cfg.houseEmoji, `${daysAgo(cfg.historyDays)} 10:00:00`
    );
    const houseId = Number(houseInfo.lastInsertRowid);

    const titles = [...TITLES].sort(() => Math.random() - 0.5);
    const colors = [...AVATARS].sort(() => Math.random() - 0.5);
    const members = cfg.people.map((p, i) => {
      const info = run(
        `INSERT INTO member (house_id, name, emoji, title, age, weight_kg, height_cm, diet, goal, color, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        houseId, p.name, p.emoji, titles[i], p.age, p.weight, p.height, p.diet, p.goal,
        colors[i % colors.length], `${daysAgo(cfg.historyDays)} 10:0${i}:00`
      );
      const id = Number(info.lastInsertRowid);
      run('INSERT OR IGNORE INTO streak (member_id) VALUES (?)', id);
      // metas já resolvidas: o consumo do demo é dimensionado por elas
      const targets = targetsFor({ weight_kg: p.weight, height_cm: p.height, age: p.age, diet: p.diet, goal: p.goal });
      return { ...p, id, targets };
    });
    logEvent(houseId, cfg.houseEmoji, `A casa ${cfg.houseName} foi criada`, 'casa');

    // ---------------------------------------------------- compras e consumo
    const weeks = Math.ceil(cfg.historyDays / 7);
    for (let w = weeks; w >= 0; w--) {
      const shopDay = daysAgo(Math.max(0, w * 7 - Math.floor(Math.random() * 2)));
      const buyer = rand(members);
      const basket = [...BASKET].sort(() => Math.random() - 0.5).slice(0, cfg.purchasesPerWeek);

      // a feira acompanha o tamanho da casa, senão o consumo esvazia a geladeira
      const packs = Math.max(1, Math.round(members.length * 0.9));
      for (const [name, qty, unit, lo, hi] of basket) {
        const category = guessCategory(name);
        const amount = qty * packs;
        const itemId = upsertItem(houseId, name, category, amount, unit, shopDay);
        insertMove({
          houseId, itemId, name, category, qty: amount, unit,
          reason: 'comprado', price: money(between(lo, hi) * packs), loggedBy: buyer.id, day: shopDay,
        });
      }

      // consumo espalhado pelos dias da semana, dimensionado pela meta de cada um
      for (let d = 0; d < 7 && w * 7 - d >= 0; d++) {
        const day = daysAgo(Math.max(0, w * 7 - d));
        let stock = all('SELECT * FROM pantry_item WHERE house_id = ? AND qty > 0', houseId);

        // geladeira raspando no meio da semana? alguém dá um pulo no mercado
        if (stock.length < 6) {
          const who = rand(members);
          for (const [name, qty, unit, lo, hi] of [...BASKET].sort(() => Math.random() - 0.5).slice(0, 8)) {
            const category = guessCategory(name);
            const amount = qty * packs;
            const itemId = upsertItem(houseId, name, category, amount, unit, day);
            insertMove({
              houseId, itemId, name, category, qty: amount, unit,
              reason: 'comprado', price: money(between(lo, hi) * packs), loggedBy: who.id, day,
            });
          }
          stock = all('SELECT * FROM pantry_item WHERE house_id = ? AND qty > 0', houseId);
        }
        if (!stock.length) continue;

        for (const person of members) {
          // ~15% dos dias a pessoa come fora ou pula registro: a streak precisa poder quebrar
          if (Math.random() < 0.15) continue;

          const goal = person.targets.kcal * between(0.72, 1.08);
          let acc = 0;
          let guard = 0;
          while (acc < goal && guard++ < 8) {
            const pool = all('SELECT * FROM pantry_item WHERE house_id = ? AND qty > 0', houseId)
              .filter((p) => !NON_FOOD.has(p.name.toLowerCase()));
            const item = rand(pool);
            if (!item) break;

            // porção calculada para render de 250 a 600 kcal
            const perUnit = macrosFor(item.name, item.category, 1, item.unit).kcal;
            if (perUnit <= 0) { guard++; continue; }
            const wanted = between(250, 600) / perUnit;
            const take = Math.round(Math.min(item.qty, Math.max(item.unit === 'un' ? 1 : 0.02, wanted)) * 1000) / 1000;
            if (take <= 0) break;

            const eater = person;
            const logger = Math.random() < 0.75 ? eater : rand(members);

            run('UPDATE pantry_item SET qty = ? WHERE id = ?', Math.round((item.qty - take) * 1000) / 1000, item.id);
            const moveId = insertMove({
              houseId, itemId: item.id, name: item.name, category: item.category,
              qty: take, unit: item.unit, reason: 'consumido', loggedBy: logger.id, day,
            });
            run(
              `INSERT INTO consumption_claim (house_id, move_id, member_id, logged_by, share, status, created_at, day)
               VALUES (?,?,?,?,1,?,?,?)`,
              houseId, moveId, eater.id, logger.id,
              // no dia de hoje deixa alguma pendência para o aviso aparecer
              logger.id === eater.id ? 'confirmed' : (day === daysAgo(0) ? 'pending' : 'confirmed'),
              `${day} 13:00:00`, day
            );
            acc += macrosFor(item.name, item.category, take, item.unit).kcal;
          }
        }

        // de vez em quando algo estraga
        if (Math.random() < 0.12) {
          const spoiled = rand(stock.filter((s) => s.category === 'hortifruti') ?? stock) ?? rand(stock);
          if (spoiled && spoiled.qty > 0) {
            run('UPDATE pantry_item SET qty = 0 WHERE id = ?', spoiled.id);
            insertMove({
              houseId, itemId: spoiled.id, name: spoiled.name, category: spoiled.category,
              qty: spoiled.qty, unit: spoiled.unit, reason: 'estragou', loggedBy: rand(members).id, day,
            });
          }
        }
      }
    }

    // feira recém-feita: a casa de exemplo abre com a geladeira cheia
    const restockDay = daysAgo(1);
    const restocker = rand(members);
    const packs = Math.max(1, Math.round(members.length * 1.2));
    for (const [name, qty, unit, lo, hi] of BASKET.slice(0, 20)) {
      const category = guessCategory(name);
      const amount = qty * packs;
      const itemId = upsertItem(houseId, name, category, amount, unit, restockDay);
      insertMove({
        houseId, itemId, name, category, qty: amount, unit,
        reason: 'comprado', price: money(between(lo, hi) * packs), loggedBy: restocker.id, day: restockDay,
      });
    }
    logEvent(houseId, '🛒', `${restocker.name} fez a feira da semana`, 'geladeira', restocker.id);

    // ---------------------------------------------------- livro de receitas
    const catalog = all("SELECT * FROM recipe WHERE source = 'catalog'").sort(() => Math.random() - 0.5);
    const picked = catalog.slice(0, cfg.recipes);
    const houseRecipes = [];
    for (const rec of picked) {
      const by = rand(members);
      const info = run(
        'INSERT OR IGNORE INTO house_recipe (house_id, recipe_id, added_by, added_at) VALUES (?,?,?,?)',
        houseId, rec.id, by.id, `${daysAgo(Math.floor(Math.random() * cfg.historyDays))} 20:00:00`
      );
      const hrId = Number(info.lastInsertRowid) || get(
        'SELECT id FROM house_recipe WHERE house_id = ? AND recipe_id = ?', houseId, rec.id
      )?.id;
      if (!hrId) continue;
      houseRecipes.push({ hrId, rec });

      // swipes coerentes com o livro
      for (const m of members) {
        run(
          'INSERT OR IGNORE INTO recipe_swipe (house_id, member_id, recipe_id, liked, day) VALUES (?,?,?,1,?)',
          houseId, m.id, rec.id, daysAgo(Math.floor(Math.random() * cfg.historyDays))
        );
      }
      // notas de parte da casa
      for (const m of members) {
        if (Math.random() < 0.65) {
          run(
            'INSERT OR REPLACE INTO recipe_rating (house_recipe_id, member_id, stars) VALUES (?,?,?)',
            hrId, m.id, Math.round(between(3, 5))
          );
        }
      }
    }

    // preparos: alguns pratos viram Prato Conforto
    const favorites = houseRecipes.slice(0, 5 + cfg.comfortBoost);
    let cooksLeft = cfg.cookEvents;
    for (const [i, f] of favorites.entries()) {
      const target = i < cfg.comfortBoost ? 10 + Math.floor(Math.random() * 6) : Math.floor(between(1, 6));
      for (let c = 0; c < target && cooksLeft > 0; c++) {
        const day = daysAgo(Math.floor(Math.random() * cfg.historyDays));
        run(
          'INSERT INTO cook_log (house_id, recipe_id, member_id, servings, day, created_at) VALUES (?,?,?,?,?,?)',
          houseId, f.rec.id, rand(members).id, f.rec.servings, day, `${day} 19:30:00`
        );
        run('UPDATE house_recipe SET times_cooked = times_cooked + 1 WHERE id = ?', f.hrId);
        cooksLeft--;
      }
    }
    // selo Prato Conforto: top 5 com 10+ preparos
    run('UPDATE house_recipe SET comfort = 0 WHERE house_id = ?', houseId);
    for (const t of all(
      'SELECT id FROM house_recipe WHERE house_id = ? AND times_cooked >= 10 ORDER BY times_cooked DESC LIMIT 5',
      houseId
    )) {
      run('UPDATE house_recipe SET comfort = 1 WHERE id = ?', t.id);
    }

    // ---------------------------------------------------- cômodos e questionário
    const roomIds = [];
    for (const key of cfg.rooms) {
      const preset = CHORE_PRESETS[key] ?? CHORE_PRESETS.geral;
      const nice = { cozinha: ['Cozinha', '🍳'], banheiro: ['Banheiro', '🚿'], quarto: ['Quarto', '🛏️'],
        sala: ['Sala', '🛋️'], area: ['Área de serviço', '🧺'], varanda: ['Varanda', '🌿'] }[key] ?? ['Casa toda', '🏠'];
      const size = rand(['pequeno', 'medio', 'grande']);
      const info = run(
        'INSERT INTO room (house_id, name, emoji, size, created_at) VALUES (?,?,?,?,?)',
        houseId, nice[0], nice[1], size, `${daysAgo(cfg.historyDays)} 11:00:00`
      );
      const roomId = Number(info.lastInsertRowid);
      roomIds.push(roomId);

      for (const c of preset) {
        const ci = run(
          'INSERT INTO chore (house_id, name, emoji, room_id, created_at) VALUES (?,?,?,?,?)',
          houseId, c.name, c.emoji, roomId, `${daysAgo(cfg.historyDays)} 11:00:00`
        );
        const choreId = Number(ci.lastInsertRowid);
        // cada integrante dá o seu palpite, com um viés próprio
        for (const m of members) {
          const bias = between(-5, 8);
          run(
            'INSERT INTO chore_vote (chore_id, member_id, minutes, difficulty) VALUES (?,?,?,?)',
            choreId, m.id, roundBlock(Math.max(5, c.minutes + bias)),
            Math.max(1, Math.min(5, Math.round(c.difficulty + between(-1, 1))))
          );
        }
      }
      for (const m of members) {
        run(
          'INSERT INTO room_vote (room_id, member_id, difficulty) VALUES (?,?,?)',
          roomId, m.id, Math.max(1, Math.min(5, { pequeno: 2, medio: 3, grande: 4 }[size] + Math.round(between(-1, 1))))
        );
      }
    }
    for (const m of members) {
      run(
        "INSERT OR REPLACE INTO survey_status (member_id, completed_at) VALUES (?, ?)",
        m.id, `${daysAgo(cfg.historyDays - 1)} 12:00:00`
      );
    }

    // ---------------------------------------------------- tarefas feitas
    const chores = all(
      `SELECT c.id, c.name, (SELECT AVG(minutes) FROM chore_vote WHERE chore_id = c.id) AS mins,
              (SELECT AVG(difficulty) FROM chore_vote WHERE chore_id = c.id) AS diff
       FROM chore c WHERE c.house_id = ? AND c.is_special = 0`,
      houseId
    );
    for (let d = cfg.choreDays; d >= 0; d--) {
      if (Math.random() < 0.28) continue;                    // nem todo dia rende
      const day = daysAgo(d);
      const howMany = Math.max(1, Math.round(members.length * between(0.5, 1.6)));
      for (let k = 0; k < howMany; k++) {
        const c = rand(chores);
        const m = rand(members);
        const minutes = roundBlock(c.mins ?? 15);
        run(
          `INSERT INTO chore_done (house_id, chore_id, chore_name, member_id, minutes, stars, day, month, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          houseId, c.id, c.name, m.id, minutes, starsFor(minutes, c.diff ?? 3),
          day, monthOf(day), `${day} 18:00:00`
        );
      }
    }

    // ---------------------------------------------------- tarefas especiais
    for (const m of members.slice(0, 2)) {
      const name = rand(['Consertar o liquidificador', 'Trocar a lâmpada da cozinha', 'Marcar o dentista']);
      const ci = run(
        'INSERT INTO chore (house_id, name, emoji, is_special, owner_id) VALUES (?,?,?,1,?)',
        houseId, name, '🔧', m.id
      );
      run(
        'INSERT INTO chore_vote (chore_id, member_id, minutes, difficulty) VALUES (?,?,?,?)',
        Number(ci.lastInsertRowid), m.id, 30, 4
      );
    }

    // ---------------------------------------------------- sobras e congelador
    const SOBRAS = [
      ['Lasanha de domingo', 3, 4], ['Arroz de ontem', 2, 2], ['Feijão da semana', 4, 5],
      ['Frango assado', 2, 3], ['Sopa de legumes', 3, 4],
    ];
    // uma delas vencida de propósito, para o alerta aparecer no demo
    for (const [i, [nome, porcoes, prazo]] of SOBRAS.slice(0, Math.min(4, members.length + 2)).entries()) {
      const vencida = i === 0;
      const guardadoEm = daysAgo(vencida ? prazo + 2 : Math.floor(Math.random() * 2));
      const validade = new Date(`${guardadoEm}T00:00:00`);
      validade.setDate(validade.getDate() + prazo);
      run(
        `INSERT INTO pantry_item (house_id, name, category, qty, unit, expires_at, expiry_source, kind, created_at)
         VALUES (?,?,?,?,'un',?, 'manual', 'sobra', ?)`,
        houseId, nome, guessCategory(nome), porcoes,
        validade.toISOString().slice(0, 10), `${guardadoEm} 20:00:00`
      );
    }

    // alguns itens no congelador, com o prazo esticado
    for (const item of all(
      "SELECT id, name, category FROM pantry_item WHERE house_id = ? AND kind = 'item' AND category = 'proteina' AND qty > 0 ORDER BY RANDOM() LIMIT 3",
      houseId
    )) {
      run(
        "UPDATE pantry_item SET frozen = 1, frozen_at = ?, expires_at = ? WHERE id = ?",
        daysAgo(2), validadeDe(item.name, item.category, { frozen: true }), item.id
      );
    }

    // ---------------------------------------------------- tarefa que ninguém quer
    // cada integrante veta uma tarefa diferente, na ordem de chegada
    const vetaveis = all(
      'SELECT id FROM chore WHERE house_id = ? AND is_special = 0 ORDER BY RANDOM()', houseId
    );
    for (const [i, m] of members.entries()) {
      const alvo = vetaveis[i];
      if (!alvo) break;
      run('INSERT OR IGNORE INTO chore_veto (house_id, member_id, chore_id) VALUES (?,?,?)', houseId, m.id, alvo.id);
    }

    // ---------------------------------------------------- recompensa do mês
    const mesAtual = new Date().toISOString().slice(0, 7);
    const escolhida = rand(REWARDS);
    run(
      'INSERT OR REPLACE INTO reward (house_id, month, text, chosen_by) VALUES (?,?,?,?)',
      houseId, mesAtual, escolhida, rand(members).id
    );

    // votação já encerrada, com a vencedora batendo com a recompensa acima
    const pollInfo = run(
      "INSERT INTO reward_poll (house_id, month, created_by, status, winner, closed_at) VALUES (?,?,?, 'fechada', ?, datetime('now'))",
      houseId, mesAtual, members[0].id, escolhida
    );
    const pollId = Number(pollInfo.lastInsertRowid);
    const opcoes = [escolhida, ...REWARDS.filter((r) => r !== escolhida).sort(() => Math.random() - 0.5).slice(0, 2)];
    const optIds = opcoes.map((t) => Number(run('INSERT INTO reward_option (poll_id, text) VALUES (?,?)', pollId, t).lastInsertRowid));
    for (const [i, m] of members.entries()) {
      // a maioria vota na vencedora
      run('INSERT OR IGNORE INTO reward_vote (poll_id, member_id, option_id) VALUES (?,?,?)',
        pollId, m.id, i === members.length - 1 && members.length > 2 ? optIds[1] : optIds[0]);
    }

    // ---------------------------------------------------- moedas da praça
    // o que a casa já fez vira moeda, senão a praça abre sem nada para comprar
    for (const m of members) {
      const tarefas = get(
        'SELECT COALESCE(SUM(stars),0) AS s FROM chore_done WHERE member_id = ?', m.id
      ).s;
      const receitas = get(
        'SELECT COUNT(*) AS n FROM cook_log WHERE member_id = ?', m.id
      ).n;
      const ganho = Math.round((tarefas * 0.5 + receitas * 1) * 10) / 10;
      if (ganho > 0) {
        run('UPDATE member SET coins = ? WHERE id = ?', ganho, m.id);
        run(
          'INSERT INTO coin_log (house_id, member_id, amount, reason, ref) VALUES (?,?,?,?,?)',
          houseId, m.id, ganho, 'historico', 'tarefas e receitas anteriores'
        );
      }
    }

    // a praça já começa com alguns enfeites, para não abrir vazia
    const enfeites = ['banco', 'arvore', 'flores'].slice(0, members.length + 1);
    for (const key of enfeites) {
      run(
        'INSERT OR IGNORE INTO plaza_item (house_id, item_key, bought_by, x, y) VALUES (?,?,?,?,?)',
        houseId, key, rand(members).id, 12 + Math.random() * 70, 28 + Math.random() * 50
      );
    }

    // ---------------------------------------------------- líquidos dos últimos dias
    const GOLES = [
      ['Água', 500], ['Água', 300], ['Café', 200], ['Suco natural', 300],
      ['Leite', 200], ['Chá', 250], ['Refrigerante', 350],
    ];
    for (const m of members) {
      for (let d = 0; d < Math.min(7, cfg.historyDays); d++) {
        const day = daysAgo(d);
        const quantos = 2 + Math.floor(Math.random() * 4);
        for (let k = 0; k < quantos; k++) {
          const [nome, ml] = rand(GOLES);
          const bebida = acharBebida(nome);
          const volume = Math.round(ml * between(0.7, 1.3));
          run(
            `INSERT INTO drink_log (house_id, member_id, name, drink_key, kind, ml, water_ml, debt_ml, source, day, created_at)
             VALUES (?,?,?,?,?,?,?,?, 'manual', ?, ?)`,
            houseId, m.id, nome, bebida?.key ?? '', bebida?.kind ?? 'outro',
            volume, Math.round(volume * (bebida?.hydration ?? 0.9)),
            Math.round(volume * (bebida?.debt ?? 0)), day, `${day} 10:00:00`
          );
        }
      }
    }

    // ---------------------------------------------------- humor dos últimos dias
    const CARINHAS = [['😄', 'ótimo'], ['🙂', 'bem'], ['😐', 'neutro'], ['😴', 'cansado'], ['😤', 'estressado']];
    for (const m of members) {
      for (let d = 0; d < Math.min(10, cfg.historyDays); d++) {
        if (Math.random() < 0.35) continue;
        const [emoji, label] = rand(CARINHAS);
        const day = daysAgo(d);
        run(
          `INSERT OR IGNORE INTO mood (house_id, member_id, emoji, label, day, created_at)
           VALUES (?,?,?,?,?,?)`,
          houseId, m.id, emoji, label, day, `${day} 09:00:00`
        );
      }
    }

    // ---------------------------------------------------- lista de compras aberta
    if (cfg.openList) {
      const li = run(
        'INSERT INTO shopping_list (house_id, title, created_by, days, meals_per_day) VALUES (?,?,?,?,?)',
        houseId, 'Compras da semana', rand(members).id, 7, members.length * 3
      );
      const listId = Number(li.lastInsertRowid);
      for (const [name, qty, unit] of [...BASKET].sort(() => Math.random() - 0.5).slice(0, 10)) {
        run(
          'INSERT INTO shopping_item (list_id, name, qty, unit, category, checked) VALUES (?,?,?,?,?,?)',
          listId, name, qty, unit, guessCategory(name), Math.random() < 0.3 ? 1 : 0
        );
      }
      logEvent(houseId, '📝', 'Lista de compras da semana gerada', 'compras');
    }

    logEvent(houseId, '🧪', `Casa de demonstração criada (${cfg.label} · ${cfg.tag})`, 'casa');

    db.exec('COMMIT');

    for (const m of members) recomputeStreak(m.id);
    return { houseId, profile: cfg.key, members: members.length };
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** Remove todas as casas criadas pelo modo demo. */
export function clearDemos() {
  const rows = all("SELECT id, name FROM house WHERE name LIKE '%(demo)'");
  for (const h of rows) run('DELETE FROM house WHERE id = ?', h.id);
  return rows.length;
}

export { guessUnit };

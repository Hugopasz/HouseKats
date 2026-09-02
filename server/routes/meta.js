import { Router } from 'express';
import { TITLES, COLORS, AVATARS, PET_AVATARS, SPECIES, REWARDS, ROOM_EMOJIS, randomTitle, pick } from '../lib/fun.js';
import { CATEGORIES, UNITS, guessCategory, guessEmoji, suggest } from '../lib/food.js';
import { DIETS, GOALS } from '../lib/nutrition.js';

const r = Router();

/** Identidade do servidor: o front confere se está falando com o app certo. */
r.get('/ping', (_req, res) => res.json({ app: 'house-kats', ok: true }));

/** Tudo que o front precisa para montar seletores, buscado uma vez no boot. */
r.get('/meta', (_req, res) => {
  res.json({
    colors: COLORS,
    titles: TITLES,
    avatars: AVATARS,
    petAvatars: PET_AVATARS,
    species: SPECIES,
    rewards: REWARDS,
    roomEmojis: ROOM_EMOJIS,
    categories: CATEGORIES,
    units: UNITS,
    diets: DIETS,
    goals: GOALS,
  });
});

r.get('/meta/title', (req, res) => {
  const used = String(req.query.used || '').split('|').filter(Boolean);
  res.json({ title: randomTitle(used) });
});

r.get('/meta/reward', (_req, res) => res.json({ text: pick(REWARDS) }));

/**
 * Básicos da despensa, para o passo inicial da geladeira ser um toque por item
 * em vez de preencher o modal inteiro 15 vezes.
 */
const STARTER = [
  ['Arroz', 5, 'kg'], ['Feijão', 1, 'kg'], ['Macarrão', 500, 'g'], ['Farinha de Trigo', 1, 'kg'],
  ['Ovo', 12, 'un'], ['Leite', 1, 'l'], ['Queijo', 300, 'g'], ['Peito de Frango', 1, 'kg'],
  ['Carne Moída', 500, 'g'], ['Linguiça', 500, 'g'], ['Óleo', 900, 'ml'], ['Azeite', 500, 'ml'],
  ['Manteiga', 200, 'g'], ['Açúcar', 1, 'kg'], ['Sal', 1, 'kg'], ['Café', 500, 'g'],
  ['Molho de Tomate', 340, 'g'], ['Cebola', 3, 'un'], ['Alho', 5, 'un'], ['Tomate', 4, 'un'],
  ['Batata', 1, 'kg'], ['Cenoura', 3, 'un'], ['Alface', 1, 'un'], ['Banana', 6, 'un'],
  ['Maçã', 4, 'un'], ['Pão', 6, 'un'], ['Iogurte', 500, 'ml'], ['Aveia', 500, 'g'],
];

r.get('/meta/starter', (_req, res) => {
  res.json(STARTER.map(([name, qty, unit]) => ({
    name,
    qty,
    unit,
    category: guessCategory(name),
    emoji: guessEmoji(name),
  })));
});

/** Autocomplete do modal de adicionar item. */
r.get('/meta/foods', (req, res) => {
  res.json(suggest(String(req.query.q || ''), Number(req.query.limit) || 8));
});

export default r;

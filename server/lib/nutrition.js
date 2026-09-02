// Metas nutricionais ESTIMADAS por integrante.
// Sao estimativas de referencia para gamificacao domestica, calculadas a partir
// de formulas publicas (Mifflin-St Jeor, sem distincao de sexo). Nao substituem
// orientacao de nutricionista ou medico.

export const DIETS = {
  pouca: { label: 'Pouca', emoji: '🥄', factor: 1.2, mealsPerDay: 2, desc: 'Como pouco, prefiro refeições leves' },
  media: { label: 'Média', emoji: '🍽️', factor: 1.45, mealsPerDay: 3, desc: 'Três refeições, porções normais' },
  grande: { label: 'Grande', emoji: '🍛', factor: 1.7, mealsPerDay: 4, desc: 'Como bastante, repito o prato' },
};

export const GOALS = {
  reduzir: {
    label: 'Reduzir Peso', emoji: '📉', kcalAdj: -0.15, proteinPerKg: 2.0,
    desc: 'Porções um pouco menores, com mais proteína para não perder músculo.',
  },
  massa: {
    label: 'Aumentar Massa', emoji: '💪', kcalAdj: 0.12, proteinPerKg: 1.8,
    desc: 'Come um pouco mais que o normal, com bastante proteína.',
  },
  manter: {
    label: 'Manter', emoji: '⚖️', kcalAdj: 0, proteinPerKg: 1.4,
    desc: 'Fica no que você já gasta no dia. Sem apertar nada.',
  },
};

/**
 * Metas diarias estimadas para um integrante.
 * Se a pessoa definiu a propria meta de calorias, as outras se reequilibram em
 * volta dela: proteina segue o peso, gordura fica em 27% das calorias e o
 * carboidrato leva o que sobrar.
 */
export function targetsFor(member) {
  const weight = Number(member.weight_kg) || 70;
  const height = Number(member.height_cm) || 170;
  const age = Number(member.age) || 30;

  // Mifflin-St Jeor com constante media entre as versoes (+5 / -161)
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78;

  const diet = DIETS[member.diet] ?? DIETS.media;
  const goal = GOALS[member.goal] ?? GOALS.manter;

  const sugerido = Math.round(bmr * diet.factor * (1 + goal.kcalAdj));
  const custom = Number(member.custom_kcal) || null;
  const kcal = custom && custom > 0 ? custom : sugerido;

  const protein = Math.round(weight * goal.proteinPerKg);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return {
    kcal,
    protein,
    carbs,
    fat,
    mealsPerDay: diet.mealsPerDay,
    suggestedKcal: sugerido,
    customKcal: custom,
  };
}

/** Quantas refeicoes por dia a casa inteira consome. */
export function houseMealsPerDay(members) {
  return members.reduce((sum, m) => sum + (DIETS[m.diet] ?? DIETS.media).mealsPerDay, 0);
}

/**
 * Streak de alimentacao: conta o dia como "bem alimentado" quando a pessoa
 * registrou pelo menos 2 consumos e bateu 60% da meta de kcal. A ideia e
 * premiar comer direito, nao bater a dieta na regua.
 */
export function dayIsHealthy(consumedKcal, targetKcal, consumptionCount) {
  if (consumptionCount < 2) return false;
  const ratio = consumedKcal / Math.max(1, targetKcal);
  return ratio >= 0.6 && ratio <= 1.4;
}

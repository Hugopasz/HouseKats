import type { Unit } from './api';

/**
 * Quanto um toque no + ou no − mexe, por unidade. São os saltos que fazem
 * sentido na cozinha: ovo vai de 1 em 1, arroz de 250 g em 250 g.
 */
export const STEP: Record<Unit, number> = {
  un: 1,
  g: 50,
  kg: 0.25,
  ml: 100,
  l: 0.25,
  pacote: 1,
};

/** 1,5 em vez de 1.5; 12 em vez de 12,00. */
export const fmtQty = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');

/** Soma um passo à quantidade sem deixar sobrar lixo de ponto flutuante. */
export const bumpQty = (qty: number, unit: Unit, dir: 1 | -1) => {
  const step = STEP[unit] ?? 1;
  return Math.max(0, Math.round((qty + dir * step) * 1000) / 1000);
};

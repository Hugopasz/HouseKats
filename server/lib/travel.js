import { all } from '../db.js';

/**
 * Períodos de Modo Viagem. Ficam isolados aqui porque tanto a geladeira
 * (streaks) quanto as tarefinhas (atraso) precisam saber se um dia está
 * congelado, e nenhum dos dois pode depender do outro.
 */
export function travelsOn(houseId, day, memberId = null) {
  return all(
    `SELECT * FROM travel
     WHERE house_id = ? AND start_day <= ? AND end_day >= ?
       AND (member_id IS NULL ${memberId ? 'OR member_id = ?' : ''})`,
    ...(memberId ? [houseId, day, day, memberId] : [houseId, day, day])
  );
}

/** Esse dia conta ou está congelado por uma viagem? */
export const isFrozen = (houseId, day, memberId = null) => travelsOn(houseId, day, memberId).length > 0;

/** Quantos dos últimos N dias estavam congelados, usado para descontar atraso. */
export function frozenDaysBetween(houseId, fromDay, toDay, memberId = null) {
  const rows = all(
    `SELECT start_day, end_day FROM travel
     WHERE house_id = ? AND end_day >= ? AND start_day <= ?
       AND (member_id IS NULL ${memberId ? 'OR member_id = ?' : ''})`,
    ...(memberId ? [houseId, fromDay, toDay, memberId] : [houseId, fromDay, toDay])
  );
  const days = new Set();
  for (const t of rows) {
    const start = t.start_day > fromDay ? t.start_day : fromDay;
    const end = t.end_day < toDay ? t.end_day : toDay;
    const cursor = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (cursor <= last) {
      days.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return days.size;
}

/** Viagem em curso da casa ou de um integrante. */
export function activeTravel(houseId, memberId = null) {
  const day = new Date().toISOString().slice(0, 10);
  return travelsOn(houseId, day, memberId)[0] ?? null;
}

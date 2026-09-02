import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * O banco mora numa pasta simples dentro do perfil do usuário, e isso é
 * deliberado. Em modo WAL o SQLite usa três arquivos (.db, .db-shm, .db-wal)
 * que só fazem sentido juntos, então ele precisa de um lugar onde ninguém
 * mexa por baixo:
 *
 * - **Nada de pasta sincronizada.** OneDrive, Dropbox e iCloud copiam os três
 *   arquivos em momentos diferentes e podem repor um fora de sincronia com os
 *   outros; aí o SQLite descarta o WAL e some tudo que ainda não tinha ido
 *   para o arquivo principal. Este projeto fica na Área de Trabalho, que o
 *   OneDrive sincroniza, e guardar o banco em `data/` aqui dentro já custou
 *   uma casa inteira.
 * - **Nada de AppData.** Aplicativos empacotados (MSIX/Store) redirecionam
 *   escritas em AppData para o contêiner deles, então o mesmo caminho passa a
 *   ter duas versões do arquivo e cada processo enxerga uma. Isso também já
 *   custou dados aqui.
 *
 * ~/HouseKats/data não cai em nenhum dos dois casos. HOUSEKATS_DATA
 * sobrescreve o caminho, para quem quiser escolher outro lugar.
 */
function pastaDoBanco() {
  if (process.env.HOUSEKATS_DATA) return process.env.HOUSEKATS_DATA;
  return join(homedir(), 'HouseKats', 'data');
}

export const DATA_DIR = pastaDoBanco();
mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = join(DATA_DIR, 'housekats.db');
export const db = new DatabaseSync(DB_PATH);

/**
 * Journal de rollback em vez de WAL, de propósito.
 *
 * O WAL é mais rápido, mas espalha o banco em três arquivos (.db, .db-shm,
 * .db-wal) que só valem juntos: dado já confirmado pode viver só no .db-wal até
 * o checkpoint. Se alguém copiar, sincronizar, restaurar ou virtualizar esses
 * arquivos em momentos diferentes, o SQLite descarta o WAL e some tudo que
 * ainda não tinha ido para o arquivo principal. Isso já custou dados aqui três
 * vezes, e o app não precisa da concorrência que o WAL compra: é uma casa, com
 * meia dúzia de escritas por minuto.
 *
 * Com DELETE, depois de cada commit o banco inteiro está num arquivo só, e
 * copiar esse arquivo é um backup de verdade.
 */
db.exec('PRAGMA journal_mode = DELETE');
db.exec('PRAGMA synchronous = FULL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
-- ============================================================ CASA
CREATE TABLE IF NOT EXISTS house (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL,
  emoji             TEXT    NOT NULL DEFAULT '🏠',
  chores_unlocked   INTEGER NOT NULL DEFAULT 0,
  travel_until      TEXT,
  travel_started_at TEXT,
  onboarding_step   TEXT    NOT NULL DEFAULT 'done',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id     INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  emoji        TEXT    NOT NULL DEFAULT '🐱',
  title        TEXT    NOT NULL DEFAULT '',
  age          INTEGER,
  weight_kg    REAL,
  height_cm    REAL,
  diet         TEXT    NOT NULL DEFAULT 'media',   -- pouca | media | grande
  goal         TEXT    NOT NULL DEFAULT 'manter',  -- reduzir | massa | manter
  color        TEXT    NOT NULL DEFAULT 'roxo',    -- cor da UI, individual
  travel_until TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================ GELADEIRA
CREATE TABLE IF NOT EXISTS pantry_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id      INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  category      TEXT    NOT NULL,
  qty           REAL    NOT NULL DEFAULT 0,
  unit          TEXT    NOT NULL DEFAULT 'un',
  expires_at    TEXT,
  expiry_source TEXT    NOT NULL DEFAULT 'auto',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pantry_house ON pantry_item(house_id);

CREATE TABLE IF NOT EXISTS stock_move (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  item_id    INTEGER REFERENCES pantry_item(id) ON DELETE SET NULL,
  item_name  TEXT    NOT NULL,
  category   TEXT    NOT NULL DEFAULT 'outro',
  delta      REAL    NOT NULL,
  unit       TEXT    NOT NULL DEFAULT 'un',
  reason     TEXT    NOT NULL,
  price      REAL,
  logged_by  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  day        TEXT    NOT NULL DEFAULT (date('now'))
);
CREATE INDEX IF NOT EXISTS idx_move_house_day ON stock_move(house_id, day);

CREATE TABLE IF NOT EXISTS consumption_claim (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id    INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  move_id     INTEGER NOT NULL REFERENCES stock_move(id) ON DELETE CASCADE,
  member_id   INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  logged_by   INTEGER REFERENCES member(id) ON DELETE SET NULL,
  share       REAL    NOT NULL DEFAULT 1,
  status      TEXT    NOT NULL DEFAULT 'confirmed',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  day         TEXT    NOT NULL DEFAULT (date('now'))
);
CREATE INDEX IF NOT EXISTS idx_claim_member ON consumption_claim(member_id, status);

-- ============================================================ RECEITAS
CREATE TABLE IF NOT EXISTS recipe (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    UNIQUE NOT NULL,
  name        TEXT    NOT NULL,
  emoji       TEXT    NOT NULL DEFAULT '🍽️',
  description TEXT    NOT NULL DEFAULT '',
  minutes     INTEGER NOT NULL DEFAULT 30,
  servings    INTEGER NOT NULL DEFAULT 2,
  kcal        REAL,
  protein     REAL,
  carbs       REAL,
  fat         REAL,
  tags        TEXT    NOT NULL DEFAULT '[]',
  steps       TEXT    NOT NULL DEFAULT '[]',
  source      TEXT    NOT NULL DEFAULT 'catalog',
  house_id    INTEGER REFERENCES house(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_ingredient (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  name      TEXT    NOT NULL,
  qty       REAL    NOT NULL DEFAULT 1,
  unit      TEXT    NOT NULL DEFAULT 'un',
  category  TEXT    NOT NULL DEFAULT 'outro',
  optional  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ing_recipe ON recipe_ingredient(recipe_id);

CREATE TABLE IF NOT EXISTS house_recipe (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id     INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  recipe_id    INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  added_by     INTEGER REFERENCES member(id) ON DELETE SET NULL,
  times_cooked INTEGER NOT NULL DEFAULT 0,
  comfort      INTEGER NOT NULL DEFAULT 0,
  added_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(house_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_rating (
  house_recipe_id INTEGER NOT NULL REFERENCES house_recipe(id) ON DELETE CASCADE,
  member_id       INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  stars           INTEGER NOT NULL,
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (house_recipe_id, member_id)
);

CREATE TABLE IF NOT EXISTS recipe_swipe (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id  INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  liked     INTEGER NOT NULL,
  day       TEXT    NOT NULL DEFAULT (date('now')),
  UNIQUE(member_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS cook_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  recipe_id  INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  member_id  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  servings   INTEGER NOT NULL DEFAULT 1,
  day        TEXT    NOT NULL DEFAULT (date('now')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================ COMPRAS
CREATE TABLE IF NOT EXISTS shopping_list (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id      INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  title         TEXT    NOT NULL DEFAULT 'Lista de compras',
  status        TEXT    NOT NULL DEFAULT 'aberta',
  created_by    INTEGER REFERENCES member(id) ON DELETE SET NULL,
  days          INTEGER NOT NULL DEFAULT 7,
  meals_per_day REAL    NOT NULL DEFAULT 2,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  closed_at     TEXT
);

CREATE TABLE IF NOT EXISTS shopping_item (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id  INTEGER NOT NULL REFERENCES shopping_list(id) ON DELETE CASCADE,
  name     TEXT    NOT NULL,
  qty      REAL    NOT NULL DEFAULT 1,
  unit     TEXT    NOT NULL DEFAULT 'un',
  category TEXT    NOT NULL DEFAULT 'outro',
  checked  INTEGER NOT NULL DEFAULT 0,
  price    REAL,
  note     TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_shop_item ON shopping_item(list_id);

-- ============================================================ TAREFINHAS
CREATE TABLE IF NOT EXISTS room (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  emoji      TEXT    NOT NULL DEFAULT '🚪',
  size       TEXT    NOT NULL DEFAULT 'medio',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_vote (
  room_id    INTEGER NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  difficulty INTEGER NOT NULL,
  PRIMARY KEY (room_id, member_id)
);

CREATE TABLE IF NOT EXISTS chore (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  emoji      TEXT    NOT NULL DEFAULT '🧹',
  room_id    INTEGER REFERENCES room(id) ON DELETE CASCADE,
  is_special INTEGER NOT NULL DEFAULT 0,
  owner_id   INTEGER REFERENCES member(id) ON DELETE CASCADE,
  done       INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chore_vote (
  chore_id   INTEGER NOT NULL REFERENCES chore(id) ON DELETE CASCADE,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  minutes    INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  PRIMARY KEY (chore_id, member_id)
);

CREATE TABLE IF NOT EXISTS survey_status (
  member_id    INTEGER PRIMARY KEY REFERENCES member(id) ON DELETE CASCADE,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS chore_done (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  chore_id   INTEGER REFERENCES chore(id) ON DELETE SET NULL,
  chore_name TEXT    NOT NULL,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  minutes    INTEGER NOT NULL DEFAULT 0,
  stars      REAL    NOT NULL DEFAULT 0,
  day        TEXT    NOT NULL DEFAULT (date('now')),
  month      TEXT    NOT NULL DEFAULT (strftime('%Y-%m','now')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_done_month ON chore_done(house_id, month);

CREATE TABLE IF NOT EXISTS reward (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  month      TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  chosen_by  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(house_id, month)
);

-- ============================================================ ALIMENTACAO
CREATE TABLE IF NOT EXISTS streak (
  member_id INTEGER PRIMARY KEY REFERENCES member(id) ON DELETE CASCADE,
  current   INTEGER NOT NULL DEFAULT 0,
  best      INTEGER NOT NULL DEFAULT 0,
  last_day  TEXT
);

-- ============================================================ LOG DA CASA
CREATE TABLE IF NOT EXISTS log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  icon       TEXT    NOT NULL DEFAULT '📌',
  message    TEXT    NOT NULL,
  kind       TEXT    NOT NULL DEFAULT 'geral',
  member_id  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_log_house ON log(house_id, id DESC);
`);

// ---------------------------------------------------------------- helpers
export const all = (sql, ...p) => db.prepare(sql).all(...p);
export const get = (sql, ...p) => db.prepare(sql).get(...p);
export const run = (sql, ...p) => db.prepare(sql).run(...p);

/** Migração leve: adiciona uma coluna se ela ainda não existir. */
function ensureColumn(table, column, ddl) {
  const cols = all(`PRAGMA table_info(${table})`).map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

// "para quem é" o item, definido no modal de adicionar
ensureColumn('pantry_item', 'for_member_id', 'for_member_id INTEGER REFERENCES member(id) ON DELETE SET NULL');

// congelado estica a validade; sobra é comida pronta com prazo curto
ensureColumn('pantry_item', 'frozen', 'frozen INTEGER NOT NULL DEFAULT 0');
ensureColumn('pantry_item', 'frozen_at', 'frozen_at TEXT');
ensureColumn('pantry_item', 'kind', "kind TEXT NOT NULL DEFAULT 'item'");
ensureColumn('pantry_item', 'note', "note TEXT NOT NULL DEFAULT ''");

// meta calórica ajustada à mão pelo integrante
ensureColumn('member', 'custom_kcal', 'custom_kcal INTEGER');

// pets comem mas não fazem tarefa; visitantes têm prazo de validade
// kind: 'pessoa' ou 'pet'
ensureColumn('member', 'kind', "kind TEXT NOT NULL DEFAULT 'pessoa'");
ensureColumn('member', 'species', "species TEXT NOT NULL DEFAULT ''");
ensureColumn('member', 'temporary', 'temporary INTEGER NOT NULL DEFAULT 0');
ensureColumn('member', 'visit_until', 'visit_until TEXT');
ensureColumn('member', 'coins', 'coins REAL NOT NULL DEFAULT 0');

// fundo escolhido para a praça. Os comprados ficam em plaza_item com prefixo 'bg:'
ensureColumn('house', 'plaza_bg', "plaza_bg TEXT NOT NULL DEFAULT 'gramado'");

// tarefa especial que volta sozinha: repeat_days = 0 é a que some ao ser feita,
// e next_at guarda quando ela reaparece
ensureColumn('chore', 'repeat_days', 'repeat_days INTEGER NOT NULL DEFAULT 0');
ensureColumn('chore', 'next_at', 'next_at TEXT');

// consumo que veio de uma receita aponta para o preparo, para o aviso de
// conferência mostrar o prato em vez de listar ingrediente por ingrediente
ensureColumn('consumption_claim', 'cook_id', 'cook_id INTEGER REFERENCES cook_log(id) ON DELETE SET NULL');

db.exec(`
-- Cada gole registrado. water_ml é quanto daquilo hidrata de verdade;
-- debt_ml é a água EXTRA que a bebida adiciona à meta (café, álcool, doce).
CREATE TABLE IF NOT EXISTS drink_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  drink_key  TEXT    NOT NULL DEFAULT '',
  kind       TEXT    NOT NULL DEFAULT 'outro',
  ml         INTEGER NOT NULL,
  water_ml   INTEGER NOT NULL,
  debt_ml    INTEGER NOT NULL DEFAULT 0,
  source     TEXT    NOT NULL DEFAULT 'manual',
  item_id    INTEGER REFERENCES pantry_item(id) ON DELETE SET NULL,
  day        TEXT    NOT NULL DEFAULT (date('now')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_drink_member_day ON drink_log(member_id, day);

-- ============================================================ A PRAÇA
-- Moedas ganhas por comer direito e fazer tarefas, gastas em enfeites.
CREATE TABLE IF NOT EXISTS coin_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER REFERENCES member(id) ON DELETE CASCADE,
  amount     REAL    NOT NULL,
  reason     TEXT    NOT NULL,
  ref        TEXT    NOT NULL DEFAULT '',
  day        TEXT    NOT NULL DEFAULT (date('now')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- O que a casa já comprou para a praça.
CREATE TABLE IF NOT EXISTS plaza_item (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  item_key   TEXT    NOT NULL,
  bought_by  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  x          REAL    NOT NULL DEFAULT 50,
  y          REAL    NOT NULL DEFAULT 50,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(house_id, item_key)
);

-- Petiscos jogados na praça e o que os bichinhos acharam.
CREATE TABLE IF NOT EXISTS plaza_treat (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER REFERENCES member(id) ON DELETE SET NULL,
  recipe_id  INTEGER REFERENCES recipe(id) ON DELETE SET NULL,
  label      TEXT    NOT NULL DEFAULT '',
  emoji      TEXT    NOT NULL DEFAULT '🍪',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Alimentos que a casa inventou: o app aprende e passa a sugerir.
CREATE TABLE IF NOT EXISTS custom_food (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  norm_name  TEXT    NOT NULL,
  category   TEXT    NOT NULL DEFAULT 'outro',
  unit       TEXT    NOT NULL DEFAULT 'un',
  emoji      TEXT    NOT NULL DEFAULT '🍽️',
  kcal       REAL,   protein REAL,  carbs REAL,  fat REAL,   -- por 100 g/ml
  shelf_days INTEGER,
  price      REAL,
  uses       INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(house_id, norm_name)
);

-- Humor do dia, um por pessoa por dia.
CREATE TABLE IF NOT EXISTS mood (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  emoji      TEXT    NOT NULL,
  label      TEXT    NOT NULL DEFAULT '',
  note       TEXT    NOT NULL DEFAULT '',
  day        TEXT    NOT NULL DEFAULT (date('now')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(member_id, day)
);

-- A tarefa que a pessoa não faz de jeito nenhum, e a que sobra só para ela.
CREATE TABLE IF NOT EXISTS chore_veto (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  chore_id   INTEGER NOT NULL REFERENCES chore(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(member_id),
  UNIQUE(house_id, chore_id)
);

-- Votação da recompensa do mês: três opções, todo mundo vota.
CREATE TABLE IF NOT EXISTS reward_poll (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  month      TEXT    NOT NULL,
  created_by INTEGER REFERENCES member(id) ON DELETE SET NULL,
  status     TEXT    NOT NULL DEFAULT 'aberta',
  winner     TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  closed_at  TEXT,
  UNIQUE(house_id, month)
);

CREATE TABLE IF NOT EXISTS reward_option (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES reward_poll(id) ON DELETE CASCADE,
  text    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS reward_vote (
  poll_id   INTEGER NOT NULL REFERENCES reward_poll(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES reward_option(id) ON DELETE CASCADE,
  PRIMARY KEY (poll_id, member_id)
);

-- Quem perdeu um desempate ganha prioridade no próximo.
CREATE TABLE IF NOT EXISTS tiebreak_credit (
  member_id INTEGER PRIMARY KEY REFERENCES member(id) ON DELETE CASCADE,
  credits   INTEGER NOT NULL DEFAULT 0
);
`);

// Modo Viagem: períodos em que streaks e tarefas ficam congelados.
// member_id nulo = a casa inteira viajou.
db.exec(`
CREATE TABLE IF NOT EXISTS travel (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  house_id   INTEGER NOT NULL REFERENCES house(id) ON DELETE CASCADE,
  member_id  INTEGER REFERENCES member(id) ON DELETE CASCADE,
  start_day  TEXT    NOT NULL,
  end_day    TEXT    NOT NULL,
  note       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_travel_house ON travel(house_id, end_day);
`);

export function logEvent(houseId, icon, message, kind = 'geral', memberId = null) {
  run(
    'INSERT INTO log (house_id, icon, message, kind, member_id) VALUES (?,?,?,?,?)',
    houseId, icon, message, kind, memberId
  );
}

/**
 * Casas abandonadas no meio do cadastro não viram lixo: no boot fica no máximo
 * a mais recente, que é a que a pessoa pode querer retomar.
 */
export function pruneDrafts() {
  const drafts = all("SELECT id FROM house WHERE onboarding_step != 'done' ORDER BY id");
  const descartar = drafts.slice(0, -1);
  for (const d of descartar) run('DELETE FROM house WHERE id = ?', d.id);
  return descartar.length;
}

export function tx(fn) {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

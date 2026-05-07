const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'db.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS gift_cards (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    code                  TEXT    NOT NULL UNIQUE,
    product_id            TEXT    NOT NULL,
    sessions_purchased    INTEGER NOT NULL,
    sessions_remaining    INTEGER NOT NULL,
    purchaser_first_name  TEXT    NOT NULL,
    purchaser_last_name   TEXT    NOT NULL,
    purchaser_email       TEXT    NOT NULL,
    purchaser_phone       TEXT    NOT NULL,
    recipient_name        TEXT,
    recipient_email       TEXT,
    gift_message          TEXT,
    stripe_payment_id     TEXT,
    purchase_date         TEXT    NOT NULL,
    expiry_date           TEXT    NOT NULL,
    booked_date           TEXT,
    booked_time           TEXT,
    status                TEXT    NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_card_code  TEXT,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT NOT NULL,
    product_id      TEXT NOT NULL,
    session_date    TEXT NOT NULL,
    session_time    TEXT NOT NULL,
    notes           TEXT,
    payment_method  TEXT NOT NULL DEFAULT 'stripe',
    created_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT,
    source      TEXT,
    created_at  TEXT NOT NULL
  );
`);

module.exports = db;

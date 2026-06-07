// JSON file-based store — no native compilation required.
// Node.js is single-threaded so read-modify-write is effectively atomic.
const fs   = require('fs');
const path = require('path');

// Allow an external persistent directory (e.g. Railway Volume at /data)
// so bookings survive redeploys. Falls back to the local data/ folder.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let data = { gift_cards: [], bookings: [], clients: [], enquiries: [], waivers: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    data = { enquiries: [], waivers: [], ...parsed };
  }
  catch { /* start fresh */ }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(table) {
  const rows = data[table];
  return rows.length === 0 ? 1 : Math.max(...rows.map(r => r.id)) + 1;
}

const store = {
  giftCards: {
    findByCode(code) {
      return data.gift_cards.find(g => g.code === code) || null;
    },
    findById(id) {
      return data.gift_cards.find(g => g.id === Number(id)) || null;
    },
    list() {
      return [...data.gift_cards].sort((a, b) => {
        const da = a.purchase_date || a.created_at || '';
        const db = b.purchase_date || b.created_at || '';
        return db.localeCompare(da);
      });
    },
    create(record) {
      const row = { id: nextId('gift_cards'), ...record };
      data.gift_cards.push(row);
      save();
      return row;
    },
    update(idOrCode, changes) {
      // Support update by numeric id or by code string
      let idx = -1;
      if (typeof idOrCode === 'number' || /^\d+$/.test(String(idOrCode))) {
        idx = data.gift_cards.findIndex(g => g.id === Number(idOrCode));
      }
      if (idx === -1) {
        idx = data.gift_cards.findIndex(g => g.code === idOrCode);
      }
      if (idx === -1) return null;
      Object.assign(data.gift_cards[idx], changes);
      save();
      return data.gift_cards[idx];
    },
  },

  bookings: {
    create(record) {
      const row = {
        id: nextId('bookings'),
        status: 'confirmed',
        admin_notes: null,
        ...record,
      };
      data.bookings.push(row);
      save();
      return row;
    },
    list() {
      return [...data.bookings].sort((a, b) => {
        const da = a.session_date || '';
        const db = b.session_date || '';
        return db.localeCompare(da);
      });
    },
    findById(id) {
      return data.bookings.find(b => b.id === Number(id)) || null;
    },
    update(id, fields) {
      const idx = data.bookings.findIndex(b => b.id === Number(id));
      if (idx === -1) return null;
      Object.assign(data.bookings[idx], fields);
      save();
      return data.bookings[idx];
    },
  },

  clients: {
    findByEmail(email) {
      return data.clients.find(c => c.email === email) || null;
    },
    list() {
      return [...data.clients].sort((a, b) => {
        const da = a.created_at || '';
        const db = b.created_at || '';
        return db.localeCompare(da);
      });
    },
    upsert(record) {
      if (this.findByEmail(record.email)) return;
      data.clients.push({ id: nextId('clients'), ...record });
      save();
    },
    update(id, fields) {
      const idx = data.clients.findIndex(c => c.id === Number(id));
      if (idx === -1) return null;
      Object.assign(data.clients[idx], fields);
      save();
      return data.clients[idx];
    },
    delete(id) {
      const idx = data.clients.findIndex(c => c.id === Number(id));
      if (idx === -1) return false;
      data.clients.splice(idx, 1);
      save();
      return true;
    },
  },

  enquiries: {
    create(fields) {
      const row = { id: nextId('enquiries'), ...fields };
      data.enquiries.push(row);
      save();
      return row;
    },
    list() {
      return [...data.enquiries].sort((a, b) => {
        const da = a.received_at || '';
        const db = b.received_at || '';
        return db.localeCompare(da);
      });
    },
    findById(id) {
      return data.enquiries.find(e => e.id === Number(id)) || null;
    },
    update(id, fields) {
      const idx = data.enquiries.findIndex(e => e.id === Number(id));
      if (idx === -1) return null;
      Object.assign(data.enquiries[idx], fields);
      save();
      return data.enquiries[idx];
    },
  },

  waivers: {
    create(fields) {
      const row = { id: nextId('waivers'), submitted_at: new Date().toISOString(), ...fields };
      data.waivers.push(row);
      save();
      return row;
    },
    list() {
      return [...data.waivers].sort((a, b) =>
        (b.submitted_at || '').localeCompare(a.submitted_at || '')
      );
    },
    findById(id) {
      return data.waivers.find(w => w.id === Number(id)) || null;
    },
    findByEmail(email) {
      return data.waivers.filter(w => w.email === email);
    },
  },
};

module.exports = store;

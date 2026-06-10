// One-time script: permanently delete all bookings on 20/06/2026
const path = require('path');
const fs   = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../server/data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');

const raw  = fs.readFileSync(DB_FILE, 'utf8');
const data = JSON.parse(raw);

const TARGET_DATE = '20/06/2026';
const before = data.bookings.length;

const removed = data.bookings.filter(b => b.session_date === TARGET_DATE);
removed.forEach(b => console.log(`Deleting booking #${b.id} — ${b.first_name} ${b.last_name} at ${b.session_time} (status: ${b.status})`));

data.bookings = data.bookings.filter(b => b.session_date !== TARGET_DATE);

fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
console.log(`\nDone. Removed ${before - data.bookings.length} booking(s) on ${TARGET_DATE}.`);

// One-time script: purge all bookings, clients, and waivers from the database
const path = require('path');
const fs   = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../server/data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');

const raw  = fs.readFileSync(DB_FILE, 'utf8');
const data = JSON.parse(raw);

console.log(`Before purge:`);
console.log(`  Bookings: ${data.bookings.length}`);
console.log(`  Clients:  ${data.clients.length}`);
console.log(`  Waivers:  ${data.waivers.length}`);

data.bookings = [];
data.clients  = [];
data.waivers  = [];

fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

console.log(`\nDone. All bookings, clients, and waivers have been purged.`);

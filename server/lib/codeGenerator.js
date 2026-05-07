const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let s1 = '', s2 = '';
  for (let i = 0; i < 4; i++) s1 += CHARS[Math.floor(Math.random() * CHARS.length)];
  for (let i = 0; i < 4; i++) s2 += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `AS-${s1}-${s2}`;
}

function generateUniqueCode(store) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateCode();
    if (!store.giftCards.findByCode(code)) return code;
  }
  throw new Error('Could not generate unique gift card code');
}

module.exports = { generateUniqueCode };

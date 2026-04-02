const PREFIX = {
  laptop: 'LAP',
  desktop: 'DESK',
  build: 'BUILD',
  upgrade: 'UPG',
  warranty: 'WAR',
  general: 'QUOTE'
};

function randomToken(len = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function generateQuoteCode(quoteType = 'general') {
  const prefix = PREFIX[quoteType] || PREFIX.general;
  return `${prefix}-${randomToken(5)}`;
}

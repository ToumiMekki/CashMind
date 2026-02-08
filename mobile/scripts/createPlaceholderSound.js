/**
 * Creates a minimal WAV file (~50ms) for CashMind sound effects.
 * Run from project root: node mobile/scripts/createPlaceholderSound.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'sounds');
const SAMPLE_RATE = 8000;
const DURATION_MS = 50;
const NUM_SAMPLES = Math.floor((SAMPLE_RATE * DURATION_MS) / 1000);

// Minimal WAV: 44-byte header + 8-byte data chunk header + samples
// 8-bit mono, 8000 Hz
const dataSize = NUM_SAMPLES;
const chunkSize = 36 + dataSize;
const buffer = Buffer.alloc(44 + dataSize);
let offset = 0;

function write(str) {
  buffer.write(str, offset);
  offset += str.length;
}
function writeU32(n) {
  buffer.writeUInt32LE(n, offset);
  offset += 4;
}
function writeU16(n) {
  buffer.writeUInt16LE(n, offset);
  offset += 2;
}

// RIFF header
write('RIFF');
writeU32(chunkSize);
write('WAVE');
// fmt chunk
write('fmt ');
writeU32(16);
writeU16(1); // PCM
writeU16(1); // mono
writeU32(SAMPLE_RATE);
writeU32(SAMPLE_RATE); // byte rate
writeU16(1); // block align
writeU16(8); // bits per sample
// data chunk
write('data');
writeU32(dataSize);
// silence (128 = 0 in 8-bit unsigned)
for (let i = 0; i < NUM_SAMPLES; i++) {
  buffer.writeUInt8(128, offset++);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const files = [
  'transaction_success',
  'transaction_error',
  'amount_tap',
  'category_selected',
  'qr_scan_success',
  'photo_attached',
  'analytics_loaded',
];

for (const name of files) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.wav`), buffer);
  console.log('Created', path.join(OUT_DIR, `${name}.wav`));
}

console.log('Done. Placeholder sounds created (replace with premium assets later).');

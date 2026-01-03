import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOZLESME_URL = 'https://dolap-agreement.s3.eu-central-1.amazonaws.com/current/kullanici-sozlesmesi.html';
const OUTPUT_PATH = join(__dirname, '..', 'sozlesmeler', 'kullanici-sozlesmesi.html');

async function fetchSozlesme() {
  console.log('Sozlesme indiriliyor...');
  
  const response = await fetch(SOZLESME_URL);
  
  if (!response.ok) {
    throw new Error(`HTTP hata: ${response.status}`);
  }
  
  const html = await response.text();
  writeFileSync(OUTPUT_PATH, html, 'utf-8');
  
  console.log(`Sozlesme kaydedildi: ${OUTPUT_PATH}`);
  return html;
}

fetchSozlesme().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});

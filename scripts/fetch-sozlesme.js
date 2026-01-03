import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { NodeHtmlMarkdown } from 'node-html-markdown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOZLESME_URL = 'https://dolap-agreement.s3.eu-central-1.amazonaws.com/current/kullanici-sozlesmesi.html';
const OUTPUT_PATH = join(__dirname, '..', 'sozlesmeler', 'kullanici-sozlesmesi.md');

const nhm = new NodeHtmlMarkdown();

async function fetchSozlesme() {
  console.log('Sözleşme indiriliyor...');
  
  const response = await fetch(SOZLESME_URL);
  
  if (!response.ok) {
    throw new Error(`HTTP hata: ${response.status}`);
  }
  
  const html = await response.text();
  const markdown = nhm.translate(html);
  writeFileSync(OUTPUT_PATH, markdown, 'utf-8');
  
  console.log(`Sözleşme kaydedildi: ${OUTPUT_PATH}`);
  return markdown;
}

fetchSozlesme().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});

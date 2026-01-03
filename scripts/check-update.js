import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { analyzeDiff } from './analyze-diff.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const SOZLESME_PATH = join(ROOT_DIR, 'sozlesmeler', 'kullanici-sozlesmesi.md');
const SOZLESME_URL = 'https://dolap-agreement.s3.eu-central-1.amazonaws.com/current/kullanici-sozlesmesi.html';

const nhm = new NodeHtmlMarkdown();

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      if (response.status >= 500 || response.status === 429) {
        console.log(`Deneme ${i + 1}/${retries} başarısız (${response.status}), tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw new Error(`HTTP hata: ${response.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Deneme ${i + 1}/${retries} başarısız, tekrar deneniyor...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

function exec(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error(`Komut hatası: ${cmd}`);
    console.error(err.message);
    throw err;
  }
}

async function main() {
  console.log('Sözleşme kontrol ediliyor...');
  
  const response = await fetchWithRetry(SOZLESME_URL);
  const newHtml = await response.text();
  const newMarkdown = nhm.translate(newHtml);
  
  let oldMarkdown = '';
  if (existsSync(SOZLESME_PATH)) {
    oldMarkdown = readFileSync(SOZLESME_PATH, 'utf-8');
  }
  
  const forceCheck = process.env.FORCE_CHECK === 'true';
  
  if (oldMarkdown === newMarkdown && !forceCheck) {
    console.log('Değişiklik yok.');
    return;
  }
  
  if (oldMarkdown === newMarkdown && forceCheck) {
    console.log('Değişiklik yok ama force check aktif, devam ediliyor...');
  }
  
  console.log('Değişiklik tespit edildi!');
  
  writeFileSync(SOZLESME_PATH, newMarkdown, 'utf-8');
  console.log('Yeni sözleşme kaydedildi.');
  
  let commitMessage = '';
  const today = new Date().toISOString().split('T')[0];
  
  if (oldMarkdown === '') {
    commitMessage = `docs(sözleşme): İlk sözleşme versiyonu - ${today}`;
  } else {
    console.log('Gemini ile değişiklikler analiz ediliyor...');
    try {
      const analysis = await analyzeDiff(oldMarkdown, newMarkdown);
      commitMessage = `docs(sözleşme): Sözleşme güncellemesi - ${today}\n\n${analysis}`;
    } catch (err) {
      console.error('Gemini analiz hatası:', err.message);
      commitMessage = `docs(sözleşme): Sözleşme güncellemesi - ${today}\n\nOtomatik analiz yapılamadı.`;
    }
  }
  
  console.log('\nCommit mesajı:\n' + commitMessage);
  
  exec('git add sozlesmeler/kullanici-sozlesmesi.md');
  
  const commitMsgPath = join(ROOT_DIR, '.commit-msg.txt');
  writeFileSync(commitMsgPath, commitMessage, 'utf-8');
  exec(`git commit -F "${commitMsgPath}"`);
  
  try {
    unlinkSync(commitMsgPath);
  } catch (e) {}
  
  console.log('\nCommit başarıyla oluşturuldu.');
  
  if (process.env.GITHUB_ACTIONS) {
    console.log('GitHub Actions: Push yapılıyor...');
    exec('git push');
  }
}

main().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});

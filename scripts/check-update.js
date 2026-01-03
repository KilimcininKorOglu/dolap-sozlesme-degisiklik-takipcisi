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

function exec(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
}

async function main() {
  console.log('Sozlesme kontrol ediliyor...');
  
  const response = await fetch(SOZLESME_URL);
  if (!response.ok) {
    throw new Error(`HTTP hata: ${response.status}`);
  }
  const newHtml = await response.text();
  const newMarkdown = nhm.translate(newHtml);
  
  let oldMarkdown = '';
  if (existsSync(SOZLESME_PATH)) {
    oldMarkdown = readFileSync(SOZLESME_PATH, 'utf-8');
  }
  
  if (oldMarkdown === newMarkdown) {
    console.log('Degisiklik yok.');
    return;
  }
  
  console.log('Degisiklik tespit edildi!');
  
  writeFileSync(SOZLESME_PATH, newMarkdown, 'utf-8');
  console.log('Yeni sozlesme kaydedildi.');
  
  let commitMessage = '';
  const today = new Date().toISOString().split('T')[0];
  
  if (oldMarkdown === '') {
    commitMessage = `Ilk sozlesme versiyonu - ${today}`;
  } else {
    console.log('Gemini ile degisiklikler analiz ediliyor...');
    try {
      const analysis = await analyzeDiff(oldMarkdown, newMarkdown);
      commitMessage = `Sozlesme Guncellemesi - ${today}\n\n${analysis}`;
    } catch (err) {
      console.error('Gemini analiz hatasi:', err.message);
      commitMessage = `Sozlesme Guncellemesi - ${today}\n\nOtomatik analiz yapilamadi.`;
    }
  }
  
  console.log('\nCommit mesaji:\n' + commitMessage);
  
  exec('git add sozlesmeler/kullanici-sozlesmesi.md');
  
  const commitMsgPath = join(ROOT_DIR, '.commit-msg.txt');
  writeFileSync(commitMsgPath, commitMessage, 'utf-8');
  exec(`git commit -F "${commitMsgPath}"`);
  
  try {
    unlinkSync(commitMsgPath);
  } catch (e) {}
  
  console.log('\nCommit basariyla olusturuldu.');
  
  if (process.env.GITHUB_ACTIONS) {
    console.log('GitHub Actions: Push yapiliyor...');
    exec('git push');
  }
}

main().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});

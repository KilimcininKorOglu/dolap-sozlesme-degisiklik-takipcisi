import { GoogleGenerativeAI } from '@google/generative-ai';

function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const removed = [];
  const added = [];
  
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (oldLine !== newLine) {
      if (oldLine.trim()) {
        removed.push({ line: i + 1, content: oldLine });
      }
      if (newLine.trim()) {
        added.push({ line: i + 1, content: newLine });
      }
    }
  }
  
  return { removed, added };
}

function formatDiffForPrompt(diff) {
  let result = '';
  
  if (diff.removed.length > 0) {
    result += '## Kaldırılan/Değiştirilen Satırlar:\n';
    result += diff.removed.slice(0, 200).map(item => `- [Satır ${item.line}] ${item.content}`).join('\n');
    if (diff.removed.length > 200) {
      result += `\n... ve ${diff.removed.length - 200} satır daha`;
    }
  }
  
  if (diff.added.length > 0) {
    result += '\n\n## Eklenen/Değiştirilen Satırlar:\n';
    result += diff.added.slice(0, 200).map(item => `+ [Satır ${item.line}] ${item.content}`).join('\n');
    if (diff.added.length > 200) {
      result += `\n... ve ${diff.added.length - 200} satır daha`;
    }
  }
  
  return result;
}

export async function analyzeDiff(oldMarkdown, newMarkdown) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable gerekli.');
  }
  
  const diff = computeDiff(oldMarkdown, newMarkdown);
  
  if (diff.removed.length === 0 && diff.added.length === 0) {
    return 'Önemli bir değişiklik tespit edilmedi.';
  }
  
  const diffText = formatDiffForPrompt(diff);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `Sen bir hukuk dokümanı analiz uzmanısın. Aşağıda bir e-ticaret platformu (Dolap) kullanıcı sözleşmesinde yapılan değişiklikler var.

## Görev
Değişiklikleri analiz et ve özetle. Kaldırılan satırlar (-) eski versiyondan, eklenen satırlar (+) yeni versiyondan.

## Kurallar
1. Sadece anlamlı değişiklikleri raporla (boşluk, format, yazım düzeltmeleri hariç).
2. Sayısal değerlerde mutlaka eski ve yeni değeri belirt: "X'ten Y'ye değişti".
3. Değişikliğin hangi maddede olduğunu belirt (örn: "Madde 7.1").
4. Türkçe yaz, kısa ve net ol.
5. İlişkili değişiklikleri grupla (örn: bir maddenin eski ve yeni hali).

## Öncelik Sırası (bu sırayla listele)
1. **Ücret/Komisyon değişiklikleri** - Satıcı/alıcı komisyon oranları, hizmet bedelleri
2. **Süre değişiklikleri** - İade, teslimat, onay süreleri
3. **Hak/Yükümlülük değişiklikleri** - Tarafların sorumlulukları
4. **Yeni eklenen maddeler**
5. **Kaldırılan maddeler**
6. **Diğer değişiklikler**

## Çıktı Formatı
Her değişiklik için:
- [Kategori] Madde X.X: Değişiklik açıklaması (eski değer → yeni değer)

---

${diffText}

---

DEĞİŞİKLİKLER:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

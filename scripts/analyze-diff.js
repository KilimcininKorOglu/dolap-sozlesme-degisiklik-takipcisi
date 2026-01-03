import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeDiff(oldMarkdown, newMarkdown) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable gerekli.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Sen bir hukuk dokümanı analiz uzmanısın. Aşağıda bir sözleşmenin eski ve yeni versiyonu var.

Değişiklikleri analiz et ve commit mesajı formatında özetle. Türkçe yaz.

Format:
- Her değişikliği ayrı madde olarak listele.
- Kısa ve net ol.
- Sadece önemli değişiklikleri yaz (boşluk, format değişiklikleri hariç).
- Eğer komisyon oranı, süre, bedel gibi sayısal değerler değiştiyse mutlaka belirt.

ESKİ VERSİYON:
${oldMarkdown.substring(0, 50000)}

YENİ VERSİYON:
${newMarkdown.substring(0, 50000)}

DEĞİŞİKLİKLER:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

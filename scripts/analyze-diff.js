import { GoogleGenerativeAI } from '@google/generative-ai';
import { NodeHtmlMarkdown } from 'node-html-markdown';

const nhm = new NodeHtmlMarkdown();

export async function analyzeDiff(oldHtml, newHtml) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable gerekli');
  }
  
  const oldMarkdown = nhm.translate(oldHtml);
  const newMarkdown = nhm.translate(newHtml);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Sen bir hukuk dokumani analiz uzmanısın. Asagida bir sozlesmenin eski ve yeni versiyonu var.

Degisiklikleri analiz et ve commit mesaji formatinda ozetle. Turkce yaz.

Format:
- Her degisikligi ayri madde olarak listele
- Kisa ve net ol
- Sadece onemli degisiklikleri yaz (bosluk, format degisiklikleri hariç)
- Eger komisyon orani, sure, bedel gibi sayisal degerler degistiyse mutlaka belirt

ESKI VERSIYON:
${oldMarkdown.substring(0, 50000)}

YENI VERSIYON:
${newMarkdown.substring(0, 50000)}

DEGISIKLIKLER:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export function htmlToMarkdown(html) {
  return nhm.translate(html);
}

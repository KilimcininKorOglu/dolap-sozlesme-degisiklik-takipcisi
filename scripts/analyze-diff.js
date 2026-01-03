import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeDiff(oldMarkdown, newMarkdown) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable gerekli');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Sen bir hukuk dokumani analiz uzmanisin. Asagida bir sozlesmenin eski ve yeni versiyonu var.

Degisiklikleri analiz et ve commit mesaji formatinda ozetle. Turkce yaz.

Format:
- Her degisikligi ayri madde olarak listele
- Kisa ve net ol
- Sadece onemli degisiklikleri yaz (bosluk, format degisiklikleri haric)
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

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeDiff(oldMarkdown, newMarkdown) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable gerekli.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `Sen bir hukuk dokümanı analiz uzmanısın. Aşağıda bir e-ticaret platformu kullanıcı sözleşmesinin eski ve yeni versiyonu var.

## Görev
İki versiyon arasındaki değişiklikleri tespit et ve özetle.

## Kurallar
1. Sadece anlamlı değişiklikleri raporla (boşluk, format, yazım düzeltmeleri hariç).
2. Sayısal değerlerde mutlaka eski ve yeni değeri belirt: "X'ten Y'ye değişti".
3. Değişikliğin hangi maddede olduğunu belirt (örn: "Madde 7.1").
4. Türkçe yaz, kısa ve net ol.

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

Eğer değişiklik yoksa sadece "Önemli bir değişiklik tespit edilmedi." yaz.

---

ESKİ VERSİYON:
${oldMarkdown.substring(0, 50000)}

---

YENİ VERSİYON:
${newMarkdown.substring(0, 50000)}

---

DEĞİŞİKLİKLER:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

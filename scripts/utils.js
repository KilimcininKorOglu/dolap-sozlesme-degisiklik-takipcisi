export async function fetchWithRetry(url, retries = 3, delay = 1000) {
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
  throw new Error(`${retries} deneme sonrası başarısız: ${url}`);
}

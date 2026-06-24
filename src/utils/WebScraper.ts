export const fetchAndExtractText = async (urls: string[]): Promise<string> => {
  let combinedText = '';
  
  for (const rawUrl of urls) {
    const url = rawUrl.trim();
    if (!url) continue;
    
    try {
      // Use AllOrigins as a free CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const html = data.contents;
      
      if (!html) {
        throw new Error('No content returned from proxy');
      }

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove unwanted elements
      const elementsToRemove = doc.querySelectorAll('script, style, noscript, iframe, svg, img, nav, footer, header, aside, .cookie-banner, #cookie-banner, .ads, .advertisement');
      elementsToRemove.forEach(el => el.remove());
      
      // Try to find the main article content, fallback to body
      const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
      
      // Extract text and clean up whitespace
      let text = article.innerText || article.textContent || '';
      text = text.replace(/\s+/g, ' ').trim();
      
      // Limit text per URL to roughly 50,000 chars
      if (text.length > 50000) {
        text = text.substring(0, 50000) + '... (Inhalt gekürzt)';
      }
      
      combinedText += `\n\n--- QUELLE: ${url} ---\n${text}`;
      
    } catch (error: any) {
      console.error(`Fehler beim Auslesen von ${url}:`, error);
      combinedText += `\n\n--- QUELLE: ${url} ---\nFEHLER: Konnte die Webseite nicht herunterladen oder auslesen. Möglicherweise blockiert die Seite automatisierte Abrufe. (${error.message || error})`;
    }
  }
  
  return combinedText.trim();
};

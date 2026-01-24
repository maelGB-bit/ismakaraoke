/**
 * Safely decodes HTML entities without using innerHTML.
 * Uses DOMParser which is safer than setting innerHTML directly.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || text;
  } catch {
    // Fallback to original text if parsing fails
    return text;
  }
}

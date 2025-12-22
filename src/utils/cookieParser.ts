/**
 * Utilitaires pour parser différents formats de cookies
 */

/**
 * Détecte et parse les cookies au format Ikabot (JSON object)
 * Format: {"ikariam": "100554_...", "PHPSESSID": "abc123", ...}
 */
function parseIkabotFormat(input: string): string | null {
  try {
    // Essaie d'extraire l'objet JSON des cookies
    const jsonMatch = input.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const cookiesObj = JSON.parse(jsonMatch[0]);

    // Convertit l'objet en format standard
    const cookiePairs: string[] = [];
    for (const [name, value] of Object.entries(cookiesObj)) {
      cookiePairs.push(`${name}=${value}`);
    }

    return cookiePairs.join('; ');
  } catch {
    return null;
  }
}

/**
 * Détecte si c'est déjà au format standard (name=value; name2=value2)
 */
function isStandardFormat(input: string): boolean {
  return input.includes('=') && !input.includes('{');
}

/**
 * Parse les cookies depuis différents formats
 * Supporte :
 * 1. Format standard: "name=value; name2=value2"
 * 2. Format Ikabot JSON: {"name": "value", "name2": "value2"}
 * 3. Format document.cookie: retour direct de document.cookie
 */
export function parseCookies(input: string): string {
  if (!input || !input.trim()) {
    return '';
  }

  // Nettoie l'input (enlève les guillemets au début/fin si présents)
  let cleaned = input.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }

  // Tente le format Ikabot JSON
  const ikabotParsed = parseIkabotFormat(cleaned);
  if (ikabotParsed) {
    return ikabotParsed;
  }

  // Si c'est déjà au format standard, retourne tel quel
  if (isStandardFormat(cleaned)) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Vérifie que les cookies contiennent les éléments essentiels
 */
export function validateCookies(cookies: string): {
  valid: boolean;
  hasPHPSESSID: boolean;
  hasIkariam: boolean;
  error?: string;
} {
  const hasPHPSESSID = cookies.includes('PHPSESSID=');
  const hasIkariam = cookies.includes('ikariam=');

  if (!hasPHPSESSID && !hasIkariam) {
    return {
      valid: false,
      hasPHPSESSID: false,
      hasIkariam: false,
      error: 'Les cookies doivent contenir au moins PHPSESSID ou ikariam',
    };
  }

  if (!hasPHPSESSID) {
    return {
      valid: false,
      hasPHPSESSID: false,
      hasIkariam: true,
      error: 'PHPSESSID manquant. Assurez-vous de copier TOUS les cookies.',
    };
  }

  return {
    valid: true,
    hasPHPSESSID: true,
    hasIkariam: hasIkariam,
  };
}

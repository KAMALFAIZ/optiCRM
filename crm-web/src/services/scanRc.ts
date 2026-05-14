/**
 * Scan RC (Registre de Commerce) via Claude Vision API.
 * Accepts an image (jpg/png/webp/gif) or PDF file and extracts company data.
 */

export interface RcExtractedData {
  name?: string;              // Raison sociale
  rc?: string;                // Numéro RC
  ice?: string;               // ICE (15 chiffres)
  identifiantFiscal?: string; // IF
  cnss?: string;
  patente?: string;
  capitalSocial?: number;     // Capital social (valeur numérique en DH)
  associes?: string;          // Associés / actionnaires (texte libre)
  secteurActivite?: string;   // Activité principale
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingState?: string;
  billingCountry?: string;
  phone?: string;
  fax?: string;
}

type SupportedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf';

const SUPPORTED_TYPES: SupportedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix ("data:...;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function scanRcDocument(file: File): Promise<RcExtractedData> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
  if (!apiKey) throw new Error('Clé API Anthropic non configurée');

  const mimeType = file.type as SupportedMimeType;
  if (!SUPPORTED_TYPES.includes(mimeType)) {
    throw new Error(`Format non supporté : ${file.type}. Utilisez JPG, PNG, WebP ou PDF.`);
  }

  const base64 = await fileToBase64(file);

  const isImage = mimeType.startsWith('image/');

  const contentBlock = isImage
    ? {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mimeType, data: base64 },
      }
    : {
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
      };

  const prompt = `Tu es un expert en lecture de documents officiels marocains (Registre de Commerce, modèle J, extrait OMPIC, statuts, etc.).

Analyse ce document et extrais les informations suivantes. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans texte avant ou après :

{
  "name": "Raison sociale ou dénomination sociale complète",
  "rc": "Numéro du Registre de Commerce avec la ville (ex: 123456 - Casablanca)",
  "ice": "ICE - Identifiant Commun Entreprise (15 chiffres exactement)",
  "identifiantFiscal": "IF - Identifiant Fiscal",
  "cnss": "Numéro d'affiliation CNSS",
  "patente": "Numéro de Patente / Taxe professionnelle",
  "capitalSocial": 100000,
  "associes": "Liste des associés/actionnaires avec leurs parts (texte libre, une personne par ligne)",
  "secteurActivite": "Objet social / Activité principale de l'entreprise (texte court)",
  "billingStreet": "Adresse complète (rue, numéro, quartier)",
  "billingCity": "Ville du siège social",
  "billingPostalCode": "Code postal",
  "billingState": "Région ou Préfecture",
  "billingCountry": "Pays (Maroc si non précisé)",
  "phone": "Numéro de téléphone",
  "fax": "Numéro de fax"
}

Règles :
- "capitalSocial" doit être un nombre (ex: 100000 et non "100 000 DH")
- Si une information est absente ou illisible, mets null
- Ne mets pas de texte supplémentaire, uniquement le JSON`;

  // Cascade : Opus → Haiku (si surchargé)
  const MODELS = ['claude-opus-4-6', 'claude-haiku-4-5-20251001'];
  let response: Response | null = null;

  for (const model of MODELS) {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
      }),
    });
    if (response.ok) break;
    const errBody = await response.json().catch(() => ({})) as { error?: { type?: string; message?: string } };
    const isOverloaded = response.status === 529 || errBody?.error?.type === 'overloaded_error';
    if (!isOverloaded) {
      throw new Error(errBody.error?.message || `Erreur API Claude (${response.status})`);
    }
    // Si dernier modèle aussi surchargé → erreur taggée pour l'UI
    if (model === MODELS[MODELS.length - 1]) {
      const e = new Error('OVERLOADED: Le service IA est temporairement surchargé. Saisissez les données manuellement.');
      (e as Error & { isOverloaded: boolean }).isOverloaded = true;
      throw e;
    }
  }
  if (!response) throw new Error('Erreur réseau');

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content.find((b) => b.type === 'text')?.text ?? '';

  // Extract JSON from the response (strip potential markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse Claude invalide — aucun JSON trouvé');

  const extracted = JSON.parse(jsonMatch[0]) as Record<string, string | number | null>;

  // Clean up: remove null/empty values; handle capitalSocial as number
  const result: RcExtractedData = {};
  for (const [key, value] of Object.entries(extracted)) {
    if (value == null) continue;
    if (key === 'capitalSocial') {
      const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(num) && num > 0) result.capitalSocial = num;
    } else if (typeof value === 'string' && value.trim() !== '') {
      (result as Record<string, string>)[key] = value.trim();
    }
  }

  return result;
}

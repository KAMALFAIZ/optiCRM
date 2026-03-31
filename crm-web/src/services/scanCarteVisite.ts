/**
 * Scan carte de visite via Claude Vision — appel direct navigateur.
 * Cascade : Opus → Haiku. Si les deux surchargés : throw avec isOverloaded=true.
 */

export interface CarteVisiteData {
  nom?: string;
  societe?: string;
  poste?: string;
  telephone?: string;
  telephoneMobile?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  siteWeb?: string;
}

const MODELS = ['claude-opus-4-6', 'claude-haiku-4-5-20251001'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PROMPT = `Tu es un expert en lecture de cartes de visite professionnelles (marocaines, françaises, arabes).

Analyse cette carte de visite et extrais les informations suivantes. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :

{
  "nom": "Prénom et Nom complet de la personne",
  "societe": "Nom de la société ou entreprise",
  "poste": "Titre / Poste / Fonction (ex: Directeur Commercial, Architecte...)",
  "telephone": "Numéro de téléphone fixe",
  "telephoneMobile": "Numéro de téléphone mobile / portable",
  "email": "Adresse email",
  "adresse": "Adresse postale complète",
  "ville": "Ville",
  "siteWeb": "Site web (URL)"
}

Règles :
- Si une information est absente ou illisible, mets null
- Pour le téléphone, garde le format original (avec indicatif si présent)
- Ne mets aucun texte en dehors du JSON`;

export async function scanCarteVisite(file: File): Promise<CarteVisiteData> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
  if (!apiKey) throw new Error('Clé API Anthropic non configurée (VITE_ANTHROPIC_API_KEY)');

  const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
    throw new Error(`Format non supporté : ${file.type}. Utilisez JPG, PNG ou WebP.`);
  }

  const base64 = await fileToBase64(file);

  for (const model of MODELS) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    if (response.ok) {
      const data = await response.json() as { content: Array<{ type: string; text?: string }> };
      const text = data.content.find(b => b.type === 'text')?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Réponse IA invalide');
      const raw = JSON.parse(jsonMatch[0]) as Record<string, string | null>;
      const result: CarteVisiteData = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string' && value.trim()) {
          (result as Record<string, string>)[key] = value.trim();
        }
      }
      return result;
    }

    const errBody = await response.json().catch(() => ({})) as { error?: { type?: string } };
    const isOverloaded = response.status === 529 || errBody?.error?.type === 'overloaded_error';
    if (!isOverloaded) throw new Error(`Erreur IA (${response.status})`);
    if (model === MODELS[MODELS.length - 1]) {
      const e = new Error('OVERLOADED');
      (e as Error & { isOverloaded: boolean }).isOverloaded = true;
      throw e;
    }
  }
  throw new Error('Erreur inattendue');
}

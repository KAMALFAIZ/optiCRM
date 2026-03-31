/**
 * Analyse d'image chantier via Claude Vision — appel direct navigateur.
 * Cascade : Opus → Haiku. Si les deux sont surchargés : throw avec isOverloaded=true.
 * Extrait : infos chantier + TOUS les intervenants (Architecte, BET, Entreprise…)
 */

export interface ChantierIntervenant {
  role: string;         // ex: "Architecte", "Bureau d'études", "Entreprise GC"…
  nom: string;          // Nom de la personne ou société
  societe?: string;     // Nom de la société si différent du nom
  adresse?: string;
  telephone?: string;
  email?: string;
  ville?: string;
}

export interface ChantierVisionData {
  // ── Identification ─────────────────────────────────────────────
  nomChantier?: string;
  referenceProjet?: string;    // N° de dossier, N° de permis, N° marché
  description?: string;        // Objet des travaux
  ville?: string;
  adresseChantier?: string;
  region?: string;
  // ── Classification ─────────────────────────────────────────────
  typeProjet?: string;         // RESIDENTIEL_COLLECTIF | RESIDENTIEL_INDIVIDUEL | TERTIAIRE_INSTITUTIONNEL | COMMERCIAL | INDUSTRIEL | INFRASTRUCTURE
  sousTypeProjet?: string;
  stadeChantier?: string;
  nombreUnites?: number;
  superficie?: number;         // m²
  montantMarche?: string;      // Budget / montant estimé
  // ── Maître d'ouvrage ───────────────────────────────────────────
  maitrOuvrage?: string;       // Nom/société du MO
  maitrOuvrageAdresse?: string;
  maitrOuvrageContact?: string;
  // ── Intervenants ───────────────────────────────────────────────
  intervenants?: ChantierIntervenant[];
  // ── Dates ──────────────────────────────────────────────────────
  datePermis?: string;
  dateDebutTravaux?: string;
  dureeChantier?: string;
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

const PROMPT = `Tu es un expert en analyse de documents de construction marocains : panneaux de chantier, affiches de projets, permis de construire, dossiers OMPIC, tableaux d'intervenants.

Analyse cette image et extrais le MAXIMUM d'informations. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :

{
  "nomChantier": "Nom complet du projet, résidence ou ouvrage",
  "referenceProjet": "Numéro de dossier, permis, appel d'offres ou marché",
  "description": "Objet des travaux — description courte (ex: Construction d'une mosquée...)",
  "ville": "Ville où se situe le chantier",
  "adresseChantier": "Adresse complète du chantier si visible",
  "region": "Région (ex: Rabat-Salé-Kénitra, Casablanca-Settat...)",
  "typeProjet": "RESIDENTIEL_COLLECTIF | RESIDENTIEL_INDIVIDUEL | TERTIAIRE_INSTITUTIONNEL | COMMERCIAL | INDUSTRIEL | INFRASTRUCTURE",
  "sousTypeProjet": "LOGEMENT_SOCIAL | MOYEN_STANDING | HAUT_STANDING | VILLAS | HOTEL | BUREAUX | CENTRE_COMMERCIAL | MOSQUEE | ECOLE | HOPITAL | AUTRE",
  "stadeChantier": "ETUDE_CONCEPTION | AUTORISATION | GROS_OEUVRE | SECOND_OEUVRE | PHASE_EQUIPEMENT | LIVRAISON | CLOTURE",
  "nombreUnites": 120,
  "superficie": 5000,
  "montantMarche": "Montant en DH si visible",
  "maitrOuvrage": "Nom ou société du maître d'ouvrage",
  "maitrOuvrageAdresse": "Adresse du maître d'ouvrage",
  "maitrOuvrageContact": "Téléphone ou email du maître d'ouvrage",
  "datePermis": "Date du permis de construire ou décision",
  "dateDebutTravaux": "Date de début des travaux",
  "dureeChantier": "Durée prévue des travaux",
  "intervenants": [
    {
      "role": "Rôle exact tel qu'écrit sur le document (Architecte, Bureau d'études, BET, Vérificateur, Laboratoire, Entreprise GC, Sous-traitant, Installateur, Topographe...)",
      "nom": "Nom de la personne ou raison sociale",
      "societe": "Nom de la société si différent du nom de la personne",
      "adresse": "Adresse complète",
      "telephone": "Numéro de téléphone",
      "email": "Email",
      "ville": "Ville"
    }
  ]
}

Règles IMPORTANTES :
- Extrais TOUS les intervenants visibles : architecte, bureau d'études, vérificateur, laboratoire, entreprise générale, sous-traitants, topographe, etc.
- "nombreUnites" et "superficie" : nombres entiers ou null
- "typeProjet" et "stadeChantier" : utilise UNIQUEMENT les valeurs listées
- Si une information est absente ou illisible, mets null
- Pour "intervenants" : si aucun, mets []
- Ne mets AUCUN texte en dehors du JSON`;

export async function scanChantierImage(file: File): Promise<ChantierVisionData> {
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
        max_tokens: 2048,  // plus large pour capturer tous les intervenants
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
      if (!jsonMatch) throw new Error('Réponse IA invalide — aucun JSON trouvé');

      const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const result: ChantierVisionData = {};

      const strFields: (keyof ChantierVisionData)[] = [
        'nomChantier', 'referenceProjet', 'description', 'ville', 'adresseChantier', 'region',
        'typeProjet', 'sousTypeProjet', 'stadeChantier', 'montantMarche',
        'maitrOuvrage', 'maitrOuvrageAdresse', 'maitrOuvrageContact',
        'datePermis', 'dateDebutTravaux', 'dureeChantier',
      ];

      for (const key of strFields) {
        const v = raw[key];
        if (typeof v === 'string' && v.trim()) (result as Record<string, string>)[key] = v.trim();
      }

      for (const key of ['nombreUnites', 'superficie'] as const) {
        const v = raw[key];
        if (v != null) {
          const n = typeof v === 'number' ? v : parseInt(String(v), 10);
          if (!isNaN(n) && n > 0) result[key] = n;
        }
      }

      if (Array.isArray(raw.intervenants)) {
        result.intervenants = (raw.intervenants as Record<string, string>[])
          .filter(i => i?.nom || i?.societe)
          .map(i => ({
            role:      String(i.role      ?? 'Autre').trim(),
            nom:       String(i.nom       ?? i.societe ?? '').trim(),
            societe:   i.societe   ? String(i.societe).trim()   : undefined,
            adresse:   i.adresse   ? String(i.adresse).trim()   : undefined,
            telephone: i.telephone ? String(i.telephone).trim() : undefined,
            email:     i.email     ? String(i.email).trim()     : undefined,
            ville:     i.ville     ? String(i.ville).trim()     : undefined,
          }));
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

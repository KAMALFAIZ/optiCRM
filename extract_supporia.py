import re, json, io, sys

with open(r'D:\kasoft-platform\OptiCRM\sage_supporia.txt', encoding='utf-8') as f:
    content = f.read()

block_re = re.compile(
    r'N[°o]\s*d.erreur\s*[:\-]?\s*([A-Z][A-Z0-9]+)\s*\n(.*?)(?=N[°o]\s*d.erreur\s*[:\-]?\s*[A-Z][A-Z0-9]+\s*\n|Chapitre\s+[0-9]|©\s*20[0-9]{2}|\Z)',
    re.DOTALL
)

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def get_categorie(code):
    if code.startswith('M') or code.startswith('E') or code.startswith('L'):
        return 'SAGE100_COMPTA'
    if code.startswith('I'):
        return 'SAGE100_IMMO'
    if code.startswith('T'):
        return 'SAGE100_TRESORERIE'
    if code.startswith('CC') or code.startswith('CD') or code.startswith('CE'):
        return 'SAGE100_CAISSE'
    if code.startswith('CF') or code.startswith('CFA') or code.startswith('CFF'):
        return 'SAGE100_MOYENS_PAIEMENT'
    if code.startswith('C'):
        return 'SAGE100_GC'
    if code.startswith('G'):
        return 'SAGE100_COMPTA'
    return 'SUPPORT_APPLICATIF'

def get_sous_cat(code):
    prefixes = {
        'M01': 'COMPTES_GENERAUX', 'M02': 'COMPTES_TIERS', 'M03': 'BUDGETS',
        'M0A': 'JOURNAUX', 'M0C': 'ECRITURES_COMPTABLES', 'M0D': 'ECRITURES_ANALYTIQUES',
        'M0B': 'SECTIONS_ANALYTIQUES', 'M09': 'MODELES_SAISIE', 'M16': 'BLOCS_NOTES',
        'M17': 'BUDGETS_CG', 'M18': 'BUDGETS_ANAL', 'M19': 'REPART_ANAL',
        'M1E': 'REGLEMENTS_TIERS', 'M1F': 'ECHEANCES', 'M21': 'BANQUES',
        'M2C': 'EXTRAITS', 'M46': 'CONTACTS_TIERS', 'M52': 'ECRIT_ANAL_FIN',
        'M55': 'LIBELLES_EXTRAITS', 'M63': 'RECOUVREMENT', 'M6D': 'BON_A_PAYER',
        'M6E': 'MANDATS', 'MFF': 'PROTECTIONS', 'M4': 'CONTACTS',
        'E02': 'REGROUPEMENTS', 'E03': 'REGROUPEMENTS_FOURCH', 'E04': 'CONSIGNES', 'E05': 'TABLEAUX',
        'L01': 'MVT_JOURNAUX_LOT', 'L02': 'ECRIT_COMPTA_LOT', 'L03': 'ECRIT_ANAL_LOT',
        'C03': 'ENUM_GAMMES', 'C05': 'FAMILLES_ARTICLES', 'C06': 'ARTICLES',
        'C07': 'FOURNISSEURS_ART', 'C08': 'STOCKS', 'C09': 'REPRESENTANTS',
        'C0A': 'TARIFS', 'C0B': 'CLIENTS', 'C0C': 'DOC_ENTETES', 'C0D': 'DOC_LIGNES',
        'C0E': 'ACOMPTES', 'C0F': 'REGLEMENTS', 'C12': 'TARIFS_FOURNISS',
        'C13': 'CAT_TARIFAIRES', 'C14': 'REMISES_CLIENT', 'C15': 'GAMMES_REMISES',
        'I01': 'FAM_IMMO', 'I02': 'AMORT_FAM', 'I03': 'IMMOBILISATIONS', 'I19': 'ANAL_FAMILLES',
        'T04': 'ENTETES', 'T05': 'ECHEANCES', 'T06': 'PREVISIONS',
        'T08': 'ABONNEMENTS', 'T09': 'BANQUES', 'T10': 'PARAMETRES', 'T19': 'ANAL_LIENS',
        'CC': 'CAISSE_ENTETES', 'CD': 'CAISSE_LIGNES', 'CE': 'CAISSE_REGLEMENTS',
        'CF7': 'MP_FAMILLES', 'CF8': 'MP_MODELES', 'CF9': 'MP_ARTICLES',
        'CFA': 'MP_DERNIERS_PRIX', 'CFF': 'MP_ENREGISTREMENTS',
    }
    for p in sorted(prefixes.keys(), key=len, reverse=True):
        if code.startswith(p):
            return prefixes[p]
    return 'GENERAL'

articles = []
seen = set()
errors = block_re.findall(content)

for code, body in errors:
    if code in seen:
        continue
    seen.add(code)

    lines = [l.strip() for l in body.split('\n') if l.strip() and len(l.strip()) > 3]

    anomalie_line = next((l for l in lines if 'Anomalie' in l or 'anomalie' in l), '')
    fichier_line  = next((l for l in lines if 'Structure' in l or 'Fichier' in l), '')

    # Nature
    nature_lines = []
    in_nature = False
    for l in lines:
        if 'Nature de l' in l:
            in_nature = True
            continue
        if in_nature:
            if 'Correction' in l or l.startswith('Le journal Supporia') and len(nature_lines) > 1:
                break
            nature_lines.append(l)
        if len(nature_lines) >= 5:
            break
    nature = ' '.join(nature_lines)[:500]

    # Corrections
    corr_man = ''; corr_auto = ''
    in_man = False; in_auto = False
    corr_man_lines = []; corr_auto_lines = []
    for l in lines:
        if 'Correction manuelle' in l:
            in_man = True; in_auto = False; continue
        if 'Correction automatique' in l:
            in_auto = True; in_man = False; continue
        if in_man and len(corr_man_lines) < 3:
            corr_man_lines.append(l)
        if in_auto and len(corr_auto_lines) < 3:
            corr_auto_lines.append(l)
    corr_man  = ' '.join(corr_man_lines)[:300]
    corr_auto = ' '.join(corr_auto_lines)[:300]

    title = clean(anomalie_line or fichier_line or f'Anomalie code Supporia {code}')
    if len(title) > 110:
        title = title[:110]

    cat     = get_categorie(code)
    sous_cat = get_sous_cat(code)

    crit = 'P2'
    nature_lower = nature.lower()
    if any(x in nature_lower for x in ['n existe pas', "n'existe pas", 'inexistant', 'incohérent', 'absent']):
        crit = 'P1'

    corr_man_txt  = corr_man  if corr_man  and 'aucune' not in corr_man.lower()[:10]  else 'Aucune correction manuelle disponible. Contacter le support Sage.'
    corr_auto_txt = corr_auto if corr_auto and 'aucune' not in corr_auto.lower()[:10] else 'Aucune correction automatique disponible pour ce code.'

    tags_list = ['supporia', code.lower(), sous_cat.lower().replace('_', '-'),
                 cat.lower().replace('_', '-'), 'erreur', 'coherence']
    tags = ','.join(tags_list[:8])
    mots = f"supporia erreur {code} {sous_cat.lower().replace('_',' ')} anomalie correction"

    art = {
        'codeArticle': code,
        'categorie': cat,
        'sousCategorie': sous_cat,
        'titreFr': title,
        'symptomesFr': (clean(anomalie_line) + '. ' + clean(fichier_line))[:300] if anomalie_line else f'Le journal Supporia signale une anomalie code {code} sur le fichier {sous_cat}.',
        'causesFr': clean(nature)[:400] if nature else f'Incohérence détectée dans le fichier {sous_cat} de la base Sage.',
        'prerequisFr': 'Effectuer une sauvegarde préalable de la base. Lancer les Tests de cohérence dans Supporia (menu Traitement).',
        'solutionDebutFr': f'1. Ouvrir Supporia et charger la base Sage.\n2. Menu Traitement > Tests de cohérence.\n3. Repérer le code {code} dans le journal Supporia.\n4. Analyser la description : {clean(anomalie_line)[:150]}',
        'solutionInterFr': f'5. Correction manuelle : {corr_man_txt[:250]}\n6. Relancer les tests de cohérence pour vérifier la correction.\n7. Contrôler le fichier {fichier_line or sous_cat} depuis le menu Structure.\n8. Si persistance, vérifier les données liées dans la base Sage.',
        'solutionExpertFr': f'9. Correction automatique : {corr_auto_txt[:250]}\n10. Via SQL Server : analyser la table correspondante ({sous_cat}).\n11. Vérifier les contraintes d\'intégrité référentielle.\n12. Archiver le journal Supporia avant fermeture du dossier.',
        'tags': tags,
        'motsClesFr': mots[:200],
        'criticiteDefaut': crit,
        'niveauDifficulte': 'INTERMEDIAIRE',
        'necessite_acces_sql': False,
        'necessite_rdv': False,
        'source': 'MANUEL'
    }
    articles.append(art)

print(f'Articles générés: {len(articles)}')
with open(r'D:\kasoft-platform\OptiCRM\kb_supporia_errors.json', 'w', encoding='utf-8') as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)
print('Fichier sauvegardé.')

cats = {}
for a in articles:
    cats[a['categorie']] = cats.get(a['categorie'], 0) + 1
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {c}: {n}')

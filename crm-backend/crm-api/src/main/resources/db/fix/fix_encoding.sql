-- ============================================================
-- Fix encoding issues in reference_data table
-- Characters like é, è, ê were corrupted during initial insert
-- ============================================================

-- Fix Société d'affectation
UPDATE reference_data SET label = N'Odyssée', ref_value = N'Odyssée'
WHERE category = 'SOCIETE_AFFECTATION' AND ref_value LIKE '%Odyss%';

UPDATE reference_data SET label = N'Sanitaire AL Boughaze'
WHERE category = 'SOCIETE_AFFECTATION' AND ref_value LIKE '%Sanitaire%';

-- Fix Type de compte ODYSSÉE
UPDATE reference_data SET label = N'Revendeur spécialisé sanitaire'
WHERE category = 'TYPE_COMPTE_ODYSSEE' AND ref_value = 'REVENDEUR_SPECIALISE';

UPDATE reference_data SET label = N'Installateur / Plombier'
WHERE category = 'TYPE_COMPTE_ODYSSEE' AND ref_value = 'INSTALLATEUR_PLOMBIER';

UPDATE reference_data SET label = N'Distributeur BTP'
WHERE category = 'TYPE_COMPTE_ODYSSEE' AND ref_value = 'DISTRIBUTEUR_BTP';

UPDATE reference_data SET label = N'Canal moderne'
WHERE category = 'TYPE_COMPTE_ODYSSEE' AND ref_value = 'CANAL_MODERNE';

-- Fix Catégorie client (au cas où)
UPDATE reference_data SET label = N'Particulier'
WHERE category = 'CATEGORIE_CLIENT' AND ref_value = 'PARTICULIER';

UPDATE reference_data SET label = N'Promoteur immobilier'
WHERE category = 'CATEGORIE_CLIENT' AND ref_value = 'PROMOTEUR';

-- Fix Type de compte
UPDATE reference_data SET label = N'Négociant effectuant import export'
WHERE category = 'TYPE_COMPTE' AND label LIKE '%gociant%';

-- Fix accounts table - societeAffectation field
UPDATE accounts SET societe_affectation = N'Odyssée'
WHERE societe_affectation LIKE '%Odyss%' AND societe_affectation <> N'Odyssée';

PRINT 'Encoding fix completed successfully.';

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V70: Seed demo chantiers géolocalisés pour test de la carte
-- 12 chantiers répartis sur les principales villes du Maroc
-- Insérés uniquement si la table est vide (évite les doublons en démo)

IF NOT EXISTS (SELECT 1 FROM chantiers)
BEGIN

DECLARE @admin_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM users ORDER BY created_at);

INSERT INTO chantiers (
    id, nom, ville, prefecture, adresse,
    latitude, longitude,
    type_projet, sous_type_projet,
    nombre_unites,
    stade_chantier,
    niveau_opportunite, concurrent_ferme,
    statut_chantier,
    action_suivante, date_prochaine_action,
    temoin,
    assigned_to_id, created_by_id,
    created_at, updated_at
)
VALUES

-- 1. Casablanca — Résidentiel haut standing
(NEWID(), 'Résidence Anfa Prestige', 'Casablanca', 'Casablanca-Settat',
 'Bd d''Anfa, Ain Diab, Casablanca',
 33.5942, -7.6598,
 'RESIDENTIEL_COLLECTIF', 'HAUT_STANDING', 120,
 'PHASE_EQUIPEMENT',
 'PARTIELLEMENT_OUVERT', NULL,
 'PRIORITAIRE',
 'Relancer architecte pour validation robinetterie', '2026-04-05',
 1,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 2. Casablanca — Logement social
(NEWID(), 'Programme Hay Moulay Rachid B7', 'Casablanca', 'Casablanca-Settat',
 'Hay Moulay Rachid, Casablanca',
 33.5253, -7.6418,
 'RESIDENTIEL_COLLECTIF', 'LOGEMENT_SOCIAL', 320,
 'GROS_OEUVRE',
 'LIBRE', NULL,
 'ACTIF',
 'Déposer dossier technique sanitaires', '2026-04-10',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 3. Rabat — Tertiaire bureaux
(NEWID(), 'Tour Bab Riad Business Center', 'Rabat', 'Rabat-Salé-Kénitra',
 'Avenue Annakhil, Hay Riad, Rabat',
 33.9493, -6.8588,
 'TERTIAIRE_INSTITUTIONNEL', 'BUREAUX', 45,
 'SECOND_OEUVRE',
 'FERME', 'Grohe',
 'ACTIF',
 'Proposer alternative gamme premium concurrentielle', '2026-04-08',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 4. Marrakech — Hôtel
(NEWID(), 'Hôtel Palmeraie Luxury Resort', 'Marrakech', 'Marrakech-Safi',
 'Route de la Palmeraie, Marrakech',
 31.6766, -7.9505,
 'TERTIAIRE_INSTITUTIONNEL', 'HOTEL', 180,
 'PHASE_EQUIPEMENT',
 'LIBRE', NULL,
 'PRIORITAIRE',
 'Présenter showroom robinetterie hôtelière', '2026-04-03',
 1,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 5. Tanger — Résidentiel moyen standing
(NEWID(), 'Résidence Cap Spartel', 'Tanger', 'Tanger-Tétouan-Al Hoceïma',
 'Route de Cap Spartel, Tanger',
 35.7720, -5.9154,
 'RESIDENTIEL_COLLECTIF', 'MOYEN_STANDING', 85,
 'AUTORISATION',
 'LIBRE', NULL,
 'ACTIF',
 'Premier contact bureau d''études', '2026-04-15',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 6. Fès — Logement social
(NEWID(), 'Cité Narjiss Fès Phase 2', 'Fès', 'Fès-Meknès',
 'Route Ain Chkef, Fès',
 34.0070, -4.9998,
 'RESIDENTIEL_COLLECTIF', 'LOGEMENT_SOCIAL', 250,
 'SECOND_OEUVRE',
 'PARTIELLEMENT_OUVERT', NULL,
 'ACTIF',
 'Rencontre promoteur pour prescription', '2026-04-07',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 7. Agadir — Résidentiel villas
(NEWID(), 'Domaine Agadir Bay Villas', 'Agadir', 'Souss-Massa',
 'Route Tilila, Agadir',
 30.4270, -9.5810,
 'RESIDENTIEL_INDIVIDUEL', 'VILLAS', 32,
 'GROS_OEUVRE',
 'LIBRE', NULL,
 'ACTIF',
 'Soumettre offre robinetterie + SDB complète', '2026-04-12',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 8. Kénitra — Commercial
(NEWID(), 'Centre Commercial Kenitra Mall', 'Kénitra', 'Rabat-Salé-Kénitra',
 'Boulevard Mohammed V, Kénitra',
 34.2555, -6.5800,
 'COMMERCIAL', 'CENTRE_COMMERCIAL', 0,
 'ETUDE_CONCEPTION',
 'LIBRE', NULL,
 'ACTIF',
 'Récupérer plans sanitaires auprès BET', '2026-04-20',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 9. Meknès — Santé
(NEWID(), 'Clinique Privée Al Amal Meknès', 'Meknès', 'Fès-Meknès',
 'Av. Moulay Idriss II, Meknès',
 33.8934, -5.5473,
 'TERTIAIRE_INSTITUTIONNEL', 'SANTE', 0,
 'PHASE_EQUIPEMENT',
 'PARTIELLEMENT_OUVERT', NULL,
 'PRIORITAIRE',
 'Proposer gamme médicale spécialisée', '2026-04-06',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 10. Oujda — Logement moyen standing
(NEWID(), 'Résidence Oujda Garden City', 'Oujda', 'Oriental',
 'Route de Sidi Maâfar, Oujda',
 34.6821, -1.9120,
 'RESIDENTIEL_COLLECTIF', 'MOYEN_STANDING', 96,
 'SECOND_OEUVRE',
 'LIBRE', NULL,
 'ACTIF',
 'Visiter chantier et rencontrer chef de travaux', '2026-04-14',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 11. El Jadida — Résidentiel haut standing (GAGNÉ)
(NEWID(), 'Résidence Mazagan Pearl', 'El Jadida', 'Casablanca-Settat',
 'Front de mer, El Jadida',
 33.2317, -8.4997,
 'RESIDENTIEL_COLLECTIF', 'HAUT_STANDING', 60,
 'LIVRAISON',
 'FERME', 'Roca',
 'GAGNE',
 'Suivi SAV livraison finale', '2026-04-01',
 1,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE()),

-- 12. Tétouan — Résidentiel collectif
(NEWID(), 'Programme Martil Brise de Mer', 'Martil', 'Tanger-Tétouan-Al Hoceïma',
 'Avenue Hassan II, Martil',
 35.6196, -5.2701,
 'RESIDENTIEL_COLLECTIF', 'MOYEN_STANDING', 72,
 'GROS_OEUVRE',
 'LIBRE', NULL,
 'ACTIF',
 'Rendez-vous architecte la semaine prochaine', '2026-04-09',
 0,
 @admin_id, @admin_id,
 GETUTCDATE(), GETUTCDATE());

END
GO

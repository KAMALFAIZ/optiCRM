SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V11: Données de démonstration — Terrain (volumétrique)
-- Par utilisateur COMMERCIAL existant :
--   10 visites, 20 tournées, 15 notes de frais, 20 activités
-- Utilise les comptes/contacts déjà assignés à chaque commercial
-- =====================================================

DECLARE
    @v_admin_id UNIQUEIDENTIFIER,
    @v_user_id UNIQUEIDENTIFIER,
    @v_first_name NVARCHAR(100),
    @v_last_name NVARCHAR(100),
    @v_user_idx INT = 0,

    -- Variables de travail
    @v_visit_id UNIQUEIDENTIFIER,
    @v_tour_id UNIQUEIDENTIFIER,
    @v_er_id UNIQUEIDENTIFIER,
    @v_act_id UNIQUEIDENTIFIER,
    @v_line_id UNIQUEIDENTIFIER,

    -- Comptes/contacts du commercial courant
    @v_acc_id UNIQUEIDENTIFIER,
    @v_ct_id UNIQUEIDENTIFIER,

    -- Compteurs
    @i INT,
    @j INT,
    @v_city_idx INT,
    @v_visit_order INT,

    -- GPS
    @v_lat DECIMAL(10,8),
    @v_lng DECIMAL(11,8),
    @v_city NVARCHAR(100),

    -- Notes de frais
    @v_total DECIMAL(15,2),
    @v_amount DECIMAL(15,2),
    @v_nb_lines INT,
    @v_tour_support_id UNIQUEIDENTIFIER,

    -- Compteurs de visites pour tour_visits
    @v_visit_id_1 UNIQUEIDENTIFIER,
    @v_visit_id_2 UNIQUEIDENTIFIER,
    @v_visit_id_3 UNIQUEIDENTIFIER,
    @v_visit_id_4 UNIQUEIDENTIFIER,
    @v_visit_id_5 UNIQUEIDENTIFIER,
    @v_visit_id_6 UNIQUEIDENTIFIER,
    @v_visit_id_7 UNIQUEIDENTIFIER,
    @v_visit_id_8 UNIQUEIDENTIFIER,
    @v_visit_id_9 UNIQUEIDENTIFIER,
    @v_visit_id_10 UNIQUEIDENTIFIER;

-- Villes et coordonnées GPS (Maroc)
DECLARE @cities TABLE (idx INT, city NVARCHAR(100), lat DECIMAL(10,8), lng DECIMAL(11,8));
INSERT INTO @cities VALUES
(1,'Casablanca',33.5731,-7.5898),
(2,'Rabat',34.0209,-6.8416),
(3,'Marrakech',31.6295,-7.9811),
(4,'Tanger',35.7595,-5.8340),
(5,'Fès',34.0331,-5.0003),
(6,'Meknès',33.8935,-5.5473),
(7,'Agadir',30.4278,-9.5981),
(8,'Oujda',34.6814,-1.9086),
(9,'Kénitra',34.2610,-6.5802),
(10,'Tétouan',35.5889,-5.3626),
(11,'Mohammedia',33.6866,-7.3828),
(12,'Salé',34.0531,-6.8138),
(13,'El Jadida',33.2316,-8.5007),
(14,'Béni Mellal',32.3373,-6.3498),
(15,'Nador',35.1688,-2.9286);

DECLARE @addresses TABLE (idx INT, addr NVARCHAR(255));
INSERT INTO @addresses VALUES
(1,'Bd Mohammed V'),(2,'Av Hassan II'),(3,'Rue Souika'),(4,'Bd Zerktouni'),(5,'Av des FAR'),
(6,'Rue de la Liberté'),(7,'Bd Pasteur'),(8,'Av Allal Ben Abdellah'),(9,'Bd Moulay Ismaïl'),(10,'Rue Ibn Batouta'),
(11,'Av Mohammed VI'),(12,'Bd Ghandi'),(13,'Rue Abou Inane'),(14,'Av Moulay Abdellah'),(15,'Bd de la Résistance'),
(16,'Rue Ahmed Chaouki'),(17,'Bd Bir Anzarane'),(18,'Av Al Massira'),(19,'Rue Tarik Ibn Ziad'),(20,'Bd Rachidi');

DECLARE @visit_subjects TABLE (idx INT, subject NVARCHAR(255));
INSERT INTO @visit_subjects VALUES
(1,'Présentation catalogue produits'),(2,'Suivi commande en cours'),(3,'Support technique sur site'),
(4,'Négociation contrat annuel'),(5,'Démonstration nouvelle gamme'),(6,'Revue trimestrielle des ventes'),
(7,'Audit qualité chez le client'),(8,'Formation équipe client'),(9,'Livraison échantillons'),
(10,'Closing — signature contrat');

DECLARE @act_subjects TABLE (idx INT, subject NVARCHAR(255), act_type NVARCHAR(50));
INSERT INTO @act_subjects VALUES
(1,'Appel de suivi post-visite','call'),(2,'Email offre commerciale','email'),(3,'Réunion stratégique équipe','meeting'),
(4,'Préparer présentation trimestrielle','task'),(5,'Déjeuner networking','lunch'),(6,'Démo solution à distance','demo'),
(7,'Relance téléphonique devis','call'),(8,'Point hebdomadaire manager','meeting'),(9,'Envoi catalogue mis à jour','email'),
(10,'Mise à jour fiches CRM','task'),(11,'Appel qualification lead','call'),(12,'Démonstration sur site','demo'),
(13,'Réunion négociation contrat','meeting'),(14,'Email remerciement post-visite','email'),(15,'Déjeuner partenaire stratégique','lunch'),
(16,'Préparer rapport mensuel','task'),(17,'Appel SAV réclamation','call'),(18,'Réunion bilan mensuel','meeting'),
(19,'Webinaire produit nouveau','demo'),(20,'Compte-rendu de visite','email');

DECLARE @er_titles TABLE (idx INT, title NVARCHAR(255));
INSERT INTO @er_titles VALUES
(1,'Déplacement client'),(2,'Frais tournée hebdo'),(3,'Salon professionnel'),
(4,'Déjeuner prospect'),(5,'Hébergement mission terrain'),(6,'Formation client sur site'),
(7,'Conférence sectorielle'),(8,'Réunion inter-régionale'),(9,'Visite usine fournisseur'),
(10,'Prospection zone industrielle'),(11,'Frais kilométriques semaine'),(12,'Repas équipe terrain'),
(13,'Fournitures commerciales'),(14,'Transport aéroport client'),(15,'Parking et péages tournée');

DECLARE @expense_cats TABLE (idx INT, cat NVARCHAR(50));
INSERT INTO @expense_cats VALUES
(1,'transport'),(2,'repas'),(3,'hebergement'),(4,'fournitures'),(5,'telecommunication'),
(6,'parking'),(7,'peage'),(8,'carburant');

DECLARE @expense_descs TABLE (idx INT, descr NVARCHAR(255));
INSERT INTO @expense_descs VALUES
(1,'Taxi aéroport — centre-ville'),(2,'Déjeuner avec client au restaurant'),(3,'Nuit hôtel — mission terrain'),
(4,'Cartes de visite et brochures'),(5,'Forfait data mobile terrain'),(6,'Parking centre commercial'),
(7,'Péage autoroute'),(8,'Plein carburant véhicule service'),(9,'Petit-déjeuner réunion matinale'),
(10,'Location salle de réunion');

DECLARE @visit_statuses TABLE (idx INT, status NVARCHAR(50));
INSERT INTO @visit_statuses VALUES
(1,'completed'),(2,'completed'),(3,'completed'),(4,'completed'),(5,'completed'),
(6,'completed'),(7,'completed'),(8,'planned'),(9,'planned'),(10,'planned');

DECLARE @visit_outcomes TABLE (idx INT, outcome NVARCHAR(50));
INSERT INTO @visit_outcomes VALUES
(1,'positive'),(2,'neutral'),(3,'positive'),(4,'positive'),(5,'negative'),
(6,'neutral'),(7,'positive'),(8,NULL),(9,NULL),(10,NULL);

DECLARE @visit_transport TABLE (idx INT, transport NVARCHAR(50));
INSERT INTO @visit_transport VALUES
(1,'voiture'),(2,'voiture'),(3,'transport_en_commun'),(4,'voiture'),(5,'voiture'),
(6,'moto'),(7,'voiture'),(8,'transport_en_commun'),(9,'voiture'),(10,'voiture');

DECLARE @visit_interest TABLE (idx INT, level NVARCHAR(20));
INSERT INTO @visit_interest VALUES
(1,'high'),(2,'medium'),(3,'high'),(4,'low'),(5,'medium'),
(6,'high'),(7,'low'),(8,'medium'),(9,'high'),(10,'medium');

DECLARE @visit_types TABLE (idx INT, vtype NVARCHAR(50));
INSERT INTO @visit_types VALUES
(1,'prospection'),(2,'follow_up'),(3,'technical'),(4,'support'),(5,'proposal'),
(6,'prospection'),(7,'follow_up'),(8,'technical'),(9,'support'),(10,'proposal');

PRINT '=== V11: Insertion données terrain pour tous les commerciaux ===';

-- Récupérer l'admin
SELECT @v_admin_id = id FROM users WHERE email = 'admin@opticrm.com';
IF @v_admin_id IS NULL
BEGIN
    RAISERROR('Admin user not found', 16, 1);
    RETURN;
END

-- =======================================================
-- BOUCLE SUR CHAQUE COMMERCIAL EXISTANT
-- =======================================================
DECLARE user_cursor CURSOR FOR
    SELECT u.id, u.first_name, u.last_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'COMMERCIAL' AND u.is_active = 1
    ORDER BY u.created_at;

OPEN user_cursor;
FETCH NEXT FROM user_cursor INTO @v_user_id, @v_first_name, @v_last_name;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @v_user_idx = @v_user_idx + 1;
    SET @v_city_idx = ((@v_user_idx - 1) % 15) + 1;

    SELECT @v_city = city, @v_lat = lat, @v_lng = lng
    FROM @cities WHERE idx = @v_city_idx;

    PRINT '--- [' + CAST(@v_user_idx AS NVARCHAR) + '] ' + @v_first_name + ' ' + @v_last_name + ' ---';

    -- Compte par défaut pour ce commercial
    SELECT TOP 1 @v_acc_id = id FROM accounts WHERE assigned_to_id = @v_user_id ORDER BY name;
    IF @v_acc_id IS NULL
        SELECT TOP 1 @v_acc_id = id FROM accounts ORDER BY name;

    -- Contact par défaut pour ce commercial
    SELECT TOP 1 @v_ct_id = id FROM contacts WHERE assigned_to_id = @v_user_id ORDER BY last_name;
    IF @v_ct_id IS NULL
        SELECT TOP 1 @v_ct_id = id FROM contacts ORDER BY last_name;

    -- ===================================================
    -- VISITES (10 par commercial)
    -- ===================================================
    SET @v_visit_id_1 = NEWID(); SET @v_visit_id_2 = NEWID(); SET @v_visit_id_3 = NEWID();
    SET @v_visit_id_4 = NEWID(); SET @v_visit_id_5 = NEWID(); SET @v_visit_id_6 = NEWID();
    SET @v_visit_id_7 = NEWID(); SET @v_visit_id_8 = NEWID(); SET @v_visit_id_9 = NEWID();
    SET @v_visit_id_10 = NEWID();

    SET @i = 1;
    WHILE @i <= 10
    BEGIN
        SET @v_visit_id = CASE @i
            WHEN 1 THEN @v_visit_id_1 WHEN 2 THEN @v_visit_id_2 WHEN 3 THEN @v_visit_id_3
            WHEN 4 THEN @v_visit_id_4 WHEN 5 THEN @v_visit_id_5 WHEN 6 THEN @v_visit_id_6
            WHEN 7 THEN @v_visit_id_7 WHEN 8 THEN @v_visit_id_8 WHEN 9 THEN @v_visit_id_9
            ELSE @v_visit_id_10 END;

        DECLARE @addr_idx INT = ((@v_user_idx + @i - 1) % 20) + 1;
        DECLARE @v_addr NVARCHAR(255); SELECT @v_addr = addr FROM @addresses WHERE idx = @addr_idx;
        DECLARE @v_subj NVARCHAR(255); SELECT @v_subj = subject FROM @visit_subjects WHERE idx = @i;
        DECLARE @v_vstatus NVARCHAR(50); SELECT @v_vstatus = status FROM @visit_statuses WHERE idx = @i;
        DECLARE @v_voutcome NVARCHAR(50); SELECT @v_voutcome = outcome FROM @visit_outcomes WHERE idx = @i;
        DECLARE @v_vtransport NVARCHAR(50); SELECT @v_vtransport = transport FROM @visit_transport WHERE idx = @i;
        DECLARE @v_vinterest NVARCHAR(20); SELECT @v_vinterest = level FROM @visit_interest WHERE idx = @i;
        DECLARE @v_vtype NVARCHAR(50); SELECT @v_vtype = vtype FROM @visit_types WHERE idx = (@i % 5) + 1;
        DECLARE @v_vdate DATETIME2 = DATEADD(minute, @i * 30, DATEADD(day, (@v_user_idx - 1) * 3 + @i, '2026-02-01 09:00:00'));
        DECLARE @v_checkin DATETIME2 = CASE WHEN @i <= 7 THEN @v_vdate ELSE NULL END;
        DECLARE @v_checkout DATETIME2 = CASE WHEN @i <= 7 THEN DATEADD(minute, 30 + @i * 5, @v_vdate) ELSE NULL END;
        DECLARE @v_satisfaction INT = CASE WHEN @i <= 7 THEN 3 + (@i % 3) ELSE NULL END;

        INSERT INTO visits (
            id, contact_id, account_id, visit_type, subject, description,
            visit_date, duration, status, latitude, longitude, address, city,
            check_in_at, check_out_at, notes, outcome, next_action,
            objective, interest_level, satisfaction, transport_mode, mileage,
            assigned_to_id, created_by_id
        ) VALUES (
            @v_visit_id,
            @v_ct_id,
            @v_acc_id,
            @v_vtype,
            @v_subj,
            'Visite planifiée dans le cadre du suivi commercial terrain.',
            @v_vdate,
            30 + (@i * 5),
            @v_vstatus,
            @v_lat + (@i * 0.003),
            @v_lng + (@i * 0.002),
            @v_addr + ', ' + @v_city,
            @v_city,
            @v_checkin,
            @v_checkout,
            'Visite effectuée conformément au planning.',
            @v_voutcome,
            'Relancer par email sous 48h.',
            'Renforcer la relation commerciale et détecter de nouvelles opportunités.',
            @v_vinterest,
            @v_satisfaction,
            @v_vtransport,
            ROUND(10 + RAND() * 50, 1),
            @v_user_id,
            @v_user_id
        );

        SET @i = @i + 1;
    END;
    PRINT '  10 visites';

    -- ===================================================
    -- TOURNÉES (20 par commercial)
    -- ===================================================
    DECLARE @tour_statuses TABLE (idx INT, status NVARCHAR(50));
    DELETE FROM @tour_statuses;
    INSERT INTO @tour_statuses VALUES
    (1,'completed'),(2,'completed'),(3,'completed'),(4,'completed'),(5,'completed'),
    (6,'completed'),(7,'completed'),(8,'completed'),(9,'completed'),(10,'completed'),
    (11,'completed'),(12,'completed'),(13,'completed'),(14,'completed'),(15,'completed'),
    (16,'in_progress'),(17,'in_progress'),(18,'planned'),(19,'planned'),(20,'draft');

    DECLARE @tour_zones TABLE (idx INT, zone NVARCHAR(50));
    DELETE FROM @tour_zones;
    INSERT INTO @tour_zones VALUES
    (1,'Nord'),(2,'Sud'),(3,'Est'),(4,'Ouest'),(5,'Centre'),
    (6,'Nord'),(7,'Sud'),(8,'Est'),(9,'Ouest'),(10,'Centre'),
    (11,'Nord'),(12,'Sud'),(13,'Est'),(14,'Ouest'),(15,'Centre'),
    (16,'Nord'),(17,'Sud'),(18,'Est'),(19,'Ouest'),(20,'Centre');

    DECLARE @tour_types TABLE (idx INT, ttype NVARCHAR(50));
    DELETE FROM @tour_types;
    INSERT INTO @tour_types VALUES
    (1,'hebdomadaire'),(2,'bi-mensuelle'),(3,'mensuelle'),(4,'spéciale'),
    (5,'hebdomadaire'),(6,'bi-mensuelle'),(7,'mensuelle'),(8,'spéciale'),
    (9,'hebdomadaire'),(10,'bi-mensuelle'),(11,'mensuelle'),(12,'spéciale'),
    (13,'hebdomadaire'),(14,'bi-mensuelle'),(15,'mensuelle'),(16,'spéciale'),
    (17,'hebdomadaire'),(18,'bi-mensuelle'),(19,'mensuelle'),(20,'spéciale');

    DECLARE @vehicle_types TABLE (idx INT, vtype NVARCHAR(50));
    DELETE FROM @vehicle_types;
    INSERT INTO @vehicle_types VALUES (1,'voiture_service'),(2,'voiture_personnelle');

    SET @i = 1;
    WHILE @i <= 20
    BEGIN
        SET @v_tour_id = NEWID();

        DECLARE @t_zone NVARCHAR(50); SELECT @t_zone = zone FROM @tour_zones WHERE idx = @i;
        DECLARE @t_status NVARCHAR(50); SELECT @t_status = status FROM @tour_statuses WHERE idx = @i;
        DECLARE @t_type NVARCHAR(50); SELECT @t_type = ttype FROM @tour_types WHERE idx = @i;
        DECLARE @t_vehicle NVARCHAR(50); SELECT @t_vehicle = vtype FROM @vehicle_types WHERE idx = ((@v_user_idx + @i) % 2) + 1;
        DECLARE @addr_s_idx INT = ((@v_user_idx - 1) % 20) + 1;
        DECLARE @addr_e_idx INT = ((@v_user_idx + 4) % 20) + 1;
        DECLARE @t_addr_s NVARCHAR(255); SELECT @t_addr_s = addr FROM @addresses WHERE idx = @addr_s_idx;
        DECLARE @t_addr_e NVARCHAR(255); SELECT @t_addr_e = addr FROM @addresses WHERE idx = @addr_e_idx;
        DECLARE @t_total_visits INT = CASE WHEN @i <= 15 THEN 3 + (@i % 4) ELSE 0 END;
        DECLARE @t_comp_visits INT = CASE WHEN @i <= 15 THEN 2 + (@i % 3) ELSE 0 END;
        DECLARE @t_result NVARCHAR(MAX) = CASE WHEN @i <= 15 THEN 'Objectifs atteints — ' + CAST(2 + @i % 3 AS NVARCHAR) + ' prospects qualifiés.' ELSE NULL END;
        DECLARE @t_date DATE = DATEADD(day, (@v_user_idx - 1) * 3 + @i, DATEADD(day, (@i - 1) * 2, '2026-01-15'));
        DECLARE @t_start_time DATETIME2 = CASE WHEN @i <= 17 THEN CAST(CAST(@t_date AS NVARCHAR) + ' 08:00:00' AS DATETIME2) ELSE NULL END;
        DECLARE @t_end_time DATETIME2 = CASE WHEN @i <= 15 THEN CAST(CAST(@t_date AS NVARCHAR) + ' 17:30:00' AS DATETIME2) ELSE NULL END;

        INSERT INTO tours (
            id, name, description, tour_date, status, region,
            assigned_to_id, total_visits, completed_visits, total_distance,
            start_address, end_address, notes, objective, tour_result,
            estimated_revenue, vehicle_type, fuel_cost, total_expenses,
            start_time, end_time,
            start_latitude, start_longitude, end_latitude, end_longitude,
            created_by_id
        ) VALUES (
            @v_tour_id,
            'Tournée ' + @t_zone + ' #' + CAST(@i AS NVARCHAR) + ' — ' + @v_first_name,
            'Tournée commerciale ' + @t_type + ' — secteur ' + @v_city,
            @t_date,
            @t_status,
            @v_city,
            @v_user_id,
            @t_total_visits,
            @t_comp_visits,
            ROUND(50 + RAND() * 200, 1),
            @t_addr_s + ', ' + @v_city,
            @t_addr_e + ', ' + @v_city,
            'Tournée effectuée dans de bonnes conditions.',
            'Couvrir le maximum de clients et détecter des opportunités.',
            @t_result,
            ROUND(5000 + RAND() * 30000, 2),
            @t_vehicle,
            ROUND(100 + RAND() * 300, 2),
            ROUND(200 + RAND() * 500, 2),
            @t_start_time,
            @t_end_time,
            @v_lat,
            @v_lng,
            @v_lat + (@i * 0.005),
            @v_lng + (@i * 0.004),
            @v_user_id
        );

        -- Associer 2 visites aux 5 premières tournées
        IF @i <= 5
        BEGIN
            DECLARE @vis1 UNIQUEIDENTIFIER = CASE ((@i - 1) * 2) % 10 + 1
                WHEN 1 THEN @v_visit_id_1 WHEN 2 THEN @v_visit_id_2 WHEN 3 THEN @v_visit_id_3
                WHEN 4 THEN @v_visit_id_4 WHEN 5 THEN @v_visit_id_5 WHEN 6 THEN @v_visit_id_6
                WHEN 7 THEN @v_visit_id_7 WHEN 8 THEN @v_visit_id_8 WHEN 9 THEN @v_visit_id_9
                ELSE @v_visit_id_10 END;
            DECLARE @vis2 UNIQUEIDENTIFIER = CASE ((@i - 1) * 2 + 1) % 10 + 1
                WHEN 1 THEN @v_visit_id_1 WHEN 2 THEN @v_visit_id_2 WHEN 3 THEN @v_visit_id_3
                WHEN 4 THEN @v_visit_id_4 WHEN 5 THEN @v_visit_id_5 WHEN 6 THEN @v_visit_id_6
                WHEN 7 THEN @v_visit_id_7 WHEN 8 THEN @v_visit_id_8 WHEN 9 THEN @v_visit_id_9
                ELSE @v_visit_id_10 END;
            IF @vis1 <> @vis2
            BEGIN
                INSERT INTO tour_visits (tour_id, visit_id, visit_order) VALUES (@v_tour_id, @vis1, 1);
                INSERT INTO tour_visits (tour_id, visit_id, visit_order) VALUES (@v_tour_id, @vis2, 2);
            END
        END;

        SET @i = @i + 1;
    END;
    PRINT '  20 tournées';

    -- ===================================================
    -- NOTES DE FRAIS (15 par commercial)
    -- ===================================================
    DECLARE @er_statuses TABLE (idx INT, status NVARCHAR(20));
    DELETE FROM @er_statuses;
    INSERT INTO @er_statuses VALUES
    (1,'APPROVED'),(2,'APPROVED'),(3,'APPROVED'),(4,'APPROVED'),(5,'APPROVED'),
    (6,'APPROVED'),(7,'APPROVED'),(8,'APPROVED'),(9,'APPROVED'),(10,'APPROVED'),
    (11,'DRAFT'),(12,'DRAFT'),(13,'DRAFT'),(14,'APPROVED'),(15,'APPROVED');

    SET @i = 1;
    WHILE @i <= 15
    BEGIN
        SET @v_er_id = NEWID();
        SET @v_tour_support_id = NEWID();

        DECLARE @er_status NVARCHAR(20); SELECT @er_status = status FROM @er_statuses WHERE idx = @i;
        DECLARE @er_title NVARCHAR(255); SELECT @er_title = title FROM @er_titles WHERE idx = @i;
        DECLARE @er_date DATE = DATEADD(day, (@v_user_idx - 1) * 2 + @i, DATEADD(day, (@i - 1) * 3, '2026-01-10'));
        DECLARE @er_submitted DATETIME2 = CASE WHEN @i <= 10 THEN DATEADD(day, @i * 2, '2026-02-01') ELSE NULL END;
        DECLARE @er_approved DATETIME2 = CASE WHEN @i <= 10 THEN DATEADD(day, @i * 2, '2026-02-05') ELSE NULL END;
        DECLARE @er_approver UNIQUEIDENTIFIER = CASE WHEN @i <= 10 THEN @v_admin_id ELSE NULL END;
        DECLARE @er_num NVARCHAR(50) = 'NDF-' + RIGHT('0' + CAST(@v_user_idx AS NVARCHAR), 2) + '-' +
            CONVERT(NVARCHAR, DATEADD(day, @i, '2026-01-01'), 112) + '-' +
            RIGHT('0' + CAST(@i AS NVARCHAR), 2);

        INSERT INTO tours (id, name, tour_date, status, region, assigned_to_id, created_by_id)
        VALUES (
            @v_tour_support_id,
            'Tournée NdF-' + CAST(@i AS NVARCHAR) + ' ' + @v_first_name,
            @er_date,
            'completed',
            @v_city,
            @v_user_id,
            @v_user_id
        );

        INSERT INTO expense_reports (
            id, tour_id, submitted_by_id, report_number, status, title,
            description, total_amount, currency, submitted_at, approved_at,
            approved_by_id, created_by_id
        ) VALUES (
            @v_er_id,
            @v_tour_support_id,
            @v_user_id,
            @er_num,
            @er_status,
            @er_title + ' — ' + @v_city,
            'Note de frais pour déplacement professionnel.',
            0,
            'MAD',
            @er_submitted,
            @er_approved,
            @er_approver,
            @v_user_id
        );

        -- 3 à 5 lignes par note de frais
        SET @v_nb_lines = 3 + (@i % 3);
        SET @v_total = 0;
        SET @j = 1;
        WHILE @j <= @v_nb_lines
        BEGIN
            SET @v_line_id = NEWID();
            SET @v_amount = ROUND(50 + RAND() * 450, 2);
            SET @v_total = @v_total + @v_amount;

            DECLARE @ec_idx INT = ((@j + @i) % 8) + 1;
            DECLARE @ed_idx INT = ((@j + @i - 1) % 10) + 1;
            DECLARE @el_addr_idx INT = ((@j + @v_user_idx - 1) % 20) + 1;
            DECLARE @ec_cat NVARCHAR(50); SELECT @ec_cat = cat FROM @expense_cats WHERE idx = @ec_idx;
            DECLARE @ec_desc NVARCHAR(255); SELECT @ec_desc = descr FROM @expense_descs WHERE idx = @ed_idx;
            DECLARE @el_addr NVARCHAR(255); SELECT @el_addr = addr FROM @addresses WHERE idx = @el_addr_idx;
            DECLARE @el_date DATE = DATEADD(day, @j, @er_date);

            INSERT INTO expense_report_lines (
                id, expense_report_id, category, description, amount,
                expense_date, sort_order, latitude, longitude, address
            ) VALUES (
                @v_line_id,
                @v_er_id,
                @ec_cat,
                @ec_desc,
                @v_amount,
                @el_date,
                @j,
                @v_lat + (@j * 0.01),
                @v_lng + (@j * 0.01),
                @el_addr + ', ' + @v_city
            );

            SET @j = @j + 1;
        END;

        UPDATE expense_reports SET total_amount = @v_total WHERE id = @v_er_id;

        SET @i = @i + 1;
    END;
    PRINT '  15 notes de frais';

    -- ===================================================
    -- ACTIVITÉS (20 par commercial)
    -- ===================================================
    DECLARE @act_statuses TABLE (idx INT, status NVARCHAR(50));
    DELETE FROM @act_statuses;
    INSERT INTO @act_statuses VALUES
    (1,'completed'),(2,'completed'),(3,'completed'),(4,'completed'),(5,'completed'),
    (6,'completed'),(7,'completed'),(8,'completed'),(9,'completed'),(10,'completed'),
    (11,'completed'),(12,'completed'),(13,'completed'),(14,'completed'),
    (15,'planned'),(16,'planned'),(17,'planned'),(18,'in_progress'),(19,'in_progress'),(20,'planned');

    DECLARE @act_priorities TABLE (idx INT, prio NVARCHAR(20));
    DELETE FROM @act_priorities;
    INSERT INTO @act_priorities VALUES
    (1,'normal'),(2,'normal'),(3,'high'),(4,'normal'),(5,'normal'),
    (6,'high'),(7,'urgent'),(8,'normal'),(9,'normal'),(10,'normal'),
    (11,'high'),(12,'high'),(13,'urgent'),(14,'normal'),(15,'normal'),
    (16,'normal'),(17,'high'),(18,'normal'),(19,'high'),(20,'normal');

    DECLARE @act_durations TABLE (idx INT, dur INT);
    DELETE FROM @act_durations;
    INSERT INTO @act_durations VALUES
    (1,15),(2,10),(3,60),(4,30),(5,90),(6,45),(7,20),(8,60),(9,10),(10,30),
    (11,15),(12,60),(13,90),(14,10),(15,120),(16,45),(17,20),(18,60),(19,45),(20,15);

    SET @i = 1;
    WHILE @i <= 20
    BEGIN
        SET @v_act_id = NEWID();

        DECLARE @a_subj NVARCHAR(255); SELECT @a_subj = subject FROM @act_subjects WHERE idx = @i;
        DECLARE @a_type NVARCHAR(50); SELECT @a_type = act_type FROM @act_subjects WHERE idx = @i;
        DECLARE @a_status NVARCHAR(50); SELECT @a_status = status FROM @act_statuses WHERE idx = @i;
        DECLARE @a_prio NVARCHAR(20); SELECT @a_prio = prio FROM @act_priorities WHERE idx = @i;
        DECLARE @a_dur INT; SELECT @a_dur = dur FROM @act_durations WHERE idx = @i;
        DECLARE @a_addr_idx INT = ((@v_user_idx + @i - 1) % 20) + 1;
        DECLARE @a_addr NVARCHAR(255); SELECT @a_addr = addr FROM @addresses WHERE idx = @a_addr_idx;
        DECLARE @a_start DATETIME2 = DATEADD(hour, (@v_user_idx - 1) * 3 + @i, DATEADD(day, (@v_user_idx - 1) * 3 + @i, '2026-01-10 09:00:00'));
        DECLARE @a_end DATETIME2 = DATEADD(hour, 1, @a_start);
        DECLARE @a_due DATE = DATEADD(day, (@v_user_idx - 1) * 3 + @i + 2, '2026-01-10');
        DECLARE @a_completed DATETIME2 = CASE WHEN @i <= 14 THEN @a_end ELSE NULL END;
        DECLARE @a_location NVARCHAR(255) = CASE WHEN @a_type IN ('meeting','lunch','demo') THEN @a_addr + ', ' + @v_city ELSE 'Téléphone / Visioconférence' END;
        DECLARE @a_related_type NVARCHAR(50) = CASE WHEN @i % 2 = 1 THEN 'account' ELSE 'contact' END;
        DECLARE @a_related_id UNIQUEIDENTIFIER = CASE WHEN @i % 2 = 1 THEN @v_acc_id ELSE @v_ct_id END;
        DECLARE @a_call_dir NVARCHAR(20) = CASE WHEN @a_type = 'call' THEN CASE WHEN ((@i - 1) % 2) + 1 = 1 THEN 'outbound' ELSE 'inbound' END ELSE NULL END;
        DECLARE @a_call_res NVARCHAR(50) = CASE WHEN @a_type = 'call' AND @i <= 14
            THEN CASE (@i - 1) % 5 + 1 WHEN 1 THEN 'connected' WHEN 2 THEN 'voicemail' WHEN 3 THEN 'connected' WHEN 4 THEN 'busy' ELSE 'connected' END
            ELSE NULL END;
        DECLARE @a_transport NVARCHAR(50) = CASE WHEN @a_type IN ('meeting','lunch','demo') THEN 'voiture' ELSE NULL END;
        DECLARE @a_result NVARCHAR(MAX) = CASE WHEN @i <= 14 THEN 'Activité réalisée avec succès.' ELSE NULL END;

        INSERT INTO activities (
            id, activity_type, subject, description,
            start_date, end_date, due_date, completed_at, duration,
            location, status, priority,
            related_to_type, related_to_id,
            call_direction, call_result,
            objective, result, transport_mode, mileage,
            assigned_to_id, created_by_id
        ) VALUES (
            @v_act_id,
            @a_type,
            @a_subj,
            'Activité planifiée dans le cadre du suivi commercial.',
            @a_start,
            @a_end,
            @a_due,
            @a_completed,
            @a_dur,
            @a_location,
            @a_status,
            @a_prio,
            @a_related_type,
            @a_related_id,
            @a_call_dir,
            @a_call_res,
            'Maintenir le contact et avancer sur les opportunités en cours.',
            @a_result,
            @a_transport,
            CASE WHEN @a_type IN ('meeting','lunch','demo') THEN ROUND(5 + RAND() * 30, 1) ELSE NULL END,
            @v_user_id,
            @v_user_id
        );

        -- Ajouter le commercial comme participant
        INSERT INTO activity_participants (activity_id, participant_type, participant_id, status)
        VALUES (@v_act_id, 'user', @v_user_id, 'accepted');

        -- Ajouter un contact pour les meetings/déjeuners/demos
        IF @a_type IN ('meeting','lunch','demo') AND @v_ct_id IS NOT NULL
        BEGIN
            INSERT INTO activity_participants (activity_id, participant_type, participant_id, status)
            VALUES (@v_act_id, 'contact', @v_ct_id, 'accepted');
        END;

        SET @i = @i + 1;
    END;
    PRINT '  20 activités';

    FETCH NEXT FROM user_cursor INTO @v_user_id, @v_first_name, @v_last_name;
END;

CLOSE user_cursor;
DEALLOCATE user_cursor;

PRINT '=== Migration V11 terminée ===';
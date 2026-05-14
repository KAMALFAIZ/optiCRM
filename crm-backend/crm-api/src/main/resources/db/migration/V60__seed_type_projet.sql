-- Seed TYPE_PROJET reference data
INSERT INTO reference_data (id, category, ref_value, label, color, sort_order) VALUES
(NEWID(), 'TYPE_PROJET', 'LOGEMENT',        'Logement (Résidentiel)',              NULL, 1),
(NEWID(), 'TYPE_PROJET', 'TERTIAIRE',       'Tertiaire (Bureaux, hôtels, commerces)', NULL, 2),
(NEWID(), 'TYPE_PROJET', 'INDUSTRIEL',      'Industriel',                         NULL, 3),
(NEWID(), 'TYPE_PROJET', 'ERP',             'ERP (Santé, éducation, sport)',       NULL, 4),
(NEWID(), 'TYPE_PROJET', 'INFRASTRUCTURE',  'Infrastructure (Génie civil, voirie)', NULL, 5),
(NEWID(), 'TYPE_PROJET', 'RENOVATION',      'Rénovation',                         NULL, 6);

-- ============================================================
-- V68 : Seed des 6 templates de workflow prédéfinis
-- ============================================================

-- ── 1. Nurturing de Lead entrant ─────────────────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Nurturing de lead entrant',
    'Notifie le commercial assigné, crée une tâche de premier contact, puis relance automatiquement 3 jours plus tard si le score est suffisant.',
    'Lead Management',
    '🎯',
    'LEAD',
    'ENTITY_CREATED',
    NULL,
    '[
      {"name":"Notification commercial assigné","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{assignedToId}}\",\"title\":\"Nouveau lead assigné\",\"message\":\"Un nouveau lead vient d'\''être créé : {{fullName}}\"}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Créer tâche de contact","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Premier contact - {{fullName}}\",\"priority\":\"HIGH\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":1}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Attendre 3 jours","stepType":"DELAY","actionConfig":"{\"amount\":3,\"unit\":\"days\"}","stepOrder":2,"isEntryPoint":false,"positionX":100,"positionY":400},
      {"name":"Score suffisant ?","stepType":"CONDITION","actionConfig":"{\"field\":\"leadScore\",\"operator\":\">=\",\"value\":\"50\"}","stepOrder":3,"isEntryPoint":false,"positionX":100,"positionY":550},
      {"name":"Créer activité de suivi","stepType":"CREATE_ACTIVITY","actionConfig":"{\"activityType\":\"call\",\"subject\":\"Suivi lead {{fullName}}\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":1}","stepOrder":4,"isEntryPoint":false,"positionX":100,"positionY":700}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2},
      {"fromStepIndex":2,"toStepIndex":3},
      {"fromStepIndex":3,"toStepIndex":4,"label":"Oui"}
    ]',
    'lead,nurturing,notification,tâche',
    1,
    0,
    SYSDATETIME()
);

-- ── 2. Approbation Remise Commerciale ────────────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Approbation remise commerciale',
    'Déclenché quand une remise dépasse 20 % sur un devis. Notifie le manager, attend son approbation, puis valide ou rejette le devis avec tâche de révision.',
    'Sales',
    '✅',
    'QUOTE',
    'FIELD_CHANGED',
    '{"field":"discountPercent","operator":">=","value":"20"}',
    '[
      {"name":"Notifier le manager","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{managerId}}\",\"title\":\"Remise importante à valider\",\"message\":\"Un devis avec une remise de {{discountPercent}}% nécessite votre approbation\"}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Attendre approbation manager","stepType":"APPROVAL","actionConfig":"{\"approverId\":\"{{managerId}}\",\"message\":\"Merci de valider ou rejeter cette remise commerciale\"}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Marquer devis validé","stepType":"UPDATE_ENTITY","actionConfig":"{\"field\":\"status\",\"value\":\"APPROVED\"}","stepOrder":2,"isEntryPoint":false,"positionX":300,"positionY":400},
      {"name":"Notifier refus au commercial","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{assignedToId}}\",\"title\":\"Remise refusée\",\"message\":\"Votre demande de remise a été refusée. Veuillez réviser le devis.\"}","stepOrder":3,"isEntryPoint":false,"positionX":-100,"positionY":400},
      {"name":"Créer tâche de révision","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Réviser le devis - remise refusée\",\"priority\":\"HIGH\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":1}","stepOrder":4,"isEntryPoint":false,"positionX":-100,"positionY":550}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2,"label":"Approuvé"},
      {"fromStepIndex":1,"toStepIndex":3,"label":"Refusé"},
      {"fromStepIndex":3,"toStepIndex":4}
    ]',
    'devis,approbation,remise,manager',
    1,
    0,
    SYSDATETIME()
);

-- ── 3. Relance Devis Sans Réponse ────────────────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Relance devis sans réponse',
    'Planifié chaque matin en semaine. Relance le commercial à J+7 et alerte le manager à J+15 pour les devis envoyés sans réponse.',
    'Sales',
    '📩',
    'QUOTE',
    'CRON',
    '{"cronExpression":"0 9 * * 1-5","condition":"status=SENT AND daysSinceSent>=7"}',
    '[
      {"name":"Créer tâche de relance J+7","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Relancer le client - devis sans réponse\",\"priority\":\"MEDIUM\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":0}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Notifier le commercial","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{assignedToId}}\",\"title\":\"Devis sans réponse depuis 7 jours\",\"message\":\"Le devis {{quoteNumber}} n'\''a pas reçu de réponse depuis 7 jours\"}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Attendre 8 jours supplémentaires","stepType":"DELAY","actionConfig":"{\"amount\":8,\"unit\":\"days\"}","stepOrder":2,"isEntryPoint":false,"positionX":100,"positionY":400},
      {"name":"Alerter le manager","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{managerId}}\",\"title\":\"Devis sans réponse depuis 15 jours\",\"message\":\"Le devis {{quoteNumber}} n'\''a toujours pas reçu de réponse\"}","stepOrder":3,"isEntryPoint":false,"positionX":100,"positionY":550}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2},
      {"fromStepIndex":2,"toStepIndex":3}
    ]',
    'devis,relance,planifié,cron',
    1,
    0,
    SYSDATETIME()
);

-- ── 4. Suivi Visite Terrain ───────────────────────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Suivi automatique après visite terrain',
    'Déclenché à la fin d''une visite. Génère un résumé IA, crée une activité de suivi et, si des échantillons ont été prélevés, crée une tâche laboratoire.',
    'Field Operations',
    '🏗️',
    'VISIT',
    'STATUS_CHANGED',
    '{"field":"status","newValue":"COMPLETED"}',
    '[
      {"name":"Analyse IA de la visite","stepType":"AI_ACTION","actionConfig":"{\"aiAction\":\"generate_visit_summary\",\"outputField\":\"visitSummary\"}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Créer activité de suivi","stepType":"CREATE_ACTIVITY","actionConfig":"{\"activityType\":\"task\",\"subject\":\"Suivi visite - {{accountName}}\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":2}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Des échantillons prélevés ?","stepType":"CONDITION","actionConfig":"{\"field\":\"samplesCollected\",\"operator\":\"==\",\"value\":\"true\"}","stepOrder":2,"isEntryPoint":false,"positionX":100,"positionY":400},
      {"name":"Tâche envoi résultats lab","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Envoyer les résultats au laboratoire - {{accountName}}\",\"priority\":\"HIGH\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":3}","stepOrder":3,"isEntryPoint":false,"positionX":100,"positionY":550}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2},
      {"fromStepIndex":2,"toStepIndex":3,"label":"Oui"}
    ]',
    'visite,terrain,IA,laboratoire,chantier',
    1,
    0,
    SYSDATETIME()
);

-- ── 5. Lead Hautement Qualifié → Opportunité ─────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Conversion automatique lead qualifié',
    'Déclenché quand le score d''un lead dépasse 75. Notifie le manager, crée une tâche de conversion et lance une analyse IA du profil.',
    'Lead Management',
    '⭐',
    'LEAD',
    'SCORE_REACHED',
    '{"field":"leadScore","operator":">=","value":"75"}',
    '[
      {"name":"Notifier manager qualification","stepType":"SEND_NOTIFICATION","actionConfig":"{\"userId\":\"{{managerId}}\",\"title\":\"Lead hautement qualifié\",\"message\":\"Le lead {{fullName}} a atteint un score de {{leadScore}}/100\"}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Tâche de conversion","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Convertir lead en opportunité - {{fullName}}\",\"priority\":\"HIGH\",\"assigneeId\":\"{{managerId}}\",\"dueDays\":1}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Analyse IA du lead","stepType":"AI_ACTION","actionConfig":"{\"aiAction\":\"analyze_lead\",\"outputField\":\"aiAnalysis\"}","stepOrder":2,"isEntryPoint":false,"positionX":100,"positionY":400}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2}
    ]',
    'lead,score,IA,opportunité,conversion',
    1,
    0,
    SYSDATETIME()
);

-- ── 6. Onboarding Nouveau Client ─────────────────────────────────────────────
INSERT INTO workflow_templates
    (id, name, description, category, icon, entity_type, trigger_type, trigger_config,
     steps_config, transitions_config, tags, is_system, usage_count, created_at)
VALUES (
    NEWID(),
    'Onboarding nouveau compte client',
    'Déclenché à la création d''un compte. Programme un appel de bienvenue à J+2, envoie un email, puis planifie un bilan à J+7 et un rendez-vous à J+30.',
    'Client Service',
    '🤝',
    'ACCOUNT',
    'ENTITY_CREATED',
    NULL,
    '[
      {"name":"Créer activité de bienvenue","stepType":"CREATE_ACTIVITY","actionConfig":"{\"activityType\":\"call\",\"subject\":\"Appel de bienvenue - {{accountName}}\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":2}","stepOrder":0,"isEntryPoint":true,"positionX":100,"positionY":100},
      {"name":"Envoyer email de bienvenue","stepType":"SEND_EMAIL","actionConfig":"{\"templateId\":\"WELCOME_ACCOUNT\",\"recipientField\":\"email\"}","stepOrder":1,"isEntryPoint":false,"positionX":100,"positionY":250},
      {"name":"Attendre 7 jours","stepType":"DELAY","actionConfig":"{\"amount\":7,\"unit\":\"days\"}","stepOrder":2,"isEntryPoint":false,"positionX":100,"positionY":400},
      {"name":"Créer tâche de suivi J+7","stepType":"CREATE_TASK","actionConfig":"{\"title\":\"Suivi onboarding - {{accountName}}\",\"priority\":\"MEDIUM\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":0}","stepOrder":3,"isEntryPoint":false,"positionX":100,"positionY":550},
      {"name":"Attendre 23 jours","stepType":"DELAY","actionConfig":"{\"amount\":23,\"unit\":\"days\"}","stepOrder":4,"isEntryPoint":false,"positionX":100,"positionY":700},
      {"name":"Bilan 1 mois","stepType":"CREATE_ACTIVITY","actionConfig":"{\"activityType\":\"meeting\",\"subject\":\"Bilan 1 mois - {{accountName}}\",\"assigneeId\":\"{{assignedToId}}\",\"dueDays\":7}","stepOrder":5,"isEntryPoint":false,"positionX":100,"positionY":850}
    ]',
    '[
      {"fromStepIndex":0,"toStepIndex":1},
      {"fromStepIndex":1,"toStepIndex":2},
      {"fromStepIndex":2,"toStepIndex":3},
      {"fromStepIndex":3,"toStepIndex":4},
      {"fromStepIndex":4,"toStepIndex":5}
    ]',
    'compte,onboarding,email,bienvenue,fidélisation',
    1,
    0,
    SYSDATETIME()
);

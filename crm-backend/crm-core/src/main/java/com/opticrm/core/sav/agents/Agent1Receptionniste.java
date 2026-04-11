package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.dto.AgentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent1Receptionniste {

    private static final String SYSTEM_PROMPT = """
            Tu es l'assistant d'accueil SAV de KASOFT Informatique & Conseil,
            société IT basée à Casablanca, Maroc.

            Ta mission :
            1. Analyser le message du client
            2. Détecter la langue : FR (français), AR (arabe classique ou darija → traiter comme AR)
            3. Extraire le problème principal en une phrase claire
            4. Identifier les informations clés mentionnées (logiciel, module, message d'erreur, etc.)
            5. Générer un accusé de réception chaleureux dans la langue détectée

            Règles :
            - Si le message est en darija (arabe dialectal marocain), répondre en arabe classique
            - Toujours être poli et professionnel
            - Ne jamais inventer de solution à ce stade
            - Si le message est vague, noter qu'il faudra plus d'informations

            Réponds UNIQUEMENT en JSON avec cette structure exacte :
            {
              "langue_detectee": "FR",
              "probleme_extrait": "description courte en FR",
              "informations_cles": ["liste", "des", "éléments"],
              "message_accuse_reception_fr": "texte FR",
              "message_accuse_reception_ar": "نص عربي",
              "necessite_clarification": false,
              "question_clarification_fr": null,
              "question_clarification_ar": null
            }
            """;

    private final ClaudeClient claudeClient;

    public AgentResult.Agent1Result run(String texteClient) {
        log.info("[AGENT1] Analyse du message client");
        try {
            return claudeClient.callAndParse(SYSTEM_PROMPT, texteClient, AgentResult.Agent1Result.class);
        } catch (Exception e) {
            log.error("[AGENT1] Erreur: {}", e.getMessage());
            // Fallback minimal
            AgentResult.Agent1Result fallback = new AgentResult.Agent1Result();
            fallback.setLangueDetectee("FR");
            fallback.setProblemeExtrait(texteClient.length() > 200 ? texteClient.substring(0, 200) : texteClient);
            fallback.setMessageAccuseReceptionFr("Votre demande a bien été reçue. Nous la traitons en priorité.");
            fallback.setMessageAccuseReceptionAr("تم استلام طلبكم. نحن نعالجه بشكل عاجل.");
            fallback.setNecessiteClarification(false);
            return fallback;
        }
    }
}

package com.opticrm.api.ai;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.http.StreamResponse;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.RawMessageStreamEvent;
import com.opticrm.api.ai.dto.*;
import com.opticrm.common.exception.BusinessException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.activity.entity.Activity;
import com.opticrm.core.activity.repository.ActivityRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.ticket.entity.Ticket;
import com.opticrm.core.ticket.repository.TicketRepository;
import com.opticrm.security.service.SettingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class AiService {

    private static final String MODEL_CHAT  = "claude-opus-4-6";
    private static final String MODEL_FAST  = "claude-sonnet-4-6";
    private static final String MODEL_LIGHT = "claude-haiku-3-5";

    /** Cascade vision: Opus → Sonnet → Haiku — each model tried instantly on 529 */
    private static final String[] VISION_MODEL_CASCADE = { MODEL_CHAT, MODEL_FAST, MODEL_LIGHT };

    private static final String SYSTEM_PROMPT = """
            Tu es un assistant IA expert en CRM (Customer Relationship Management) intégré dans OptiCRM.
            Tu aides les équipes commerciales marocaines à :
            - Analyser des pistes et opportunités commerciales
            - Rédiger des emails professionnels et percutants
            - Donner des conseils sur la gestion de la relation client
            - Analyser les performances et proposer des actions concrètes
            - Fournir des insights sur les clients et prospects

            Réponds toujours en français de manière concise, professionnelle et actionnable.
            Utilise des emojis avec modération pour structurer tes réponses.
            """;

    @Value("${anthropic.api-key:}")
    private String envApiKey;

    @Autowired
    private SettingService settingService;

    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ContactRepository contactRepository;
    @Autowired
    private OpportunityRepository opportunityRepository;
    @Autowired
    private ActivityRepository activityRepository;
    @Autowired
    private TicketRepository ticketRepository;
    @Autowired
    private LeadRepository leadRepository;

    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ─── Client cache (rebuilt quand la clé change) ─────────────────────────

    private volatile AnthropicClient cachedClient;
    private volatile String cachedKey = "";

    /** Retourne un client initialisé avec la clé effective (DB > env). Null si aucune clé. */
    private synchronized AnthropicClient getClient() {
        String dbKey = settingService.getAiApiKey();
        String effectiveKey = dbKey.isBlank() ? envApiKey : dbKey;
        if (effectiveKey.isBlank()) return null;

        if (!effectiveKey.equals(cachedKey) || cachedClient == null) {
            cachedClient = AnthropicOkHttpClient.builder().apiKey(effectiveKey).build();
            cachedKey = effectiveKey;
            log.info("Anthropic AI client initialized (source: {})", dbKey.isBlank() ? "env" : "database");
        }
        return cachedClient;
    }

    // ─── Fonctions ──────────────────────────────────────────────────────────

    public SseEmitter streamChat(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);

        AnthropicClient client = getClient();
        if (client == null) {
            try {
                emitter.send(SseEmitter.event().data("⚠️ La clé API Anthropic n'est pas configurée."));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        executor.execute(() -> {
            try {
                MessageCreateParams params = buildParams(request.getMessages(), SYSTEM_PROMPT, 2048L);

                try (StreamResponse<RawMessageStreamEvent> stream = client.messages().createStreaming(params)) {
                    stream.stream()
                            .flatMap(event -> event.contentBlockDelta().stream())
                            .flatMap(delta -> delta.delta().text().stream())
                            .forEach(text -> {
                                try {
                                    emitter.send(SseEmitter.event().data(text.text()));
                                } catch (IOException e) {
                                    emitter.completeWithError(e);
                                }
                            });
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                log.error("Error streaming AI chat", e);
                try {
                    emitter.send(SseEmitter.event().data("Une erreur est survenue. Veuillez réessayer."));
                    emitter.send(SseEmitter.event().name("done").data(""));
                } catch (IOException ex) {
                    log.error("Error sending error SSE", ex);
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    public String generateEmail(GenerateEmailRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildEmailPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en communication commerciale. Rédige des emails professionnels en français.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String analyzeLead(AnalyzeLeadRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildLeadAnalysisPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en analyse commerciale et scoring de leads CRM.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String analyzeOpportunity(AnalyzeOpportunityRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildOpportunityAnalysisPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en analyse commerciale et scoring d'opportunités CRM.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String analyzeAccount(AnalyzeAccountRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildAccountAnalysisPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en gestion de la relation client et analyse de portefeuille comptes.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String generateSalesInsights(GenerateSalesInsightsRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildSalesInsightsPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en analyse des performances commerciales et pilotage de la force de vente.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    // ─── Nouvelles fonctions AI ──────────────────────────────────────────

    public String summarizePipeline(SummarizePipelineRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildSummarizePipelinePrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en analyse de pipeline commercial CRM. Fournis des résumés clairs et actionnables.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String suggestFollowUps(SuggestFollowUpsRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildSuggestFollowUpsPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en stratégie de relance commerciale. Propose des actions concrètes et personnalisées.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String generateMeetingSummary(GenerateMeetingSummaryRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildMeetingSummaryPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un assistant expert en prise de notes et synthèse de réunions commerciales.",
                1500L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    public String smartSearch(SmartSearchRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        String prompt = buildSmartSearchPrompt(request);
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un assistant CRM intelligent. Aide l'utilisateur à trouver des informations et à formuler des requêtes efficaces.",
                1000L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    // ─── P1 : Résumé fiche client 360 ──────────────────────────────────

    public String accountSummary360(AccountSummary360Request request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        UUID accountId = request.getAccountId();
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("ACCOUNT_NOT_FOUND", "Compte introuvable"));

        // Gather related data
        List<Contact> contacts = contactRepository.findByAccountId(accountId);
        List<Opportunity> opportunities = opportunityRepository.findByAccountId(accountId);
        List<Activity> activities = activityRepository.findByRelatedToTypeAndRelatedToId("ACCOUNT", accountId);
        List<Ticket> tickets = ticketRepository.findByAccountId(accountId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

        // Aggregate stats
        BigDecimal wonAmount = opportunityRepository.sumWonAmountByAccountId(accountId);
        BigDecimal openPipeline = opportunityRepository.sumOpenPipelineByAccountId(accountId);
        long wonCount = opportunityRepository.countWonByAccountId(accountId);
        long openCount = opportunityRepository.countOpenByAccountId(accountId);
        long openTickets = tickets.stream().filter(t -> t.getStatus() != Ticket.TicketStatus.FERME && t.getStatus() != Ticket.TicketStatus.RESOLU).count();

        String prompt = buildAccountSummary360Prompt(account, contacts, opportunities, activities, tickets,
                wonAmount, openPipeline, wonCount, openCount, openTickets);

        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un assistant CRM expert. Génère un résumé exécutif complet d'un compte client en français. " +
                "Sois concis, structuré et actionnable. Utilise des emojis pour structurer les sections.",
                2000L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    // ─── P1 : Scoring prédictif leads IA ─────────────────────────────────

    public String leadScoringAi(LeadScoringAiRequest request) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        UUID leadId = request.getLeadId();
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new BusinessException("LEAD_NOT_FOUND", "Piste introuvable"));

        List<Activity> activities = activityRepository.findByRelatedToTypeAndRelatedToId("LEAD", leadId);

        // Historical conversion stats
        long totalActive = leadRepository.countActive();
        long totalConverted = leadRepository.countConverted();

        String prompt = buildLeadScoringPrompt(lead, activities, totalActive, totalConverted);

        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un expert en scoring de leads B2B. Analyse ce lead et fournis un scoring détaillé en JSON.\n" +
                "Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de ```), au format :\n" +
                "{\n" +
                "  \"score\": <number 0-100>,\n" +
                "  \"label\": \"<Très qualifié|Qualifié|Prometteur|À travailler|Froid>\",\n" +
                "  \"strengths\": [\"<force1>\", \"<force2>\"],\n" +
                "  \"weaknesses\": [\"<faiblesse1>\", \"<faiblesse2>\"],\n" +
                "  \"nextActions\": [\"<action1>\", \"<action2>\"],\n" +
                "  \"reasoning\": \"<explication en 2-3 phrases>\"\n" +
                "}",
                1000L, MODEL_FAST
        );

        return extractText(client.messages().create(params));
    }

    // ─── P1 : Classification automatique de tickets ──────────────────────

    public ClassifyTicketResponse classifyTicket(ClassifyTicketRequest request) {
        AnthropicClient client = getClient();
        if (client == null) {
            return new ClassifyTicketResponse("AUTRE", "NORMALE", "Clé API non configurée.");
        }

        String prompt = buildClassifyTicketPrompt(request);

        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", prompt)),
                "Tu es un assistant CRM expert en support client. Classifie les tickets en analysant le titre et la description.\n" +
                "Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de ```):\n" +
                "{\n" +
                "  \"category\": \"<SAV|TECHNIQUE|COMMERCIAL|FACTURATION|LIVRAISON|AUTRE>\",\n" +
                "  \"priority\": \"<BASSE|NORMALE|HAUTE|CRITIQUE>\",\n" +
                "  \"reasoning\": \"<justification courte en 1-2 phrases>\"\n" +
                "}",
                300L, MODEL_FAST
        );

        String json = extractText(client.messages().create(params));
        return parseClassifyTicketResponse(json);
    }

    public void testConnection() {
        AnthropicClient client = getClient();
        if (client == null) {
            throw new BusinessException("AI_NOT_CONFIGURED",
                    "Aucune clé API Anthropic n'est configurée. Enregistrez une clé dans Paramètres > Intelligence Artificielle.");
        }
        try {
            MessageCreateParams params = buildParams(
                    List.of(new ChatMessage("user", "Réponds uniquement : OK")),
                    "Tu es un assistant.",
                    5L
            );
            client.messages().create(params);
            log.info("Test de connexion Anthropic réussi");
        } catch (Exception e) {
            throw new BusinessException("AI_CONNECTION_FAILED",
                    "Clé API invalide ou service indisponible : " + e.getMessage());
        }
    }

    // ─── Public utility methods for other services ──────────────────────────

    /**
     * Calls Claude with an image (base64) + text prompt.
     * Uses claude-opus-4-6 (vision-capable).
     */
    public String callWithImage(String base64Data, String mediaType, String textPrompt, String systemPrompt) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";

        try {
            // Détecter le bon MediaType selon le Content-Type
            com.anthropic.models.messages.Base64ImageSource.MediaType sdkMediaType =
                    com.anthropic.models.messages.Base64ImageSource.MediaType.IMAGE_JPEG;
            if (mediaType != null) {
                if (mediaType.contains("png"))  sdkMediaType = com.anthropic.models.messages.Base64ImageSource.MediaType.IMAGE_PNG;
                else if (mediaType.contains("gif"))  sdkMediaType = com.anthropic.models.messages.Base64ImageSource.MediaType.IMAGE_GIF;
                else if (mediaType.contains("webp")) sdkMediaType = com.anthropic.models.messages.Base64ImageSource.MediaType.IMAGE_WEBP;
            }

            // Construire la source image base64
            com.anthropic.models.messages.Base64ImageSource imageSource =
                    com.anthropic.models.messages.Base64ImageSource.builder()
                            .data(base64Data)
                            .mediaType(sdkMediaType)
                            .build();

            // Construire le bloc image + le bloc texte
            com.anthropic.models.messages.ImageBlockParam imageBlock =
                    com.anthropic.models.messages.ImageBlockParam.builder()
                            .source(imageSource)   // source(Base64ImageSource) — API directe SDK 2.14.0
                            .build();

            com.anthropic.models.messages.TextBlockParam textBlock =
                    com.anthropic.models.messages.TextBlockParam.builder()
                            .text(textPrompt)
                            .build();

            java.util.List<com.anthropic.models.messages.ContentBlockParam> userBlocks = java.util.List.of(
                    com.anthropic.models.messages.ContentBlockParam.ofImage(imageBlock),
                    com.anthropic.models.messages.ContentBlockParam.ofText(textBlock)
            );

            // ── CASCADE DE MODÈLES : Opus → Sonnet → Haiku ──────────────────────────
            // Si un modèle est surchargé (529), on passe immédiatement au suivant.
            // Pas d'attente entre les modèles — chaque modèle a sa propre capacité.
            String lastError = "";
            for (String model : VISION_MODEL_CASCADE) {
                try {
                    MessageCreateParams params = MessageCreateParams.builder()
                            .model(model)
                            .maxTokens(2000L)
                            .system(systemPrompt)
                            .addUserMessageOfBlockParams(userBlocks)
                            .build();
                    log.info("Vision AI: trying model {}", model);
                    String result = extractText(client.messages().create(params));
                    if (!model.equals(MODEL_CHAT)) {
                        log.info("Vision AI: succeeded with fallback model {}", model);
                    }
                    return result;
                } catch (Exception ex) {
                    lastError = ex.getMessage() != null ? ex.getMessage() : "";
                    boolean isOverloaded = lastError.contains("overloaded_error") || lastError.contains("529");
                    if (isOverloaded) {
                        log.warn("Model {} overloaded (529), switching to next model...", model);
                        // Pas de sleep — on passe directement au modèle suivant
                    } else {
                        // Erreur non-overloaded (ex: invalid_request, auth error) → on arrête tout
                        log.error("Vision AI call failed on model {}: {}", model, lastError);
                        return "⚠️ Erreur lors de l'analyse de l'image : " + lastError;
                    }
                }
            }
            // Tous les modèles sont surchargés
            log.error("All vision models overloaded (Opus, Sonnet, Haiku)");
            return "⚠️ OVERLOADED: Tous les modèles IA sont temporairement surchargés. Veuillez réessayer dans quelques instants.";
        } catch (Exception e) {
            log.error("Vision AI call failed", e);
            return "⚠️ Erreur lors de l'analyse de l'image : " + e.getMessage();
        }
    }

    public String callFast(String userMessage, String systemPrompt) {
        AnthropicClient client = getClient();
        if (client == null) return "⚠️ La clé API Anthropic n'est pas configurée.";
        MessageCreateParams params = buildParams(
                List.of(new ChatMessage("user", userMessage)),
                systemPrompt,
                2000L, MODEL_FAST
        );
        return extractText(client.messages().create(params));
    }

    public SseEmitter streamChatWithSystemPrompt(ChatRequest request, String systemPrompt) {
        SseEmitter emitter = new SseEmitter(120_000L);
        AnthropicClient client = getClient();
        if (client == null) {
            try {
                emitter.send(SseEmitter.event().data("⚠️ La clé API Anthropic n'est pas configurée."));
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }
        executor.execute(() -> {
            try {
                MessageCreateParams params = buildParams(request.getMessages(), systemPrompt, 2048L);
                try (StreamResponse<RawMessageStreamEvent> stream = client.messages().createStreaming(params)) {
                    stream.stream()
                            .flatMap(event -> event.contentBlockDelta().stream())
                            .flatMap(delta -> delta.delta().text().stream())
                            .forEach(text -> {
                                try {
                                    emitter.send(SseEmitter.event().data(text.text()));
                                } catch (IOException e) {
                                    emitter.completeWithError(e);
                                }
                            });
                }
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                log.error("Error streaming chantier AI chat", e);
                try {
                    emitter.send(SseEmitter.event().data("Une erreur est survenue."));
                    emitter.send(SseEmitter.event().name("done").data(""));
                } catch (IOException ex) {
                    log.error("SSE send error", ex);
                }
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    // --- Helpers ---

    private MessageCreateParams buildParams(List<ChatMessage> messages, String systemPrompt, long maxTokens) {
        return buildParams(messages, systemPrompt, maxTokens, MODEL_CHAT);
    }

    private MessageCreateParams buildParams(List<ChatMessage> messages, String systemPrompt, long maxTokens, String model) {
        MessageCreateParams.Builder builder = MessageCreateParams.builder()
                .model(model)
                .maxTokens(maxTokens)
                .system(systemPrompt);

        for (ChatMessage msg : messages) {
            if ("user".equals(msg.getRole())) {
                builder.addUserMessage(msg.getContent());
            } else if ("assistant".equals(msg.getRole())) {
                builder.addAssistantMessage(msg.getContent());
            }
        }

        return builder.build();
    }

    private String extractText(com.anthropic.models.messages.Message message) {
        return message.content().stream()
                .flatMap(block -> block.text().stream())
                .map(t -> t.text())
                .findFirst()
                .orElse("");
    }

    private String buildEmailPrompt(GenerateEmailRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Rédige un email professionnel avec les informations suivantes :\n\n");
        sb.append("Sujet : ").append(req.getSubject()).append("\n");
        if (req.getRecipientName() != null) sb.append("Destinataire : ").append(req.getRecipientName()).append("\n");
        if (req.getRecipientCompany() != null) sb.append("Entreprise : ").append(req.getRecipientCompany()).append("\n");
        if (req.getContext() != null) sb.append("Contexte : ").append(req.getContext()).append("\n");
        if (req.getTone() != null) sb.append("Ton : ").append(req.getTone()).append("\n");
        sb.append("\nFournis uniquement le corps de l'email, sans ligne d'objet ni balises HTML.");
        return sb.toString();
    }

    private String buildLeadAnalysisPrompt(AnalyzeLeadRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse ce lead CRM et fournis :\n");
        sb.append("1. Un score de qualification (0-100) avec justification\n");
        sb.append("2. Les points forts et les risques\n");
        sb.append("3. Les prochaines actions recommandées\n\n");
        sb.append("Informations du lead :\n");
        sb.append("- Nom : ").append(req.getLeadName()).append("\n");
        if (req.getCompany() != null) sb.append("- Entreprise : ").append(req.getCompany()).append("\n");
        if (req.getJobTitle() != null) sb.append("- Poste : ").append(req.getJobTitle()).append("\n");
        if (req.getSource() != null) sb.append("- Source : ").append(req.getSource()).append("\n");
        if (req.getStatus() != null) sb.append("- Statut : ").append(req.getStatus()).append("\n");
        if (req.getIndustry() != null) sb.append("- Secteur : ").append(req.getIndustry()).append("\n");
        if (req.getEstimatedValue() != null) sb.append("- Valeur estimée : ").append(req.getEstimatedValue()).append(" MAD\n");
        if (req.getNotes() != null) sb.append("- Notes : ").append(req.getNotes()).append("\n");
        return sb.toString();
    }

    private String buildOpportunityAnalysisPrompt(AnalyzeOpportunityRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse cette opportunité commerciale CRM et fournis :\n");
        sb.append("1. Un score de probabilité de succès (0-100%) avec justification\n");
        sb.append("2. Les facteurs favorables et les risques identifiés\n");
        sb.append("3. Les prochaines actions recommandées pour faire avancer la deal\n\n");
        sb.append("Informations de l'opportunité :\n");
        sb.append("- Nom : ").append(req.getOpportunityName()).append("\n");
        if (req.getStageName() != null) sb.append("- Étape pipeline : ").append(req.getStageName()).append("\n");
        if (req.getAmount() != null) sb.append("- Montant : ").append(req.getAmount()).append(" MAD\n");
        if (req.getProbability() != null) sb.append("- Probabilité actuelle : ").append(req.getProbability()).append("%\n");
        if (req.getCloseDate() != null) sb.append("- Date de clôture prévue : ").append(req.getCloseDate()).append("\n");
        if (req.getAccountName() != null) sb.append("- Compte client : ").append(req.getAccountName()).append("\n");
        if (req.getProductNames() != null) sb.append("- Produits/Services : ").append(req.getProductNames()).append("\n");
        if (req.getNotes() != null) sb.append("- Notes : ").append(req.getNotes()).append("\n");
        return sb.toString();
    }

    private String buildAccountAnalysisPrompt(AnalyzeAccountRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse ce compte client CRM et fournis :\n");
        sb.append("1. Un score de santé client (0-100) avec justification\n");
        sb.append("2. Le niveau de risque de churn (faible/moyen/élevé) et les signaux d'alerte\n");
        sb.append("3. Les opportunités d'upsell/cross-sell identifiées\n");
        sb.append("4. Les actions prioritaires recommandées\n\n");
        sb.append("Informations du compte :\n");
        sb.append("- Nom : ").append(req.getAccountName()).append("\n");
        if (req.getIndustry() != null) sb.append("- Secteur : ").append(req.getIndustry()).append("\n");
        if (req.getCity() != null) sb.append("- Ville : ").append(req.getCity()).append("\n");
        if (req.getRevenueCurrentYear() != null) sb.append("- CA année en cours : ").append(req.getRevenueCurrentYear()).append(" MAD\n");
        if (req.getPipelineValue() != null) sb.append("- Pipeline en cours : ").append(req.getPipelineValue()).append(" MAD\n");
        if (req.getOverdueAmount() != null) sb.append("- Montant impayé : ").append(req.getOverdueAmount()).append(" MAD\n");
        if (req.getContactCount() != null) sb.append("- Nombre de contacts : ").append(req.getContactCount()).append("\n");
        return sb.toString();
    }

    private String buildSalesInsightsPrompt(GenerateSalesInsightsRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse les performances commerciales suivantes et fournis :\n");
        sb.append("1. Une synthèse narrative des résultats\n");
        sb.append("2. Les points positifs et les axes d'amélioration\n");
        sb.append("3. Des recommandations concrètes et actionnables pour améliorer les performances\n\n");
        sb.append("Données de performance — Période : ").append(req.getPeriod()).append("\n");
        if (req.getCaRealise() != null) sb.append("- CA réalisé : ").append(req.getCaRealise()).append(" MAD\n");
        if (req.getCaObjectif() != null) sb.append("- CA objectif : ").append(req.getCaObjectif()).append(" MAD\n");
        if (req.getTauxAtteinte() != null) sb.append("- Taux d'atteinte : ").append(String.format("%.1f", req.getTauxAtteinte())).append("%\n");
        if (req.getNbExceeded() != null) sb.append("- Objectifs dépassés : ").append(req.getNbExceeded()).append("\n");
        if (req.getNbAchieved() != null) sb.append("- Objectifs atteints : ").append(req.getNbAchieved()).append("\n");
        if (req.getNbInProgress() != null) sb.append("- Objectifs en cours : ").append(req.getNbInProgress()).append("\n");
        if (req.getNbFailed() != null) sb.append("- Objectifs non atteints : ").append(req.getNbFailed()).append("\n");
        return sb.toString();
    }

    private String buildSummarizePipelinePrompt(SummarizePipelineRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Fournis un résumé exécutif du pipeline commercial avec :\n");
        sb.append("1. Vue d'ensemble de la santé du pipeline\n");
        sb.append("2. Les points d'attention et risques\n");
        sb.append("3. Les actions prioritaires à mener\n\n");
        sb.append("Données du pipeline :\n");
        if (req.getTotalOpportunities() != null) sb.append("- Nombre total d'opportunités : ").append(req.getTotalOpportunities()).append("\n");
        if (req.getTotalValue() != null) sb.append("- Valeur totale : ").append(req.getTotalValue()).append(" MAD\n");
        if (req.getWonCount() != null) sb.append("- Opportunités gagnées : ").append(req.getWonCount()).append("\n");
        if (req.getLostCount() != null) sb.append("- Opportunités perdues : ").append(req.getLostCount()).append("\n");
        if (req.getInProgressCount() != null) sb.append("- En cours : ").append(req.getInProgressCount()).append("\n");
        if (req.getWinRate() != null) sb.append("- Taux de conversion : ").append(String.format("%.1f", req.getWinRate())).append("%\n");
        if (req.getTopStage() != null) sb.append("- Étape la plus peuplée : ").append(req.getTopStage()).append("\n");
        if (req.getPeriod() != null) sb.append("- Période : ").append(req.getPeriod()).append("\n");
        return sb.toString();
    }

    private String buildSuggestFollowUpsPrompt(SuggestFollowUpsRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Propose 3 à 5 actions de relance personnalisées pour ce contact, avec :\n");
        sb.append("- Le type d'action (email, appel, visite, LinkedIn)\n");
        sb.append("- Le message ou sujet suggéré\n");
        sb.append("- Le timing recommandé\n");
        sb.append("- La justification\n\n");
        sb.append("Informations du contact :\n");
        sb.append("- Nom : ").append(req.getContactName()).append("\n");
        if (req.getCompany() != null) sb.append("- Entreprise : ").append(req.getCompany()).append("\n");
        if (req.getLastInteraction() != null) sb.append("- Dernière interaction : ").append(req.getLastInteraction()).append("\n");
        if (req.getLastInteractionDate() != null) sb.append("- Date dernière interaction : ").append(req.getLastInteractionDate()).append("\n");
        if (req.getStatus() != null) sb.append("- Statut : ").append(req.getStatus()).append("\n");
        if (req.getOpportunityStage() != null) sb.append("- Étape opportunité : ").append(req.getOpportunityStage()).append("\n");
        if (req.getDealValue() != null) sb.append("- Valeur du deal : ").append(req.getDealValue()).append(" MAD\n");
        if (req.getNotes() != null) sb.append("- Notes : ").append(req.getNotes()).append("\n");
        return sb.toString();
    }

    private String buildMeetingSummaryPrompt(GenerateMeetingSummaryRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("À partir des notes de réunion suivantes, génère :\n");
        sb.append("1. Un résumé exécutif (2-3 phrases)\n");
        sb.append("2. Les décisions prises\n");
        sb.append("3. Les actions à suivre (avec responsable si mentionné)\n");
        sb.append("4. Les points de vigilance\n\n");
        if (req.getMeetingType() != null) sb.append("Type de réunion : ").append(req.getMeetingType()).append("\n");
        if (req.getParticipants() != null) sb.append("Participants : ").append(req.getParticipants()).append("\n");
        if (req.getDate() != null) sb.append("Date : ").append(req.getDate()).append("\n");
        if (req.getAccountName() != null) sb.append("Compte : ").append(req.getAccountName()).append("\n");
        sb.append("\nNotes de réunion :\n").append(req.getNotes());
        return sb.toString();
    }

    private String buildSmartSearchPrompt(SmartSearchRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("L'utilisateur recherche dans son CRM : \"").append(req.getQuery()).append("\"\n\n");
        sb.append("Aide-le en :\n");
        sb.append("1. Interprétant sa demande\n");
        sb.append("2. Suggérant les modules CRM à consulter (Contacts, Pistes, Opportunités, Comptes, Factures)\n");
        sb.append("3. Proposant des filtres ou critères de recherche pertinents\n");
        sb.append("4. Donnant des conseils pour affiner sa recherche\n");
        if (req.getContext() != null) sb.append("\nContexte additionnel : ").append(req.getContext()).append("\n");
        return sb.toString();
    }

    // ─── Prompt Builders P1 ──────────────────────────────────────────────

    private String buildAccountSummary360Prompt(Account account, List<Contact> contacts,
            List<Opportunity> opportunities, List<Activity> activities, List<Ticket> tickets,
            BigDecimal wonAmount, BigDecimal openPipeline, long wonCount, long openCount, long openTickets) {

        StringBuilder sb = new StringBuilder();
        sb.append("Génère un résumé exécutif 360° de ce compte client pour préparer un RDV commercial.\n\n");

        // Account info
        sb.append("═══ COMPTE ═══\n");
        sb.append("Nom : ").append(account.getName()).append("\n");
        if (account.getLegalName() != null) sb.append("Raison sociale : ").append(account.getLegalName()).append("\n");
        if (account.getAccountType() != null) sb.append("Type : ").append(account.getAccountType()).append("\n");
        if (account.getSegment() != null) sb.append("Segment : ").append(account.getSegment()).append("\n");
        if (account.getIndustry() != null) sb.append("Secteur : ").append(account.getIndustry().getName()).append("\n");
        if (account.getBillingCity() != null) sb.append("Ville : ").append(account.getBillingCity()).append("\n");
        if (account.getAssignedTo() != null) sb.append("Commercial : ").append(account.getAssignedTo().getFullName()).append("\n");
        if (account.getCreditLimit() != null) sb.append("Limite crédit : ").append(account.getCreditLimit()).append(" MAD\n");

        // Financial summary
        sb.append("\n═══ CHIFFRES CLÉS ═══\n");
        sb.append("CA total (affaires gagnées) : ").append(wonAmount != null ? wonAmount + " MAD" : "N/A").append("\n");
        sb.append("Pipeline ouvert : ").append(openPipeline != null ? openPipeline + " MAD" : "N/A").append("\n");
        sb.append("Affaires gagnées : ").append(wonCount).append("\n");
        sb.append("Affaires en cours : ").append(openCount).append("\n");
        sb.append("Tickets ouverts : ").append(openTickets).append("\n");

        // Contacts
        sb.append("\n═══ CONTACTS (").append(contacts.size()).append(") ═══\n");
        contacts.stream().limit(10).forEach(c -> {
            sb.append("- ").append(c.getFirstName()).append(" ").append(c.getLastName());
            if (c.getJobTitle() != null) sb.append(" (").append(c.getJobTitle()).append(")");
            if (c.getContactRole() != null) sb.append(" [").append(c.getContactRole()).append("]");
            sb.append("\n");
        });

        // Opportunities
        sb.append("\n═══ OPPORTUNITÉS (").append(opportunities.size()).append(") ═══\n");
        opportunities.stream().limit(10).forEach(o -> {
            sb.append("- ").append(o.getName());
            if (o.getStage() != null) sb.append(" | Étape: ").append(o.getStage().getName());
            if (o.getAmount() != null) sb.append(" | ").append(o.getAmount()).append(" MAD");
            if (o.getIsWon() != null && o.getIsWon()) sb.append(" ✓ GAGNÉE");
            if (o.getIsClosed() != null && o.getIsClosed() && (o.getIsWon() == null || !o.getIsWon())) sb.append(" ✗ PERDUE");
            sb.append("\n");
        });

        // Recent activities
        sb.append("\n═══ ACTIVITÉS RÉCENTES (").append(activities.size()).append(" total) ═══\n");
        activities.stream().limit(8).forEach(a -> {
            sb.append("- [").append(a.getActivityType()).append("] ").append(a.getSubject());
            if (a.getStatus() != null) sb.append(" (").append(a.getStatus()).append(")");
            if (a.getStartDate() != null) sb.append(" — ").append(a.getStartDate().toString().substring(0, 10));
            sb.append("\n");
        });

        // Open tickets
        sb.append("\n═══ TICKETS OUVERTS ═══\n");
        tickets.stream()
                .filter(t -> t.getStatus() != Ticket.TicketStatus.FERME && t.getStatus() != Ticket.TicketStatus.RESOLU)
                .limit(5)
                .forEach(t -> {
                    sb.append("- [").append(t.getPriority()).append("] ").append(t.getTitle());
                    sb.append(" (").append(t.getStatus()).append(")");
                    sb.append("\n");
                });

        sb.append("\n═══ CONSIGNES ═══\n");
        sb.append("Fournis :\n");
        sb.append("1. Un résumé exécutif en 3-4 phrases\n");
        sb.append("2. Points forts de la relation client\n");
        sb.append("3. Points d'attention / risques\n");
        sb.append("4. Top 3 des actions prioritaires à mener\n");
        sb.append("5. Opportunités de développement (upsell/cross-sell)\n");

        return sb.toString();
    }

    private String buildLeadScoringPrompt(Lead lead, List<Activity> activities, long totalActive, long totalConverted) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse ce lead et fournis un score prédictif de conversion.\n\n");

        sb.append("═══ PROFIL DU LEAD ═══\n");
        sb.append("Nom : ").append(lead.getFirstName() != null ? lead.getFirstName() + " " : "").append(lead.getLastName()).append("\n");
        if (lead.getCompanyName() != null) sb.append("Entreprise : ").append(lead.getCompanyName()).append("\n");
        if (lead.getJobTitle() != null) sb.append("Poste : ").append(lead.getJobTitle()).append("\n");
        if (lead.getIndustry() != null) sb.append("Secteur : ").append(lead.getIndustry()).append("\n");
        if (lead.getSource() != null) sb.append("Source : ").append(lead.getSource()).append("\n");
        if (lead.getStatus() != null) sb.append("Statut actuel : ").append(lead.getStatus()).append("\n");
        if (lead.getRating() != null) sb.append("Température : ").append(lead.getRating()).append("\n");
        if (lead.getPriority() != null) sb.append("Priorité : ").append(lead.getPriority()).append("\n");

        sb.append("\n═══ QUALIFICATION ═══\n");
        sb.append("Email : ").append(lead.getEmail() != null ? "Oui" : "Non").append("\n");
        sb.append("Téléphone : ").append(lead.getPhone() != null || lead.getMobile() != null ? "Oui" : "Non").append("\n");
        sb.append("Budget : ").append(lead.getBudgetRange() != null ? lead.getBudgetRange() : "Non renseigné").append("\n");
        sb.append("Délai de décision : ").append(lead.getDecisionTimeframe() != null ? lead.getDecisionTimeframe() : "Non renseigné").append("\n");
        sb.append("Produits d'intérêt : ").append(lead.getInterestedProducts() != null ? String.join(", ", lead.getInterestedProducts()) : "Non renseigné").append("\n");
        sb.append("Démo demandée : ").append(lead.getProductDemoRequested() != null && lead.getProductDemoRequested() ? "Oui" : "Non").append("\n");

        // Activities
        sb.append("\n═══ ACTIVITÉS (").append(activities.size()).append(") ═══\n");
        activities.stream().limit(10).forEach(a -> {
            sb.append("- [").append(a.getActivityType()).append("] ").append(a.getSubject());
            if (a.getStatus() != null) sb.append(" (").append(a.getStatus()).append(")");
            sb.append("\n");
        });

        // Context
        sb.append("\n═══ CONTEXTE HISTORIQUE ═══\n");
        sb.append("Leads actifs dans le CRM : ").append(totalActive).append("\n");
        sb.append("Leads convertis historiquement : ").append(totalConverted).append("\n");
        double convRate = totalActive + totalConverted > 0 ? (double) totalConverted / (totalActive + totalConverted) * 100 : 0;
        sb.append("Taux de conversion global : ").append(String.format("%.1f", convRate)).append("%\n");

        if (lead.getDescription() != null) {
            sb.append("\nNotes : ").append(lead.getDescription()).append("\n");
        }

        return sb.toString();
    }

    private String buildClassifyTicketPrompt(ClassifyTicketRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Classifie ce ticket de support :\n\n");
        sb.append("Titre : ").append(req.getTitle()).append("\n");
        if (req.getDescription() != null) sb.append("Description : ").append(req.getDescription()).append("\n");
        if (req.getAccountName() != null) sb.append("Client : ").append(req.getAccountName()).append("\n");
        sb.append("\nCatégories possibles : SAV (service après-vente, retours, garantie), TECHNIQUE (bugs, dysfonctionnements, installation), ");
        sb.append("COMMERCIAL (demande devis, info produit, négociation), FACTURATION (facture, paiement, avoir), ");
        sb.append("LIVRAISON (retard, suivi, colis), AUTRE.\n");
        sb.append("\nPriorités : CRITIQUE (bloquant, urgence immédiate), HAUTE (impact fort, résolution rapide nécessaire), ");
        sb.append("NORMALE (standard), BASSE (information, amélioration).\n");
        return sb.toString();
    }

    private ClassifyTicketResponse parseClassifyTicketResponse(String json) {
        try {
            // Clean potential markdown wrapping
            String cleaned = json.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
            }
            // Simple manual parse to avoid adding Jackson ObjectMapper dependency
            String category = extractJsonString(cleaned, "category");
            String priority = extractJsonString(cleaned, "priority");
            String reasoning = extractJsonString(cleaned, "reasoning");

            // Validate values
            if (!List.of("SAV", "TECHNIQUE", "COMMERCIAL", "FACTURATION", "LIVRAISON", "AUTRE").contains(category)) {
                category = "AUTRE";
            }
            if (!List.of("BASSE", "NORMALE", "HAUTE", "CRITIQUE").contains(priority)) {
                priority = "NORMALE";
            }

            return new ClassifyTicketResponse(category, priority, reasoning);
        } catch (Exception e) {
            log.warn("Failed to parse ticket classification response: {}", json, e);
            return new ClassifyTicketResponse("AUTRE", "NORMALE", "Classification automatique indisponible.");
        }
    }

    private String extractJsonString(String json, String key) {
        String pattern = "\"" + key + "\"\\s*:\\s*\"";
        int start = json.indexOf(pattern);
        if (start < 0) return "";
        start += pattern.length() - 1; // position at opening quote
        // Find closing quote (handle escaped quotes)
        int i = start + 1;
        while (i < json.length()) {
            if (json.charAt(i) == '\\') { i += 2; continue; }
            if (json.charAt(i) == '"') break;
            i++;
        }
        return json.substring(start + 1, Math.min(i, json.length()));
    }
}

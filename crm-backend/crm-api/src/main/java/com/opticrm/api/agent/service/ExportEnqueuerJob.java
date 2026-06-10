package com.opticrm.api.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Scrute périodiquement les documents éligibles à l'export vers Sage et les enfile
 * dans sage_export_queue. Cross-tenant : utilise des requêtes natives qui lisent
 * le tenant_id de chaque ligne.
 *
 * Mapping documents :
 *   - quotes(status=ACCEPTED)       → QUOTE       DO_Type=0
 *   - sales_orders(status=CONFIRMED) → SALES_ORDER DO_Type=1
 *   - delivery_tour(status=CLOSED)  → DELIVERY    DO_Type=3
 *   - payments(status=CONFIRMED)    → PAYMENT     (RG)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExportEnqueuerJob {

    @PersistenceContext
    private EntityManager em;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelayString = "${opticrm.agent.enqueue-poll-ms:600000}", initialDelay = 60000)
    @Transactional
    public void scan() {
        try {
            enqueueQuotes();
            enqueueSalesOrders();
            enqueuePayments();
            enqueueDeliveryTours();
        } catch (Exception e) {
            log.error("ExportEnqueuerJob failure : {}", e.getMessage(), e);
        }
    }

    private void enqueueQuotes() {
        String sql = """
            SELECT TOP 100 q.id, q.tenant_id, q.quote_number, q.quote_date,
                           q.total, q.subtotal, q.account_id
            FROM quotes q
            WHERE q.status = 'ACCEPTED'
              AND (q.sage_export_status IS NULL OR q.sage_export_status = '')
              AND NOT EXISTS (
                SELECT 1 FROM sage_export_queue s
                WHERE s.entity_type = 'QUOTE' AND s.entity_id = q.id
                  AND s.status IN ('PENDING','SENT','RETRY','DONE')
              )
            """;
        process(sql, "QUOTE", 0);
    }

    private void enqueueSalesOrders() {
        String sql = """
            SELECT TOP 100 o.id, o.tenant_id, o.order_number, o.order_date,
                           o.total, o.subtotal, o.account_id
            FROM sales_orders o
            WHERE o.status = 'CONFIRMED'
              AND (o.sage_export_status IS NULL OR o.sage_export_status = '')
              AND NOT EXISTS (
                SELECT 1 FROM sage_export_queue s
                WHERE s.entity_type = 'SALES_ORDER' AND s.entity_id = o.id
                  AND s.status IN ('PENDING','SENT','RETRY','DONE')
              )
            """;
        process(sql, "SALES_ORDER", 1);
    }

    private void enqueuePayments() {
        String sql = """
            SELECT TOP 100 p.id, p.tenant_id, p.payment_number, p.payment_date,
                           p.amount, p.payment_method, p.account_id
            FROM payments p
            WHERE p.status = 'CONFIRMED'
              AND (p.sage_export_status IS NULL OR p.sage_export_status = '')
              AND NOT EXISTS (
                SELECT 1 FROM sage_export_queue s
                WHERE s.entity_type = 'PAYMENT' AND s.entity_id = p.id
                  AND s.status IN ('PENDING','SENT','RETRY','DONE')
              )
            """;
        process(sql, "PAYMENT", null);
    }

    private void enqueueDeliveryTours() {
        String sql = """
            SELECT TOP 100 dt.id, dt.tenant_id, dt.tour_date, dt.zone
            FROM delivery_tour dt
            WHERE dt.status = 'CLOSED'
              AND (dt.sage_export_status IS NULL OR dt.sage_export_status = '')
              AND NOT EXISTS (
                SELECT 1 FROM sage_export_queue s
                WHERE s.entity_type = 'DELIVERY' AND s.entity_id = dt.id
                  AND s.status IN ('PENDING','SENT','RETRY','DONE')
              )
            """;
        process(sql, "DELIVERY", 3);
    }

    @SuppressWarnings("unchecked")
    private void process(String sql, String entityType, Integer sageDocType) {
        Query q = em.createNativeQuery(sql);
        List<Object[]> rows = q.getResultList();

        for (Object[] row : rows) {
            UUID entityId = (UUID) row[0];
            UUID tenantId = (UUID) row[1];
            String payload = buildPayload(entityType, entityId, tenantId);

            Query insert = em.createNativeQuery("""
                INSERT INTO sage_export_queue
                    (id, tenant_id, entity_type, entity_id, sage_doc_type,
                     action, status, payload, retry_count, max_retries, created_at)
                VALUES (NEWID(), :tid, :et, :eid, :dt,
                        'CREATE', 'PENDING', :pl, 0, 3, GETUTCDATE())
                """);
            insert.setParameter("tid", tenantId);
            insert.setParameter("et", entityType);
            insert.setParameter("eid", entityId);
            insert.setParameter("dt", sageDocType);
            insert.setParameter("pl", payload);
            insert.executeUpdate();

            // Marquer la source comme enfilée pour ne pas re-scanner
            String table = switch (entityType) {
                case "QUOTE"       -> "quotes";
                case "SALES_ORDER" -> "sales_orders";
                case "PAYMENT"     -> "payments";
                case "DELIVERY"    -> "delivery_tour";
                default -> null;
            };
            if (table != null) {
                em.createNativeQuery("UPDATE " + table
                        + " SET sage_export_status = 'PENDING' WHERE id = :id")
                  .setParameter("id", entityId)
                  .executeUpdate();
            }
        }
        if (!rows.isEmpty()) {
            log.info("[ExportEnqueuer] {} {} enfilés", rows.size(), entityType);
        }
    }

    /** Construit un payload JSON minimal — l'agent enrichira via Sage si besoin. */
    private String buildPayload(String entityType, UUID entityId, UUID tenantId) {
        try {
            // L'agent récupèrera le détail complet via un endpoint dédié si besoin.
            // Pour l'instant on passe juste les identifiants (l'agent appelle l'API CRM
            // pour récupérer le détail du document avant écriture Sage).
            return objectMapper.writeValueAsString(Map.of(
                    "entityType", entityType,
                    "entityId", entityId.toString(),
                    "tenantId", tenantId.toString()
            ));
        } catch (Exception e) {
            return "{}";
        }
    }
}

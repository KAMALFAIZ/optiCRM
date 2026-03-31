package com.opticrm.api.migration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * ETL Service: SQL Server (GROUPE_ALBOUGHAZE) → OptiCRM PostgreSQL
 *
 * La connexion SQL Server est créée on-demand via DriverManager
 * (pas de bean DataSource secondaire → évite le conflit Flyway).
 *
 * Migration order:
 *   1. Territories  (from Région carte)
 *   2. Users        (from Représentant → rôle COMMERCIAL)
 *   3. Catégories   (Catalogue 1 → 2 → 3, hiérarchique)
 *   4. Produits     (Code article / Désignation)
 *   5. Comptes      (Clients → accounts)
 *   6. Factures/BL  (N° Pièce → invoices + invoice_lines)
 *   7. Stock        (simulé : 50-500 unités / produit)
 *   8. Paiements    (simulés pour BLs > 60 jours)
 */
@Service
@Slf4j
public class DataMigrationService {

    // -----------------------------------------------------------------------
    // Source SQL Server queries
    // -----------------------------------------------------------------------

    /** Main BL query — used for territories, users, categories, products, invoices */
    private static final String SOURCE_QUERY = """
        SELECT
            ca.[Code client]         AS code_client,
            ca.[Intitulé client]     AS intitule_client,
            ca.[N° Pièce]           AS num_piece,
            ca.Référence             AS reference,
            ca.[Date BL]             AS date_bl,
            ca.[Code article]        AS code_article,
            ca.Désignation           AS designation,
            ca.[Catalogue 1]         AS catalogue1,
            ca.[Catalogue 2]         AS catalogue2,
            ca.[Catalogue 3]         AS catalogue3,
            ca.[Prix unitaire]       AS prix_ht,
            ca.[Prix unitaire TTC]   AS prix_ttc,
            ca.Quantité              AS quantite,
            ca.[Montant HT Net]      AS montant_ht,
            ca.[Montant TTC Net]     AS montant_ttc,
            ca.Souche                AS souche,
            ca.Région                AS region_bl,
            ca.Catégorie_            AS categorie_bl,
            ca.Représentant          AS representant,
            ca.GROUPE_               AS groupe,
            ca.Ville                 AS ville_bl,
            ca.[Région carte]        AS region_carte,
            ca.Coût                  AS cout,
            cl.ICE_                  AS ice,
            cl.RC_                   AS rc
        FROM  Chiffre_Affaires_Groupe ca
        INNER JOIN Clients cl
               ON  ca.DB_Id        = cl.DB_Id
               AND ca.[Code client] = cl.[Code client]
        """;

    /**
     * Dedicated DISTINCT clients query — used for accounts migration.
     * Provides clean, de-duplicated client data with full contact info.
     */
    private static final String CLIENTS_QUERY = """
        SELECT DISTINCT
            ca.[Code client]             AS code_client,
            ca.[Intitulé client]         AS intitule_client,
            ca.Représentant              AS representant,
            ca.[Région carte]            AS region_carte,
            cl.Qualité                   AS qualite,
            cl.Ville                     AS ville_client,
            cl.Adresse                   AS adresse,
            cl.Région                    AS region_client,
            cl.Pays                      AS pays,
            cl.Téléphone                 AS telephone,
            cl.Email                     AS email_client,
            cl.Site                      AS site,
            cl.Catégorie_                AS categorie_client,
            cl.ICE_                      AS ice,
            cl.Latitude_                 AS latitude,
            cl.Longitude_                AS longitude,
            cl.Région_                   AS region_officielle,
            cl.RC_                       AS rc
        FROM  Chiffre_Affaires_Groupe ca
        INNER JOIN Clients cl
               ON  ca.DB_Id        = cl.DB_Id
               AND ca.[Code client] = cl.[Code client]
        """;

    // -----------------------------------------------------------------------
    // Config from application.yml
    // -----------------------------------------------------------------------
    @Value("${migration.source.enabled:false}")
    private boolean sourceEnabled;

    @Value("${migration.source.url:}")
    private String sourceUrl;

    @Value("${migration.source.username:}")
    private String sourceUsername;

    @Value("${migration.source.password:}")
    private String sourcePassword;

    // -----------------------------------------------------------------------
    // Dependencies (PostgreSQL target only)
    // -----------------------------------------------------------------------
    @Autowired
    private JdbcTemplate jdbcTemplate;   // SQL Server primary

    @Autowired
    private PasswordEncoder passwordEncoder;

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------
    private final AtomicBoolean running   = new AtomicBoolean(false);
    private volatile String lastStatus    = "Aucune migration effectuée";
    private volatile Map<String, Object> lastStats = new LinkedHashMap<>();

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    public Map<String, Object> getStatus() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("running", running.get());
        s.put("lastStatus", lastStatus);
        s.put("stats", lastStats);
        s.put("sourceConfigured", sourceEnabled && !sourceUrl.isBlank());
        return s;
    }

    public Map<String, Object> runMigration() {
        if (!running.compareAndSet(false, true)) {
            throw new IllegalStateException("Migration déjà en cours");
        }
        try {
            return doMigrate();
        } finally {
            running.set(false);
        }
    }

    /**
     * Enrichit les contacts existants avec les données manquantes depuis SQL Server :
     * email, salutation (qualité), téléphone.
     * Met aussi à jour le téléphone des comptes (accounts) si absent.
     */
    public Map<String, Object> enrichContacts() {
        if (!running.compareAndSet(false, true)) {
            throw new IllegalStateException("Une opération de migration est déjà en cours");
        }
        try {
            return doEnrichContacts();
        } finally {
            running.set(false);
        }
    }

    // -----------------------------------------------------------------------
    // Main orchestrator
    // -----------------------------------------------------------------------

    private Map<String, Object> doMigrate() {
        if (!sourceEnabled || sourceUrl.isBlank()) {
            throw new IllegalStateException(
                    "Source SQL Server non configurée. Vérifiez migration.source.enabled=true et l'URL.");
        }

        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║  DÉBUT MIGRATION GROUPE_ALBOUGHAZE → OPTICRM        ║");
        log.info("╚══════════════════════════════════════════════════════╝");
        lastStatus = "Chargement des données source...";
        lastStats  = new LinkedHashMap<>();

        // 1. Load all rows from SQL Server via direct JDBC
        log.info("→ Connexion SQL Server: {}", sourceUrl);
        List<Map<String, Object>> rows;
        List<Map<String, Object>> clientRows;
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            try (Connection conn = DriverManager.getConnection(sourceUrl, sourceUsername, sourcePassword)) {
                conn.setAutoCommit(false);
                rows       = fetchRows(conn, SOURCE_QUERY);
                clientRows = fetchRows(conn, CLIENTS_QUERY);
            }
        } catch (Exception e) {
            lastStatus = "ERREUR connexion source: " + e.getMessage();
            throw new RuntimeException("Impossible de lire depuis GROUPE_ALBOUGHAZE: " + e.getMessage(), e);
        }

        log.info("→ {} lignes BL chargées depuis GROUPE_ALBOUGHAZE", rows.size());
        log.info("→ {} clients distincts chargés", clientRows.size());
        lastStats.put("lignes_source", rows.size());
        lastStats.put("clients_source", clientRows.size());

        // 2. Resolve system IDs from PostgreSQL
        UUID warehouseId   = q1UUID("SELECT TOP 1 id FROM warehouses WHERE is_default = 1");
        UUID roleCommId    = q1UUID("SELECT id FROM roles WHERE name = 'COMMERCIAL'");
        UUID adminId       = q1UUID("SELECT id FROM users WHERE email = 'admin@opticrm.com'");
        UUID taxRate20Id   = q1UUID("SELECT id FROM tax_rates WHERE code = 'TVA20'");
        UUID ptNet30Id     = q1UUID("SELECT id FROM payment_terms WHERE code = 'NET30'");

        String defaultPwd = passwordEncoder.encode("Groupe2024!");

        // 3. Run all ETL steps
        lastStatus = "Migration des territoires...";
        Map<String, UUID> territoryMap = migrateTerritories(rows);
        lastStats.put("territoires", territoryMap.size());
        log.info("✓ Territoires  : {}", territoryMap.size());

        lastStatus = "Migration des utilisateurs (représentants)...";
        Map<String, UUID> userMap = migrateUsers(rows, roleCommId, defaultPwd, adminId);
        lastStats.put("utilisateurs", userMap.size());
        log.info("✓ Utilisateurs : {}", userMap.size());

        lastStatus = "Migration des catégories produits...";
        Map<String, UUID> categoryMap = migrateCategories(rows);
        lastStats.put("categories", categoryMap.size());
        log.info("✓ Catégories   : {}", categoryMap.size());

        lastStatus = "Migration des produits...";
        Map<String, UUID> productMap = migrateProducts(rows, categoryMap, taxRate20Id);
        lastStats.put("produits", productMap.size());
        log.info("✓ Produits     : {}", productMap.size());

        lastStatus = "Migration des comptes clients...";
        Map<String, UUID> accountMap = migrateAccounts(clientRows, territoryMap, userMap, ptNet30Id, adminId);
        lastStats.put("comptes", accountMap.size());
        log.info("✓ Comptes      : {}", accountMap.size());

        lastStatus = "Migration des factures / BL...";
        int[] invoiceResult = migrateInvoices(rows, accountMap, userMap, productMap, ptNet30Id, adminId);
        lastStats.put("factures", invoiceResult[0]);
        lastStats.put("lignes_facture", invoiceResult[1]);
        log.info("✓ Factures     : {} ({} lignes)", invoiceResult[0], invoiceResult[1]);

        lastStatus = "Initialisation du stock...";
        int stockCount = migrateStock(productMap, warehouseId, adminId);
        lastStats.put("stock_entrees", stockCount);
        log.info("✓ Stock        : {} produits initialisés", stockCount);

        lastStatus = "Génération des paiements...";
        int payCount = migratePayments(adminId);
        lastStats.put("paiements", payCount);
        log.info("✓ Paiements    : {}", payCount);

        lastStatus = "✓ Migration terminée";
        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║  MIGRATION TERMINÉE — Stats: {}               ║", lastStats);
        log.info("╚══════════════════════════════════════════════════════╝");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Migration terminée avec succès");
        result.put("stats", lastStats);
        return result;
    }

    // -----------------------------------------------------------------------
    // SQL Server fetch (via direct JDBC connection)
    // -----------------------------------------------------------------------

    private List<Map<String, Object>> fetchRows(Connection conn, String query) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(query)) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            List<String> colNames = new ArrayList<>();
            for (int i = 1; i <= colCount; i++) {
                colNames.add(meta.getColumnLabel(i).toLowerCase());
            }

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= colCount; i++) {
                    row.put(colNames.get(i - 1), rs.getObject(i));
                }
                rows.add(row);
            }
        }
        return rows;
    }

    // -----------------------------------------------------------------------
    // 1. Territories (from Région carte)
    // -----------------------------------------------------------------------

    private Map<String, UUID> migrateTerritories(List<Map<String, Object>> rows) {
        Map<String, UUID> result = new LinkedHashMap<>();

        Set<String> regions = rows.stream()
                .map(r -> str(r.get("region_carte")))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String region : regions) {
            List<UUID> existing = jdbcTemplate.query(
                    "SELECT id FROM territories WHERE name = ?",
                    (rs, n) -> UUID.fromString(rs.getString(1)), region);

            if (!existing.isEmpty()) { result.put(region, existing.get(0)); continue; }

            UUID id = UUID.randomUUID();
            jdbcTemplate.update(
                    "INSERT INTO territories (id, name, country, created_at) VALUES (?, ?, 'Maroc', GETUTCDATE())",
                    id, region);
            result.put(region, id);
        }
        return result;
    }

    // -----------------------------------------------------------------------
    // 2. Users (Représentants → COMMERCIAL)
    // -----------------------------------------------------------------------

    private Map<String, UUID> migrateUsers(List<Map<String, Object>> rows, UUID roleId,
                                            String defaultPwd, UUID adminId) {
        Map<String, UUID> result = new LinkedHashMap<>();

        Set<String> reps = rows.stream()
                .map(r -> str(r.get("representant")))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String rep : reps) {
            String email = generateEmail(rep);
            List<UUID> existing = jdbcTemplate.query(
                    "SELECT id FROM users WHERE email = ?",
                    (rs, n) -> UUID.fromString(rs.getString(1)), email);

            if (!existing.isEmpty()) { result.put(rep, existing.get(0)); continue; }

            String[] parts     = rep.trim().split("\\s+", 2);
            String   firstName = capitalize(parts[0]);
            String   lastName  = parts.length > 1 ? parts[1] : parts[0];

            UUID id = UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO users
                        (id, email, password_hash, first_name, last_name, role_id,
                         is_active, preferred_language, timezone, created_at, updated_at, version)
                    VALUES (?, ?, ?, ?, ?, ?, 1, 'fr', 'Africa/Casablanca', GETUTCDATE(), GETUTCDATE(), 0)
                    """,
                    id, email, defaultPwd, firstName, lastName, roleId);

            result.put(rep, id);
            log.debug("  Représentant créé: {} → {}", rep, email);
        }
        return result;
    }

    // -----------------------------------------------------------------------
    // 3. Product Categories (Catalogue 1 → 2 → 3)
    // -----------------------------------------------------------------------

    private Map<String, UUID> migrateCategories(List<Map<String, Object>> rows) {
        Map<String, UUID> result = new LinkedHashMap<>();
        Map<String, Set<String>> c2ByC1  = new LinkedHashMap<>();
        Map<String, Set<String>> c3ByKey = new LinkedHashMap<>();

        for (Map<String, Object> row : rows) {
            String c1 = str(row.get("catalogue1"));
            String c2 = str(row.get("catalogue2"));
            String c3 = str(row.get("catalogue3"));
            if (c1.isBlank()) continue;
            c2ByC1.computeIfAbsent(c1, k -> new LinkedHashSet<>());
            if (!c2.isBlank()) {
                c2ByC1.get(c1).add(c2);
                if (!c3.isBlank())
                    c3ByKey.computeIfAbsent(c1 + "§" + c2, k -> new LinkedHashSet<>()).add(c3);
            }
        }

        for (Map.Entry<String, Set<String>> e1 : c2ByC1.entrySet()) {
            String c1  = e1.getKey();
            UUID   id1 = upsertCategory(c1, null, 10);
            result.put(c1, id1);
            for (String c2 : e1.getValue()) {
                UUID id2 = upsertCategory(c2, id1, 20);
                result.put(c1 + ">" + c2, id2);
                for (String c3 : c3ByKey.getOrDefault(c1 + "§" + c2, Set.of())) {
                    UUID id3 = upsertCategory(c3, id2, 30);
                    result.put(c1 + ">" + c2 + ">" + c3, id3);
                }
            }
        }
        return result;
    }

    private UUID upsertCategory(String name, UUID parentId, int sortOrder) {
        String code = toCatCode(name);
        // Use ON CONFLICT DO NOTHING so re-runs are idempotent
        // (unique constraint on product_categories.code is code-only, not (code, parent_id))
        jdbcTemplate.update("""
                IF NOT EXISTS (SELECT 1 FROM product_categories WHERE code = ?)
                INSERT INTO product_categories (id, code, name, parent_category_id, sort_order, created_at)
                VALUES (NEWID(), ?, ?, ?, ?, GETUTCDATE())
                """, code, code, name, parentId, sortOrder);
        // Always fetch the real ID (works whether we just inserted or it already existed)
        return jdbcTemplate.queryForObject(
                "SELECT id FROM product_categories WHERE code = ?",
                (rs, n) -> UUID.fromString(rs.getString(1)), code);
    }

    // -----------------------------------------------------------------------
    // 4. Products
    // -----------------------------------------------------------------------

    private Map<String, UUID> migrateProducts(List<Map<String, Object>> rows,
                                               Map<String, UUID> categoryMap,
                                               UUID taxRate20Id) {
        Map<String, UUID> result = new LinkedHashMap<>();
        Map<String, Map<String, Object>> unique = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String code = str(row.get("code_article"));
            if (!code.isBlank()) unique.putIfAbsent(code, row);
        }

        for (Map.Entry<String, Map<String, Object>> e : unique.entrySet()) {
            String artCode = e.getKey();
            Map<String, Object> r = e.getValue();

            List<UUID> existing = jdbcTemplate.query(
                    "SELECT id FROM products WHERE code = ?",
                    (rs, n) -> UUID.fromString(rs.getString(1)), artCode);
            if (!existing.isEmpty()) { result.put(artCode, existing.get(0)); continue; }

            String     name  = str(r.get("designation"));
            if (name.isBlank()) name = artCode;
            BigDecimal price = posOrDefault(dec(r.get("prix_ht")), BigDecimal.ONE);
            BigDecimal cost  = dec(r.get("cout"));
            if (cost.compareTo(BigDecimal.ZERO) <= 0) cost = price.multiply(new BigDecimal("0.65"));
            UUID       catId = resolveCategoryId(r, categoryMap);

            UUID id = UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO products
                        (id, code, name, category_id, unit_price, cost_price, currency,
                         is_active, is_sellable, is_purchasable, is_stockable,
                         default_tax_rate_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'MAD', 1, 1, 1, 1, ?, GETUTCDATE(), GETUTCDATE())
                    """,
                    id, artCode, name, catId, price, cost, taxRate20Id);
            result.put(artCode, id);
        }
        return result;
    }

    // -----------------------------------------------------------------------
    // 5. Accounts (Clients)
    // -----------------------------------------------------------------------

    private Map<String, UUID> migrateAccounts(List<Map<String, Object>> clientRows,
                                               Map<String, UUID> territoryMap,
                                               Map<String, UUID> userMap,
                                               UUID ptNet30Id, UUID adminId) {
        Map<String, UUID> result = new LinkedHashMap<>();
        // clientRows already DISTINCT from dedicated query — iterate directly
        // Deduplicate by code_client in case of residual duplicates
        Map<String, Map<String, Object>> unique = new LinkedHashMap<>();
        for (Map<String, Object> row : clientRows) {
            String code = str(row.get("code_client"));
            if (!code.isBlank()) unique.putIfAbsent(code, row);
        }

        for (Map.Entry<String, Map<String, Object>> e : unique.entrySet()) {
            String codeClient = e.getKey();
            Map<String, Object> r = e.getValue();
            String name = str(r.get("intitule_client"));
            if (name.isBlank()) name = codeClient;

            // Check by external code first (most reliable), fallback to name
            List<UUID> existing = jdbcTemplate.query(
                    "SELECT TOP 1 id FROM accounts WHERE name = ?",
                    (rs, n) -> UUID.fromString(rs.getString(1)), name);
            if (!existing.isEmpty()) { result.put(codeClient, existing.get(0)); continue; }

            String rep       = str(r.get("representant"));
            UUID   assignedTo = userMap.getOrDefault(rep, adminId);
            UUID   territory  = territoryMap.get(str(r.get("region_carte")));

            UUID id = UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO accounts
                        (id, name, account_type, billing_street, billing_city, billing_state,
                         billing_country, website, phone, vat_number, ice, rc,
                         payment_terms_id, assigned_to_id, territory_id,
                         created_by_id, revenue_currency, created_at, updated_at)
                    VALUES (?, ?, 'CUSTOMER', ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, 'MAD', GETUTCDATE(), GETUTCDATE())
                    """,
                    id, name,
                    truncNull(r.get("adresse"),        255),  // billing_street
                    truncNull(r.get("ville_client"),   100),  // billing_city
                    truncNull(r.get("region_client"),  100),  // billing_state
                    truncNull(r.get("pays"),            100),  // billing_country
                    truncNull(r.get("site"),            255),  // website
                    truncNull(r.get("telephone"),        20),  // phone VARCHAR(20)
                    truncNull(r.get("ice"),              20),  // vat_number VARCHAR(20)
                    truncNull(r.get("ice"),              15),  // ice VARCHAR(15)
                    truncNull(r.get("rc"),               50),  // rc VARCHAR(50)
                    ptNet30Id, assignedTo, territory, adminId);

            result.put(codeClient, id);
        }
        return result;
    }

    // -----------------------------------------------------------------------
    // 6. Invoices + Lines (BL groupés par N° Pièce)
    // -----------------------------------------------------------------------

    private int[] migrateInvoices(List<Map<String, Object>> rows,
                                   Map<String, UUID> accountMap,
                                   Map<String, UUID> userMap,
                                   Map<String, UUID> productMap,
                                   UUID ptNet30Id, UUID adminId) {

        // Group by num_piece + code_client
        Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String numPiece   = str(row.get("num_piece"));
            String codeClient = str(row.get("code_client"));
            if (numPiece.isBlank() || codeClient.isBlank()) continue;
            groups.computeIfAbsent(numPiece + "::" + codeClient, k -> new ArrayList<>()).add(row);
        }

        int invoiceCount = 0, lineCount = 0;

        for (List<Map<String, Object>> group : groups.values()) {
            Map<String, Object> hdr       = group.get(0);
            String              numPiece  = str(hdr.get("num_piece"));
            String              codeClient = str(hdr.get("code_client"));

            // Skip if already exists
            Long cnt = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM invoices WHERE invoice_number = ?", Long.class, numPiece);
            if (cnt != null && cnt > 0) continue;

            UUID accountId = accountMap.get(codeClient);
            if (accountId == null) continue;

            String    rep       = str(hdr.get("representant"));
            UUID      createdBy = userMap.getOrDefault(rep, adminId);
            LocalDate invDate   = dateOrDefault(hdr.get("date_bl"), LocalDate.now().minusMonths(3));
            LocalDate dueDate   = invDate.plusDays(30);

            // Compute totals
            BigDecimal totalHT  = BigDecimal.ZERO;
            BigDecimal totalTTC = BigDecimal.ZERO;
            for (Map<String, Object> line : group) {
                totalHT  = totalHT.add(dec(line.get("montant_ht")));
                totalTTC = totalTTC.add(dec(line.get("montant_ttc")));
            }
            BigDecimal taxAmount = totalTTC.subtract(totalHT);

            // Status logic: >60 jours → paid, >30j non payé → overdue, sinon → sent
            boolean   isPaid   = invDate.isBefore(LocalDate.now().minusDays(60));
            boolean   isOverdue = !isPaid && dueDate.isBefore(LocalDate.now());
            String    status   = isPaid ? "paid" : (isOverdue ? "overdue" : "sent");
            BigDecimal paid    = isPaid ? totalTTC : BigDecimal.ZERO;

            UUID invoiceId = UUID.randomUUID();
            jdbcTemplate.update("""
                    INSERT INTO invoices
                        (id, invoice_number, invoice_type, status, account_id,
                         invoice_date, due_date, subtotal, tax_amount, total, amount_paid,
                         currency, payment_terms_id, billing_name,
                         created_by_id, created_at, updated_at)
                    VALUES (?, ?, 'invoice', ?, ?, ?, ?, ?, ?, ?, ?, 'MAD', ?, ?, ?, GETUTCDATE(), GETUTCDATE())
                    """,
                    invoiceId, numPiece, status, accountId,
                    java.sql.Date.valueOf(invDate), java.sql.Date.valueOf(dueDate),
                    totalHT, taxAmount, totalTTC, paid,
                    ptNet30Id, str(hdr.get("intitule_client")), createdBy);

            invoiceCount++;

            // Invoice lines
            int sortOrder = 0;
            for (Map<String, Object> lineRow : group) {
                String     artCode   = str(lineRow.get("code_article"));
                UUID       productId = productMap.get(artCode);
                BigDecimal qty       = posOrDefault(dec(lineRow.get("quantite")), BigDecimal.ONE);
                BigDecimal prixHT    = dec(lineRow.get("prix_ht"));
                BigDecimal mntHT     = dec(lineRow.get("montant_ht"));
                BigDecimal mntTTC    = dec(lineRow.get("montant_ttc"));
                BigDecimal lineTA    = mntTTC.subtract(mntHT);

                jdbcTemplate.update("""
                        INSERT INTO invoice_lines
                            (id, invoice_id, product_id, product_code, description,
                             quantity, unit_price, discount_amount,
                             tax_rate, tax_amount, total, sort_order, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 20.00, ?, ?, ?, GETUTCDATE())
                        """,
                        UUID.randomUUID(), invoiceId, productId,
                        blankToNull(artCode), str(lineRow.get("designation")),
                        qty, prixHT, lineTA, mntTTC, sortOrder++);
                lineCount++;
            }
        }
        return new int[]{invoiceCount, lineCount};
    }

    // -----------------------------------------------------------------------
    // 7. Stock (simulated)
    // -----------------------------------------------------------------------

    private int migrateStock(Map<String, UUID> productMap, UUID warehouseId, UUID adminId) {
        int count = 0;
        Random rng = new Random(2024);

        for (UUID productId : productMap.values()) {
            Long cnt = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM stock_levels WHERE product_id = ? AND warehouse_id = ?",
                    Long.class, productId, warehouseId);
            if (cnt != null && cnt > 0) continue;

            int        qty     = 50 + rng.nextInt(451);
            BigDecimal cost    = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(cost_price, unit_price * 0.65) FROM products WHERE id = ?",
                    BigDecimal.class, productId);
            if (cost == null) cost = BigDecimal.ZERO;

            jdbcTemplate.update("""
                    INSERT INTO stock_levels
                        (id, product_id, warehouse_id, quantity_on_hand, quantity_reserved,
                         quantity_on_order, average_cost, last_count_date, updated_at)
                    VALUES (?, ?, ?, ?, 0, 0, ?, CAST(GETDATE() AS DATE), GETUTCDATE())
                    """, UUID.randomUUID(), productId, warehouseId, BigDecimal.valueOf(qty), cost);

            jdbcTemplate.update("""
                    INSERT INTO stock_movements
                        (id, product_id, warehouse_id, movement_type, quantity, unit_cost,
                         quantity_after, reference_type, notes, created_by_id, created_at)
                    VALUES (?, ?, ?, 'INITIAL', ?, ?, ?, 'migration',
                            'Stock initial — migration GROUPE_ALBOUGHAZE', ?, GETUTCDATE())
                    """, UUID.randomUUID(), productId, warehouseId,
                    BigDecimal.valueOf(qty), cost, BigDecimal.valueOf(qty), adminId);

            count++;
        }
        return count;
    }

    // -----------------------------------------------------------------------
    // 8. Payments (simulated for paid invoices)
    // -----------------------------------------------------------------------

    private int migratePayments(UUID adminId) {
        List<Map<String, Object>> paidInvoices = jdbcTemplate.queryForList("""
                SELECT i.id, i.invoice_number, i.account_id, i.total, i.invoice_date
                FROM invoices i
                WHERE i.status = 'paid'
                  AND NOT EXISTS (
                      SELECT 1 FROM payments p WHERE p.reference = i.invoice_number
                  )
                """);

        int count = 0;
        for (Map<String, Object> inv : paidInvoices) {
            UUID      invoiceId = UUID.fromString(inv.get("id").toString());
            String    invNumber = str(inv.get("invoice_number"));
            UUID      accountId = UUID.fromString(inv.get("account_id").toString());
            BigDecimal amount   = dec(inv.get("total"));

            Object    rawDate   = inv.get("invoice_date");
            LocalDate payDate;
            if (rawDate instanceof java.sql.Date sd) payDate = sd.toLocalDate().plusDays(25);
            else payDate = LocalDate.now().minusMonths(1);

            String payNum  = String.format("PAY-%06d", count + 1);
            UUID   payId   = UUID.randomUUID();

            jdbcTemplate.update("""
                    INSERT INTO payments
                        (id, payment_number, account_id, payment_date, amount,
                         currency, payment_method, reference, status, notes,
                         created_by_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'MAD', 'VIREMENT', ?, 'received',
                            'Paiement migré automatiquement', ?, GETUTCDATE(), GETUTCDATE())
                    """,
                    payId, payNum, accountId,
                    java.sql.Date.valueOf(payDate), amount, invNumber, adminId);

            jdbcTemplate.update("""
                    INSERT INTO payment_allocations (id, payment_id, invoice_id, amount, created_at)
                    VALUES (?, ?, ?, ?, GETUTCDATE())
                    """, UUID.randomUUID(), payId, invoiceId, amount);

            jdbcTemplate.update(
                    "UPDATE invoices SET paid_at = GETUTCDATE() WHERE id = ?", invoiceId);

            count++;
        }
        return count;
    }

    // -----------------------------------------------------------------------
    // 9. Enrichissement contacts (2ème passe — email, salutation, téléphone)
    // -----------------------------------------------------------------------

    private Map<String, Object> doEnrichContacts() {
        if (!sourceEnabled || sourceUrl.isBlank()) {
            throw new IllegalStateException(
                    "Source SQL Server non configurée. Vérifiez migration.source.enabled=true et l'URL.");
        }

        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║  ENRICHISSEMENT CONTACTS depuis GROUPE_ALBOUGHAZE   ║");
        log.info("╚══════════════════════════════════════════════════════╝");
        lastStatus = "Chargement des données clients depuis SQL Server...";

        List<Map<String, Object>> clientRows;
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            try (Connection conn = DriverManager.getConnection(sourceUrl, sourceUsername, sourcePassword)) {
                clientRows = fetchRows(conn, CLIENTS_QUERY);
            }
        } catch (Exception e) {
            lastStatus = "ERREUR connexion source: " + e.getMessage();
            throw new RuntimeException("Impossible de lire depuis GROUPE_ALBOUGHAZE: " + e.getMessage(), e);
        }
        log.info("→ {} clients chargés depuis SQL Server", clientRows.size());
        lastStatus = "Enrichissement des contacts en cours...";

        int contactsEnrichis = 0;
        int comptesEnrichis  = 0;

        for (Map<String, Object> r : clientRows) {
            String name      = str(r.get("intitule_client"));
            String qualite   = str(r.get("qualite"));
            String email     = truncNull(r.get("email_client"), 255);
            String telephone = truncNull(r.get("telephone"), 20);

            if (name.isBlank()) continue;

            // 1. Enrichir le compte (phone si absent)
            if (telephone != null) {
                int rows = jdbcTemplate.update("""
                        UPDATE accounts SET phone = ?, updated_at = GETUTCDATE()
                        WHERE name = ? AND (phone IS NULL OR phone = '')
                        """, telephone, name);
                if (rows > 0) comptesEnrichis++;
            }

            // 2. Trouver le contact lié au compte
            List<UUID> contactIds = jdbcTemplate.query("""
                    SELECT TOP 1 c.id FROM contacts c
                    JOIN accounts a ON c.account_id = a.id
                    WHERE a.name = ?
                    """, (rs, n) -> UUID.fromString(rs.getString(1)), name);

            if (contactIds.isEmpty()) continue;
            UUID contactId = contactIds.get(0);

            // 3. Mapper la salutation depuis qualité
            String salutation = mapSalutation(qualite);

            // 4. Mettre à jour le contact (COALESCE : on ne remplace que si null/vide)
            jdbcTemplate.update("""
                    UPDATE contacts SET
                        salutation   = CASE WHEN salutation IS NULL OR salutation = '' THEN ? ELSE salutation END,
                        email        = CASE WHEN email IS NULL OR email = ''           THEN ? ELSE email END,
                        phone_office = CASE WHEN phone_office IS NULL OR phone_office = '' THEN ? ELSE phone_office END,
                        updated_at   = GETUTCDATE()
                    WHERE id = ?
                    """, salutation, email, telephone, contactId);
            contactsEnrichis++;
        }

        // 5. search_vector update skipped — not applicable for SQL Server target
        log.info("→ Mise à jour des vecteurs de recherche ignorée (non applicable pour SQL Server).");

        log.info("✓ Contacts enrichis  : {}", contactsEnrichis);
        log.info("✓ Comptes enrichis   : {}", comptesEnrichis);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("clients_source",    clientRows.size());
        result.put("contacts_enrichis", contactsEnrichis);
        result.put("comptes_enrichis",  comptesEnrichis);
        lastStatus = String.format("Enrichissement terminé — %d contacts, %d comptes mis à jour",
                contactsEnrichis, comptesEnrichis);
        lastStats  = result;
        return result;
    }

    /** Mappe la valeur Qualité du SQL Server vers une salutation standard */
    private String mapSalutation(String qualite) {
        if (qualite == null || qualite.isBlank()) return null;
        String q = qualite.trim().toLowerCase();
        if (q.startsWith("mme") || q.startsWith("madame")) return "Mme";
        if (q.equals("m.") || q.startsWith("mr") || q.startsWith("m ") || q.equals("m")) return "M.";
        if (q.startsWith("dr")) return "Dr.";
        if (q.startsWith("pr")) return "Pr.";
        return truncNull(qualite, 20);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private UUID q1UUID(String sql) {
        try {
            return jdbcTemplate.queryForObject(sql, (rs, n) -> UUID.fromString(rs.getString(1)));
        } catch (Exception e) {
            log.warn("q1UUID [{}]: {}", sql, e.getMessage());
            return null;
        }
    }

    private String str(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    private BigDecimal dec(Object o) {
        if (o == null) return BigDecimal.ZERO;
        try {
            if (o instanceof BigDecimal bd) return bd;
            if (o instanceof Number n) return new BigDecimal(n.toString());
            return new BigDecimal(o.toString().replace(",", ".").trim());
        } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private BigDecimal posOrDefault(BigDecimal v, BigDecimal def) {
        return v.compareTo(BigDecimal.ZERO) > 0 ? v : def;
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /** Truncate to maxLen and return null if blank */
    private String truncNull(Object o, int maxLen) {
        String s = str(o);
        if (s.isBlank()) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    private LocalDate dateOrDefault(Object o, LocalDate def) {
        if (o == null) return def;
        try {
            if (o instanceof java.sql.Date d)      return d.toLocalDate();
            if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
            return LocalDate.parse(o.toString().substring(0, 10));
        } catch (Exception e) { return def; }
    }

    private String generateEmail(String repName) {
        // Must match the logic used when creating users manually:
        // '/' and '-' → '.', spaces → '.', other specials removed
        String n = repName.trim().toLowerCase()
                .replace("é","e").replace("è","e").replace("ê","e").replace("ë","e")
                .replace("à","a").replace("â","a").replace("ä","a")
                .replace("î","i").replace("ï","i")
                .replace("ô","o").replace("ö","o")
                .replace("ù","u").replace("û","u").replace("ü","u")
                .replace("ç","c")
                .replace("/", ".").replace("-", ".")
                .replaceAll("[^a-z0-9\\s.]", "")
                .replaceAll("\\s+", ".")
                .replaceAll("\\.{2,}", ".")
                .replaceAll("^\\.|\\.$$", "");
        return n + "@groupe-alboughaze.ma";
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private String toCatCode(String name) {
        String n = name.toUpperCase()
                .replace("É","E").replace("È","E").replace("Ê","E").replace("Ë","E")
                .replace("À","A").replace("Â","A").replace("Ä","A")
                .replace("Î","I").replace("Ï","I")
                .replace("Ô","O").replace("Ö","O")
                .replace("Ù","U").replace("Û","U").replace("Ü","U")
                .replace("Ç","C")
                .replaceAll("[^A-Z0-9]", "_").replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        String code = "CAT_" + n;
        return code.length() > 49 ? code.substring(0, 49) : code;
    }

    private UUID resolveCategoryId(Map<String, Object> row, Map<String, UUID> categoryMap) {
        String c1 = str(row.get("catalogue1"));
        String c2 = str(row.get("catalogue2"));
        String c3 = str(row.get("catalogue3"));
        if (!c3.isBlank() && !c2.isBlank() && !c1.isBlank()) {
            UUID id = categoryMap.get(c1 + ">" + c2 + ">" + c3);
            if (id != null) return id;
        }
        if (!c2.isBlank() && !c1.isBlank()) {
            UUID id = categoryMap.get(c1 + ">" + c2);
            if (id != null) return id;
        }
        return c1.isBlank() ? null : categoryMap.get(c1);
    }
}

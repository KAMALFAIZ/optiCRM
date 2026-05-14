package com.opticrm.core.objectives.service;

import com.opticrm.core.objectives.dto.*;
import com.opticrm.core.objectives.entity.CommercialObjective;
import com.opticrm.core.objectives.entity.SaleEntry;
import com.opticrm.core.objectives.repository.CommercialObjectiveRepository;
import com.opticrm.core.objectives.repository.SaleEntryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ObjectivesService {

    private final CommercialObjectiveRepository objectiveRepo;
    private final SaleEntryRepository saleRepo;

    @PersistenceContext
    private EntityManager em;

    // Product info fetched via JPQL (avoids crm-stock compile dependency)
    record ProductInfo(String code, String name) {}

    // ─────────────────────────────────────────────────────────────────────────
    // OBJECTIFS
    // ─────────────────────────────────────────────────────────────────────────

    public List<ObjectiveDto> listObjectives(int year, Integer month, UUID userId) {
        var list = objectiveRepo.findFiltered(year, month, userId);
        var productIds = list.stream().map(CommercialObjective::getProductId).collect(Collectors.toSet());
        var products = fetchProducts(productIds);
        return list.stream().map(o -> toObjectiveDto(o, products)).toList();
    }

    @Transactional
    public ObjectiveDto upsertObjective(CreateObjectiveRequest req) {
        var existing = objectiveRepo.findByUserIdAndProductIdAndPeriodYearAndPeriodMonth(
                req.userId(), req.productId(), req.periodYear(), req.periodMonth());

        CommercialObjective obj = existing.orElseGet(CommercialObjective::new);
        obj.setUserId(req.userId());
        obj.setProductId(req.productId());
        obj.setPeriodYear(req.periodYear());
        obj.setPeriodMonth(req.periodMonth());
        obj.setTargetQty(req.targetQty());
        obj.setTargetAmount(req.targetAmount());
        obj.setNotes(req.notes());
        obj = objectiveRepo.save(obj);

        var products = fetchProducts(Set.of(req.productId()));
        return toObjectiveDto(obj, products);
    }

    @Transactional
    public void deleteObjective(UUID id) {
        objectiveRepo.deleteById(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VENTES
    // ─────────────────────────────────────────────────────────────────────────

    public List<SaleEntryDto> listSales(int year, Integer month, UUID userId, UUID productId) {
        var list = saleRepo.findFiltered(year, month, userId, productId);
        var productIds = list.stream().map(SaleEntry::getProductId).collect(Collectors.toSet());
        var products = fetchProducts(productIds);
        return list.stream().map(s -> toSaleDto(s, products)).toList();
    }

    @Transactional
    public SaleEntryDto createSale(CreateSaleEntryRequest req) {
        SaleEntry sale = SaleEntry.builder()
                .userId(req.userId())
                .productId(req.productId())
                .accountId(req.accountId())
                .saleDate(req.saleDate())
                .qty(req.qty())
                .unitPrice(req.unitPrice())
                .notes(req.notes())
                .build();
        sale = saleRepo.save(sale);
        em.refresh(sale);
        var products = fetchProducts(Set.of(req.productId()));
        return toSaleDto(sale, products);
    }

    @Transactional
    public SaleEntryDto updateSale(UUID id, CreateSaleEntryRequest req) {
        SaleEntry sale = saleRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Vente introuvable: " + id));
        sale.setUserId(req.userId());
        sale.setProductId(req.productId());
        sale.setAccountId(req.accountId());
        sale.setSaleDate(req.saleDate());
        sale.setQty(req.qty());
        sale.setUnitPrice(req.unitPrice());
        sale.setNotes(req.notes());
        sale = saleRepo.save(sale);
        em.refresh(sale);
        var products = fetchProducts(Set.of(req.productId()));
        return toSaleDto(sale, products);
    }

    @Transactional
    public void deleteSale(UUID id) {
        saleRepo.deleteById(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRACKING KPI
    // ─────────────────────────────────────────────────────────────────────────

    public List<ObjectiveTrackingDto> getTracking(int year, Integer month, UUID userId) {
        var objectives = objectiveRepo.findFiltered(year, month, userId);
        var sales = saleRepo.findFiltered(year, month, userId, null);

        Set<UUID> productIds = new HashSet<>();
        objectives.forEach(o -> productIds.add(o.getProductId()));
        sales.forEach(s -> productIds.add(s.getProductId()));
        var products = fetchProducts(productIds);

        record Key(UUID userId, UUID productId) {}
        Map<Key, BigDecimal> salesQty = new HashMap<>();
        Map<Key, BigDecimal> salesAmt = new HashMap<>();
        for (SaleEntry s : sales) {
            var k = new Key(s.getUserId(), s.getProductId());
            salesQty.merge(k, s.getQty(), BigDecimal::add);
            BigDecimal total = s.getTotalAmount() != null
                    ? s.getTotalAmount()
                    : s.getQty().multiply(s.getUnitPrice());
            salesAmt.merge(k, total, BigDecimal::add);
        }

        List<ObjectiveTrackingDto> result = new ArrayList<>();
        Map<UUID, String> userNames = new HashMap<>();

        for (CommercialObjective obj : objectives) {
            var k = new Key(obj.getUserId(), obj.getProductId());
            BigDecimal aqty = salesQty.getOrDefault(k, BigDecimal.ZERO);
            BigDecimal aamt = salesAmt.getOrDefault(k, BigDecimal.ZERO);

            BigDecimal pctQty = pct(aqty, obj.getTargetQty());
            BigDecimal pctAmt = pct(aamt, obj.getTargetAmount());

            String status = computeStatus(pctAmt);
            ProductInfo p = products.get(obj.getProductId());
            String userName = userNames.computeIfAbsent(obj.getUserId(), this::fetchUserName);

            result.add(new ObjectiveTrackingDto(
                    obj.getUserId(), userName,
                    obj.getProductId(),
                    p != null ? p.code() : "?",
                    p != null ? p.name() : "?",
                    obj.getPeriodYear(), obj.getPeriodMonth(),
                    obj.getTargetQty(), obj.getTargetAmount(),
                    aqty, aamt,
                    pctQty, pctAmt, status));
        }

        result.sort(Comparator.comparing(ObjectiveTrackingDto::userName)
                .thenComparing(ObjectiveTrackingDto::productName));
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<UUID, ProductInfo> fetchProducts(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        List<Object[]> rows = em.createQuery(
                "SELECT p.id, p.code, p.name FROM Product p WHERE p.id IN :ids")
                .setParameter("ids", ids)
                .getResultList();
        Map<UUID, ProductInfo> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], new ProductInfo((String) row[1], (String) row[2]));
        }
        return map;
    }

    private BigDecimal pct(BigDecimal actual, BigDecimal target) {
        if (target == null || target.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return actual.multiply(BigDecimal.valueOf(100))
                .divide(target, 2, RoundingMode.HALF_UP);
    }

    private String computeStatus(BigDecimal pctAmount) {
        if (pctAmount == null) return "NO_OBJECTIVE";
        if (pctAmount.compareTo(BigDecimal.valueOf(100)) >= 0) return "EXCEEDED";
        if (pctAmount.compareTo(BigDecimal.valueOf(75)) >= 0) return "ON_TRACK";
        if (pctAmount.compareTo(BigDecimal.valueOf(50)) >= 0) return "AT_RISK";
        return "CRITICAL";
    }

    private String fetchUserName(UUID userId) {
        try {
            Object[] row = (Object[]) em.createQuery(
                    "SELECT u.firstName, u.lastName FROM User u WHERE u.id = :id")
                    .setParameter("id", userId)
                    .getSingleResult();
            return row[0] + " " + row[1];
        } catch (Exception e) {
            return userId.toString().substring(0, 8);
        }
    }

    private ObjectiveDto toObjectiveDto(CommercialObjective o, Map<UUID, ProductInfo> products) {
        ProductInfo p = products.get(o.getProductId());
        String userName = fetchUserName(o.getUserId());
        return new ObjectiveDto(
                o.getId(), o.getUserId(), userName,
                o.getProductId(),
                p != null ? p.code() : null,
                p != null ? p.name() : null,
                o.getPeriodYear(), o.getPeriodMonth(),
                o.getTargetQty(), o.getTargetAmount(),
                o.getNotes(), o.getCreatedAt());
    }

    private SaleEntryDto toSaleDto(SaleEntry s, Map<UUID, ProductInfo> products) {
        ProductInfo p = products.get(s.getProductId());
        String userName = fetchUserName(s.getUserId());
        BigDecimal total = s.getTotalAmount() != null
                ? s.getTotalAmount()
                : s.getQty().multiply(s.getUnitPrice());
        return new SaleEntryDto(
                s.getId(), s.getUserId(), userName,
                s.getProductId(),
                p != null ? p.code() : null,
                p != null ? p.name() : null,
                s.getAccountId(), null,
                s.getSaleDate(), s.getQty(), s.getUnitPrice(), total,
                s.getNotes(), s.getCreatedAt());
    }
}

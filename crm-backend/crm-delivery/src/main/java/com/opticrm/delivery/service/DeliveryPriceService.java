package com.opticrm.delivery.service;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.delivery.entity.DeliveryPriceOverride;
import com.opticrm.delivery.repository.DeliveryPriceOverrideRepository;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Résolution du prix unitaire selon la hiérarchie :
 *   1. Prix client-spécifique (delivery_price_override WHERE customer_id = ?)
 *   2. Prix catégorie tarifaire (delivery_price_override WHERE pricing_category_id = ?)
 *   3. Prix de base du produit (products.unit_price)
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class DeliveryPriceService {

    private final DeliveryPriceOverrideRepository priceOverrideRepository;
    private final AccountRepository accountRepository;
    private final ProductRepository productRepository;

    /**
     * Résout le prix pour un client + article donnés à la date d'aujourd'hui.
     * Retourne le prix résolu et la source utilisée.
     */
    public PriceResolution resolvePrice(UUID customerId, UUID itemId) {
        LocalDate today = LocalDate.now();

        // Priorité 1 — prix client-spécifique
        if (customerId != null) {
            List<DeliveryPriceOverride> clientPrices =
                priceOverrideRepository.findClientPrice(customerId, itemId, today);
            if (!clientPrices.isEmpty()) {
                return new PriceResolution(clientPrices.get(0).getUnitPrice(), PriceSource.CLIENT);
            }

            // Priorité 2 — prix catégorie tarifaire du client
            Optional<Account> account = accountRepository.findById(customerId);
            if (account.isPresent() && account.get().getPricingCategory() != null) {
                UUID categoryId = account.get().getPricingCategory().getId();
                List<DeliveryPriceOverride> catPrices =
                    priceOverrideRepository.findCategoryPrice(categoryId, itemId, today);
                if (!catPrices.isEmpty()) {
                    return new PriceResolution(catPrices.get(0).getUnitPrice(), PriceSource.CATEGORY);
                }
            }
        }

        // Priorité 3 — prix de base produit
        Optional<Product> product = productRepository.findById(itemId);
        if (product.isPresent() && product.get().getUnitPrice() != null) {
            return new PriceResolution(product.get().getUnitPrice(), PriceSource.PRODUCT);
        }

        log.warn("No price found for item {} and customer {}", itemId, customerId);
        return new PriceResolution(BigDecimal.ZERO, PriceSource.NONE);
    }

    public enum PriceSource { CLIENT, CATEGORY, PRODUCT, NONE }

    public record PriceResolution(BigDecimal unitPrice, PriceSource source) {}
}

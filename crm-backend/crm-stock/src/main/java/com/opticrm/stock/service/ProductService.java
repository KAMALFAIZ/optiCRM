package com.opticrm.stock.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.PricingCategory;
import com.opticrm.core.account.entity.TaxRate;
import com.opticrm.core.account.repository.PricingCategoryRepository;
import com.opticrm.core.account.repository.TaxRateRepository;
import com.opticrm.stock.dto.*;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.entity.ProductCategory;
import com.opticrm.stock.entity.ProductPrice;
import com.opticrm.stock.entity.StockLevel;
import com.opticrm.stock.repository.ProductCategoryRepository;
import com.opticrm.stock.repository.ProductPriceRepository;
import com.opticrm.stock.repository.ProductRepository;
import com.opticrm.stock.repository.StockLevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final TaxRateRepository taxRateRepository;
    private final StockLevelRepository stockLevelRepository;
    private final ProductPriceRepository productPriceRepository;
    private final PricingCategoryRepository pricingCategoryRepository;

    @Transactional(readOnly = true)
    public ProductDto getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return mapToDto(product, true);
    }

    @Transactional(readOnly = true)
    public Page<ProductListDto> list(PageRequest pageRequest, String search, String categoryId,
                                     Boolean isActive, Boolean isStockable, Boolean isSellable) {
        Page<Product> products;

        if (search != null && !search.isBlank()) {
            products = productRepository.search(search.trim(),
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (categoryId != null) {
            products = productRepository.findByCategoryId(UUID.fromString(categoryId),
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (Boolean.TRUE.equals(isSellable)) {
            products = productRepository.findSellableProducts(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (Boolean.TRUE.equals(isStockable)) {
            products = productRepository.findByIsStockableTrue(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else if (Boolean.TRUE.equals(isActive)) {
            products = productRepository.findByIsActiveTrue(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        } else {
            products = productRepository.findAll(
                    pageRequest.toPageable("name", Sort.Direction.ASC));
        }

        return products.map(this::mapToListDto);
    }

    @Transactional
    public ProductDto create(CreateProductRequest request) {
        // Check for duplicate code
        if (productRepository.existsByCode(request.getCode())) {
            throw new DuplicateEntryException("code", request.getCode());
        }

        Product product = Product.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .brand(request.getBrand())
                .unitPrice(request.getUnitPrice())
                .costPrice(request.getCostPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .unitOfMeasure(request.getUnitOfMeasure() != null ? request.getUnitOfMeasure() : "unité")
                .isStockable(request.getIsStockable() != null ? request.getIsStockable() : true)
                .minStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : BigDecimal.ZERO)
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : BigDecimal.ZERO)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isSellable(request.getIsSellable() != null ? request.getIsSellable() : true)
                .isPurchasable(request.getIsPurchasable() != null ? request.getIsPurchasable() : true)
                .imageUrl(request.getImageUrl())
                .build();

        // Set category
        if (request.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(UUID.fromString(request.getCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", request.getCategoryId()));
            product.setCategory(category);
        }

        // Set tax rate
        if (request.getDefaultTaxRateId() != null) {
            TaxRate taxRate = taxRateRepository.findById(UUID.fromString(request.getDefaultTaxRateId()))
                    .orElseThrow(() -> new ResourceNotFoundException("TaxRate", request.getDefaultTaxRateId()));
            product.setDefaultTaxRate(taxRate);
        }

        product = productRepository.save(product);
        log.info("Created product: {} ({})", product.getName(), product.getCode());

        return mapToDto(product, false);
    }

    @Transactional
    public ProductDto update(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        // Update fields if provided
        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getUnitPrice() != null) product.setUnitPrice(request.getUnitPrice());
        if (request.getCostPrice() != null) product.setCostPrice(request.getCostPrice());
        if (request.getCurrency() != null) product.setCurrency(request.getCurrency());
        if (request.getUnitOfMeasure() != null) product.setUnitOfMeasure(request.getUnitOfMeasure());
        if (request.getIsStockable() != null) product.setIsStockable(request.getIsStockable());
        if (request.getMinStockLevel() != null) product.setMinStockLevel(request.getMinStockLevel());
        if (request.getReorderLevel() != null) product.setReorderLevel(request.getReorderLevel());
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());
        if (request.getIsSellable() != null) product.setIsSellable(request.getIsSellable());
        if (request.getIsPurchasable() != null) product.setIsPurchasable(request.getIsPurchasable());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getDatasheetUrl() != null) product.setDatasheetUrl(request.getDatasheetUrl());
        if (request.getDatasheetName() != null) product.setDatasheetName(request.getDatasheetName());

        // Update category
        if (request.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(UUID.fromString(request.getCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", request.getCategoryId()));
            product.setCategory(category);
        }

        // Update tax rate
        if (request.getDefaultTaxRateId() != null) {
            TaxRate taxRate = taxRateRepository.findById(UUID.fromString(request.getDefaultTaxRateId()))
                    .orElseThrow(() -> new ResourceNotFoundException("TaxRate", request.getDefaultTaxRateId()));
            product.setDefaultTaxRate(taxRate);
        }

        product = productRepository.save(product);
        log.info("Updated product: {}", id);

        return mapToDto(product, true);
    }

    @Transactional
    public ProductDto updateImageUrl(UUID id, String imageUrl) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setImageUrl(imageUrl);
        product = productRepository.save(product);
        log.info("Product image updated: {} -> {}", id, imageUrl);
        return mapToDto(product, true);
    }

    @Transactional
    public ProductDto updateDatasheet(UUID id, String datasheetUrl, String datasheetName) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setDatasheetUrl(datasheetUrl);
        product.setDatasheetName(datasheetName);
        product = productRepository.save(product);
        log.info("Product datasheet updated: {} -> {}", id, datasheetUrl);
        return mapToDto(product, true);
    }

    @Transactional
    public ProductDto deleteDatasheet(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setDatasheetUrl(null);
        product.setDatasheetName(null);
        product = productRepository.save(product);
        log.info("Product datasheet removed: {}", id);
        return mapToDto(product, true);
    }

    // ---- Prix par catégorie tarifaire ----

    @Transactional(readOnly = true)
    public List<ProductPriceDto> getPrices(UUID productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }
        return productPriceRepository.findByProductId(productId)
                .stream().map(this::mapPriceToDto).collect(Collectors.toList());
    }

    @Transactional
    public ProductPriceDto setPrice(UUID productId, SetProductPriceRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        UUID categoryId = UUID.fromString(request.getPricingCategoryId());
        PricingCategory category = pricingCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", categoryId));

        ProductPrice price = productPriceRepository
                .findByProductIdAndPricingCategoryId(productId, categoryId)
                .orElse(ProductPrice.builder().product(product).pricingCategory(category).build());

        price.setUnitPrice(request.getUnitPrice());
        price.setCurrency(request.getCurrency() != null ? request.getCurrency() : product.getCurrency());
        price = productPriceRepository.save(price);
        log.info("Set price for product {} in category {}: {}", productId, categoryId, request.getUnitPrice());
        return mapPriceToDto(price);
    }

    @Transactional
    public void deletePrice(UUID productId, UUID categoryId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }
        productPriceRepository.deleteByProductIdAndPricingCategoryId(productId, categoryId);
        log.info("Deleted price for product {} in category {}", productId, categoryId);
    }

    private ProductPriceDto mapPriceToDto(ProductPrice pp) {
        return ProductPriceDto.builder()
                .id(pp.getId().toString())
                .categoryId(pp.getPricingCategory().getId().toString())
                .categoryCode(pp.getPricingCategory().getCode())
                .categoryName(pp.getPricingCategory().getName())
                .categoryIsDefault(pp.getPricingCategory().getIsDefault())
                .unitPrice(pp.getUnitPrice())
                .currency(pp.getCurrency())
                .build();
    }

    @Transactional
    public void delete(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }

        // Check if product has stock
        List<StockLevel> stockLevels = stockLevelRepository.findByProductId(id);
        boolean hasStock = stockLevels.stream()
                .anyMatch(sl -> sl.getQuantityOnHand().compareTo(BigDecimal.ZERO) > 0);
        if (hasStock) {
            throw new IllegalStateException("Impossible de supprimer le produit car il a du stock");
        }

        productRepository.deleteById(id);
        log.info("Deleted product: {}", id);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getCategoryStats() {
        return productRepository.countByCategoryGrouped()
                .stream()
                .collect(Collectors.toMap(
                        arr -> (String) arr[0],
                        arr -> (Long) arr[1]
                ));
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return productRepository.countActive();
    }

    @Transactional(readOnly = true)
    public long countStockable() {
        return productRepository.countStockable();
    }

    // Mapping methods
    private ProductDto mapToDto(Product product, boolean includeStock) {
        ProductDto.ProductDtoBuilder builder = ProductDto.builder()
                .id(product.getId().toString())
                .code(product.getCode())
                .name(product.getName())
                .description(product.getDescription())
                .brand(product.getBrand())
                .unitPrice(product.getUnitPrice())
                .costPrice(product.getCostPrice())
                .currency(product.getCurrency())
                .margin(product.getMargin())
                .profit(product.getProfit())
                .unitOfMeasure(product.getUnitOfMeasure())
                .isStockable(product.getIsStockable())
                .minStockLevel(product.getMinStockLevel())
                .reorderLevel(product.getReorderLevel())
                .isActive(product.getIsActive())
                .isSellable(product.getIsSellable())
                .isPurchasable(product.getIsPurchasable())
                .imageUrl(product.getImageUrl())
                .datasheetUrl(product.getDatasheetUrl())
                .datasheetName(product.getDatasheetName())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt());

        // Category
        if (product.getCategory() != null) {
            builder.category(ProductDto.CategorySummary.builder()
                    .id(product.getCategory().getId().toString())
                    .code(product.getCategory().getCode())
                    .name(product.getCategory().getName())
                    .build());
        }

        // Tax rate
        if (product.getDefaultTaxRate() != null) {
            builder.defaultTaxRate(ProductDto.TaxRateSummary.builder()
                    .id(product.getDefaultTaxRate().getId().toString())
                    .code(product.getDefaultTaxRate().getCode())
                    .name(product.getDefaultTaxRate().getName())
                    .rate(product.getDefaultTaxRate().getRate())
                    .build());
        }

        // Prices per pricing category
        List<ProductPrice> productPrices = productPriceRepository.findByProductId(product.getId());
        if (!productPrices.isEmpty()) {
            builder.prices(productPrices.stream().map(this::mapPriceToDto).collect(Collectors.toList()));
        }

        // Stock levels
        if (includeStock && Boolean.TRUE.equals(product.getIsStockable())) {
            List<StockLevel> stockLevels = stockLevelRepository.findByProductId(product.getId());
            BigDecimal totalStock = BigDecimal.ZERO;

            List<ProductDto.StockInfo> stockInfoList = stockLevels.stream()
                    .map(sl -> {
                        return ProductDto.StockInfo.builder()
                                .warehouseId(sl.getWarehouse().getId().toString())
                                .warehouseCode(sl.getWarehouse().getCode())
                                .warehouseName(sl.getWarehouse().getName())
                                .quantityOnHand(sl.getQuantityOnHand())
                                .quantityReserved(sl.getQuantityReserved())
                                .quantityAvailable(sl.getQuantityAvailable())
                                .build();
                    })
                    .collect(Collectors.toList());

            for (StockLevel sl : stockLevels) {
                totalStock = totalStock.add(sl.getQuantityAvailable());
            }

            builder.stockLevels(stockInfoList);
            builder.totalStock(totalStock);
        }

        return builder.build();
    }

    private ProductListDto mapToListDto(Product product) {
        BigDecimal totalStock = BigDecimal.ZERO;
        String stockStatus = "N/A";

        if (Boolean.TRUE.equals(product.getIsStockable())) {
            BigDecimal total = stockLevelRepository.getTotalQuantityOnHand(product.getId());
            totalStock = total != null ? total : BigDecimal.ZERO;

            // Determine stock status
            if (totalStock.compareTo(BigDecimal.ZERO) <= 0) {
                stockStatus = "OUT_OF_STOCK";
            } else if (product.getMinStockLevel() != null &&
                       totalStock.compareTo(product.getMinStockLevel()) <= 0) {
                stockStatus = "LOW";
            } else {
                stockStatus = "OK";
            }
        }

        return ProductListDto.builder()
                .id(product.getId().toString())
                .code(product.getCode())
                .name(product.getName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .brand(product.getBrand())
                .unitPrice(product.getUnitPrice())
                .costPrice(product.getCostPrice())
                .currency(product.getCurrency())
                .unitOfMeasure(product.getUnitOfMeasure())
                .isStockable(product.getIsStockable())
                .isActive(product.getIsActive())
                .isSellable(product.getIsSellable())
                .totalStock(totalStock)
                .stockStatus(stockStatus)
                .imageUrl(product.getImageUrl())
                .build();
    }
}

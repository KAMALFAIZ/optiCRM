package com.opticrm.stock.repository;

import com.opticrm.stock.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, UUID> {

    List<ProductPrice> findByProductId(UUID productId);

    Optional<ProductPrice> findByProductIdAndPricingCategoryId(UUID productId, UUID pricingCategoryId);

    void deleteByProductIdAndPricingCategoryId(UUID productId, UUID pricingCategoryId);
}

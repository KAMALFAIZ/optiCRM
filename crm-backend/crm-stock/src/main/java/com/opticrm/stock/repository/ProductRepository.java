package com.opticrm.stock.repository;

import com.opticrm.stock.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByCode(String code);

    boolean existsByCode(String code);

    Optional<Product> findBySageCode(String sageCode);

    List<Product> findBySageCodeIn(List<String> sageCodes);

    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Product> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId")
    Page<Product> findByCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

    Page<Product> findByIsActiveTrue(Pageable pageable);

    Page<Product> findByIsStockableTrue(Pageable pageable);

    Page<Product> findByIsSellableTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isSellable = true")
    Page<Product> findSellableProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.isPurchasable = true")
    Page<Product> findPurchasableProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.isActive = true")
    List<Product> findActiveByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("SELECT p FROM Product p WHERE p.defaultTaxRate.id = :taxRateId")
    List<Product> findByTaxRateId(@Param("taxRateId") UUID taxRateId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true")
    long countActive();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isStockable = true")
    long countStockable();

    @Query("SELECT p.category.name, COUNT(p) FROM Product p WHERE p.category IS NOT NULL GROUP BY p.category.name")
    List<Object[]> countByCategoryGrouped();
}

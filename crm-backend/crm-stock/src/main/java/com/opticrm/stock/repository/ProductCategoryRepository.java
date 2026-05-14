package com.opticrm.stock.repository;

import com.opticrm.stock.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    Optional<ProductCategory> findByCode(String code);

    List<ProductCategory> findByCodeIn(List<String> codes);

    boolean existsByCode(String code);

    @Query("SELECT c FROM ProductCategory c WHERE c.parentCategory IS NULL ORDER BY c.sortOrder, c.name")
    List<ProductCategory> findRootCategories();

    @Query("SELECT c FROM ProductCategory c WHERE c.parentCategory.id = :parentId ORDER BY c.sortOrder, c.name")
    List<ProductCategory> findByParentCategoryId(@Param("parentId") UUID parentId);

    @Query("SELECT c FROM ProductCategory c WHERE " +
            "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<ProductCategory> search(@Param("search") String search);

    @Query("SELECT c FROM ProductCategory c ORDER BY c.sortOrder, c.name")
    List<ProductCategory> findAllOrdered();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId")
    long countProductsByCategoryId(@Param("categoryId") UUID categoryId);
}

package com.opticrm.stock.repository;

import com.opticrm.stock.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {

    Optional<Warehouse> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT w FROM Warehouse w WHERE w.isDefault = true")
    Optional<Warehouse> findDefault();

    List<Warehouse> findByIsActiveTrue();

    @Query("SELECT w FROM Warehouse w WHERE " +
            "LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.addressCity) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Warehouse> search(@Param("search") String search);

    @Query("SELECT w FROM Warehouse w ORDER BY w.isDefault DESC, w.name")
    List<Warehouse> findAllOrdered();
}

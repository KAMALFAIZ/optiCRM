package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.VehicleLoad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleLoadRepository extends JpaRepository<VehicleLoad, UUID> {

    // ─── Par tournée ─────────────────────────────────────────────────────────

    List<VehicleLoad> findByDeliveryTourId(UUID deliveryTourId);

    // ─── Filtrage par date et zone ────────────────────────────────────────────

    @Query("SELECT v FROM VehicleLoad v JOIN v.deliveryTour t " +
           "WHERE (:date IS NULL OR t.tourDate = :date) " +
           "AND (:zone IS NULL OR t.zone = :zone) " +
           "ORDER BY v.loadDate DESC")
    List<VehicleLoad> findByTourDateAndZone(
            @Param("date") LocalDate date,
            @Param("zone") String zone);

    // ─── KPI agrégats (niveau session) ────────────────────────────────────────

    @Query("SELECT COUNT(v) FROM VehicleLoad v JOIN v.deliveryTour t " +
           "WHERE (:date IS NULL OR t.tourDate = :date) " +
           "AND (:zone IS NULL OR t.zone = :zone)")
    long countByDateAndZone(
            @Param("date") LocalDate date,
            @Param("zone") String zone);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM VehicleLoadItem i JOIN i.vehicleLoad v JOIN v.deliveryTour t " +
           "WHERE (:date IS NULL OR t.tourDate = :date) " +
           "AND (:zone IS NULL OR t.zone = :zone)")
    long sumQtyByDateAndZone(
            @Param("date") LocalDate date,
            @Param("zone") String zone);

    @Query("SELECT COUNT(v) FROM VehicleLoad v JOIN v.deliveryTour t " +
           "WHERE (:date IS NULL OR t.tourDate = :date) " +
           "AND (:zone IS NULL OR t.zone = :zone) " +
           "AND v.status = 'LOADED'")
    long countConfirmeesByDateAndZone(
            @Param("date") LocalDate date,
            @Param("zone") String zone);

    @Query("SELECT COUNT(v) FROM VehicleLoad v JOIN v.deliveryTour t " +
           "WHERE (:date IS NULL OR t.tourDate = :date) " +
           "AND (:zone IS NULL OR t.zone = :zone) " +
           "AND v.status = 'DRAFT'")
    long countEnAttenteByDateAndZone(
            @Param("date") LocalDate date,
            @Param("zone") String zone);

    // ─── Stock chargé par article (pour validation livraison) ─────────────────
    // Traverse session → items, ne compte que les sessions LOADED

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM VehicleLoadItem i JOIN i.vehicleLoad v " +
           "WHERE v.deliveryTour.id = :tourId AND i.itemId = :itemId " +
           "AND v.status = 'LOADED'")
    Integer sumLoadedQtyByTourAndItem(
            @Param("tourId") UUID tourId,
            @Param("itemId") UUID itemId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM VehicleLoadItem i JOIN i.vehicleLoad v " +
           "WHERE v.deliveryTour.id = :tourId AND i.itemId = :itemId")
    Integer sumAllQtyByTourAndItem(
            @Param("tourId") UUID tourId,
            @Param("itemId") UUID itemId);

    // ─── Dates/zones distinctes pour le filtre dropdown ───────────────────────

    @Query("SELECT DISTINCT t.tourDate, t.zone FROM VehicleLoad v JOIN v.deliveryTour t " +
           "ORDER BY t.tourDate DESC")
    List<Object[]> findDistinctDatesAndZones();
}

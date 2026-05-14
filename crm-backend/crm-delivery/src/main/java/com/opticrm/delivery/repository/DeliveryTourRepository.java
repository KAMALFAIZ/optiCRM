package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.DeliveryTour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryTourRepository extends JpaRepository<DeliveryTour, UUID> {
    List<DeliveryTour> findByTourDate(LocalDate tourDate);
    List<DeliveryTour> findByStatus(DeliveryTour.TourStatus status);
    List<DeliveryTour> findByZone(String zone);
    List<DeliveryTour> findByRepresentativeId(UUID representativeId);

    boolean existsByRepresentativeIdAndTourDateAndStatusNot(
        UUID representativeId, LocalDate tourDate, DeliveryTour.TourStatus status);

    boolean existsByRepresentativeIdAndStatus(
        UUID representativeId, DeliveryTour.TourStatus status);

    boolean existsByRepresentativeIdAndStatusIn(
        UUID representativeId, java.util.Collection<DeliveryTour.TourStatus> statuses);

    @Query("SELECT t FROM DeliveryTour t WHERE t.tourDate BETWEEN :from AND :to")
    List<DeliveryTour> findByTourDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT t FROM DeliveryTour t WHERE t.tourDate BETWEEN :from AND :to AND t.status = :status")
    List<DeliveryTour> findByTourDateBetweenAndStatus(
        @Param("from") LocalDate from, @Param("to") LocalDate to,
        @Param("status") DeliveryTour.TourStatus status);

    long countByStatus(DeliveryTour.TourStatus status);
}

package com.opticrm.core.tour.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.tour.dto.*;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.core.tour.entity.Tour;
import com.opticrm.core.tour.entity.TourVisit;
import com.opticrm.core.tour.repository.TourRepository;
import com.opticrm.core.visit.entity.Visit;
import com.opticrm.core.visit.repository.VisitRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository tourRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public TourDto getById(UUID id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour", id));
        return mapToDto(tour);
    }

    @Transactional(readOnly = true)
    public Page<TourListDto> list(PageRequest pageRequest, String search, String status, String assignedToId) {
        Page<Tour> tours;

        // COMMERCIAL ne voit que ses propres tournées
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return tourRepository.findByAssignedToId(currentUserId,
                        pageRequest.toPageable("tourDate", Sort.Direction.DESC))
                        .map(this::mapToListDto);
            }
        }

        if (search != null && !search.isBlank()) {
            tours = tourRepository.search(search.trim(),
                    pageRequest.toPageable("tourDate", Sort.Direction.DESC));
        } else if (status != null && !status.isBlank()) {
            tours = tourRepository.findByStatus(status,
                    pageRequest.toPageable("tourDate", Sort.Direction.DESC));
        } else if (assignedToId != null && !assignedToId.isBlank()) {
            tours = tourRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("tourDate", Sort.Direction.DESC));
        } else {
            tours = tourRepository.findAll(
                    pageRequest.toPageable("tourDate", Sort.Direction.DESC));
        }

        return tours.map(this::mapToListDto);
    }

    @Transactional
    public TourDto create(CreateTourRequest request) {
        Tour tour = Tour.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tourDate(request.getTourDate())
                .region(request.getRegion())
                .startAddress(request.getStartAddress())
                .startLatitude(request.getStartLatitude())
                .startLongitude(request.getStartLongitude())
                .endAddress(request.getEndAddress())
                .endLatitude(request.getEndLatitude())
                .endLongitude(request.getEndLongitude())
                .notes(request.getNotes())
                .objective(request.getObjective())
                .tourResult(request.getTourResult())
                .estimatedRevenue(request.getEstimatedRevenue())
                .actualRevenue(request.getActualRevenue())
                .vehicleType(request.getVehicleType())
                .fuelCost(request.getFuelCost())
                .totalExpenses(request.getTotalExpenses())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .followUpNotes(request.getFollowUpNotes())
                .status("draft")
                .tourVisits(new ArrayList<>())
                .build();

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            tour.setAssignedTo(assignedTo);
        }

        tour = tourRepository.save(tour);

        if (request.getVisitIds() != null && !request.getVisitIds().isEmpty()) {
            setTourVisits(tour, request.getVisitIds());
            tour = tourRepository.save(tour);
        }

        log.info("Created tour: {}", tour.getName());
        return mapToDto(tour);
    }

    @Transactional
    public TourDto update(UUID id, UpdateTourRequest request) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour", id));

        if (request.getName() != null) tour.setName(request.getName());
        if (request.getDescription() != null) tour.setDescription(request.getDescription());
        if (request.getTourDate() != null) tour.setTourDate(request.getTourDate());
        if (request.getStatus() != null) tour.setStatus(request.getStatus());
        if (request.getRegion() != null) tour.setRegion(request.getRegion());
        if (request.getStartAddress() != null) tour.setStartAddress(request.getStartAddress());
        if (request.getStartLatitude() != null) tour.setStartLatitude(request.getStartLatitude());
        if (request.getStartLongitude() != null) tour.setStartLongitude(request.getStartLongitude());
        if (request.getEndAddress() != null) tour.setEndAddress(request.getEndAddress());
        if (request.getEndLatitude() != null) tour.setEndLatitude(request.getEndLatitude());
        if (request.getEndLongitude() != null) tour.setEndLongitude(request.getEndLongitude());
        if (request.getNotes() != null) tour.setNotes(request.getNotes());
        if (request.getObjective() != null) tour.setObjective(request.getObjective());
        if (request.getTourResult() != null) tour.setTourResult(request.getTourResult());
        if (request.getEstimatedRevenue() != null) tour.setEstimatedRevenue(request.getEstimatedRevenue());
        if (request.getActualRevenue() != null) tour.setActualRevenue(request.getActualRevenue());
        if (request.getVehicleType() != null) tour.setVehicleType(request.getVehicleType());
        if (request.getFuelCost() != null) tour.setFuelCost(request.getFuelCost());
        if (request.getTotalExpenses() != null) tour.setTotalExpenses(request.getTotalExpenses());
        if (request.getStartTime() != null) tour.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) tour.setEndTime(request.getEndTime());
        if (request.getFollowUpNotes() != null) tour.setFollowUpNotes(request.getFollowUpNotes());

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            tour.setAssignedTo(assignedTo);
        }

        if (request.getVisitIds() != null) {
            tour.getTourVisits().clear();
            setTourVisits(tour, request.getVisitIds());
        }

        tour = tourRepository.save(tour);
        log.info("Updated tour: {}", id);
        return mapToDto(tour);
    }

    @Transactional
    public void delete(UUID id) {
        if (!tourRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tour", id);
        }
        tourRepository.deleteById(id);
        log.info("Deleted tour: {}", id);
    }

    @Transactional
    public TourDto start(UUID id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour", id));
        tour.setStatus("in_progress");
        tour = tourRepository.save(tour);
        log.info("Started tour: {}", id);
        return mapToDto(tour);
    }

    @Transactional
    public TourDto complete(UUID id) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour", id));
        tour.setStatus("completed");
        // Count completed visits
        long completed = tour.getTourVisits().stream()
                .filter(tv -> "completed".equals(tv.getVisit().getStatus()))
                .count();
        tour.setCompletedVisits((int) completed);
        tour = tourRepository.save(tour);
        log.info("Completed tour: {}", id);
        return mapToDto(tour);
    }

    @Transactional
    public TourDto reorderVisits(UUID id, List<String> visitIds) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour", id));
        tour.getTourVisits().clear();
        setTourVisits(tour, visitIds);
        tour = tourRepository.save(tour);
        log.info("Reordered visits for tour: {}", id);
        return mapToDto(tour);
    }

    private void setTourVisits(Tour tour, List<String> visitIds) {
        List<UUID> uuids = visitIds.stream().map(UUID::fromString).collect(Collectors.toList());
        List<Visit> visits = visitRepository.findAllByIdIn(uuids);

        for (int i = 0; i < visitIds.size(); i++) {
            UUID visitId = UUID.fromString(visitIds.get(i));
            Visit visit = visits.stream()
                    .filter(v -> v.getId().equals(visitId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Visit", visitId));

            TourVisit tourVisit = TourVisit.builder()
                    .tour(tour)
                    .visit(visit)
                    .visitOrder(i + 1)
                    .build();
            tour.getTourVisits().add(tourVisit);
        }
        tour.setTotalVisits(visitIds.size());
    }

    private TourDto mapToDto(Tour tour) {
        TourDto.TourDtoBuilder builder = TourDto.builder()
                .id(tour.getId().toString())
                .name(tour.getName())
                .description(tour.getDescription())
                .tourDate(tour.getTourDate())
                .status(tour.getStatus())
                .region(tour.getRegion())
                .totalVisits(tour.getTotalVisits())
                .completedVisits(tour.getCompletedVisits())
                .totalDistance(tour.getTotalDistance())
                .startAddress(tour.getStartAddress())
                .startLatitude(tour.getStartLatitude())
                .startLongitude(tour.getStartLongitude())
                .endAddress(tour.getEndAddress())
                .endLatitude(tour.getEndLatitude())
                .endLongitude(tour.getEndLongitude())
                .notes(tour.getNotes())
                .objective(tour.getObjective())
                .tourResult(tour.getTourResult())
                .estimatedRevenue(tour.getEstimatedRevenue())
                .actualRevenue(tour.getActualRevenue())
                .vehicleType(tour.getVehicleType())
                .fuelCost(tour.getFuelCost())
                .totalExpenses(tour.getTotalExpenses())
                .startTime(tour.getStartTime())
                .endTime(tour.getEndTime())
                .followUpNotes(tour.getFollowUpNotes())
                .expenseReportCount(tour.getExpenseReports() != null ? tour.getExpenseReports().size() : 0)
                .createdAt(tour.getCreatedAt())
                .updatedAt(tour.getUpdatedAt());

        if (tour.getAssignedTo() != null) {
            builder.assignedTo(TourDto.UserSummary.builder()
                    .id(tour.getAssignedTo().getId().toString())
                    .fullName(tour.getAssignedTo().getFullName())
                    .email(tour.getAssignedTo().getEmail())
                    .build());
        }

        if (tour.getTourVisits() != null) {
            List<TourDto.TourVisitItem> visitItems = tour.getTourVisits().stream()
                    .map(tv -> TourDto.TourVisitItem.builder()
                            .visitId(tv.getVisit().getId().toString())
                            .visitOrder(tv.getVisitOrder())
                            .subject(tv.getVisit().getSubject())
                            .visitType(tv.getVisit().getVisitType())
                            .status(tv.getVisit().getStatus())
                            .address(tv.getVisit().getAddress())
                            .city(tv.getVisit().getCity())
                            .latitude(tv.getVisit().getLatitude())
                            .longitude(tv.getVisit().getLongitude())
                            .contactName(tv.getVisit().getContact() != null ? tv.getVisit().getContact().getDisplayName() : null)
                            .accountName(tv.getVisit().getAccount() != null ? tv.getVisit().getAccount().getName() : null)
                            .visitDate(tv.getVisit().getVisitDate())
                            .build())
                    .collect(Collectors.toList());
            builder.visits(visitItems);
        }

        return builder.build();
    }

    private TourListDto mapToListDto(Tour tour) {
        return TourListDto.builder()
                .id(tour.getId().toString())
                .name(tour.getName())
                .tourDate(tour.getTourDate())
                .status(tour.getStatus())
                .region(tour.getRegion())
                .totalVisits(tour.getTotalVisits())
                .completedVisits(tour.getCompletedVisits())
                .assignedToName(tour.getAssignedTo() != null ? tour.getAssignedTo().getFullName() : null)
                .createdAt(tour.getCreatedAt())
                .build();
    }
}

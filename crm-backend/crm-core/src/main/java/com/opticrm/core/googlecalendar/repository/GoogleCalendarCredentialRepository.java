package com.opticrm.core.googlecalendar.repository;

import com.opticrm.core.googlecalendar.entity.GoogleCalendarCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoogleCalendarCredentialRepository extends JpaRepository<GoogleCalendarCredential, UUID> {
    Optional<GoogleCalendarCredential> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}

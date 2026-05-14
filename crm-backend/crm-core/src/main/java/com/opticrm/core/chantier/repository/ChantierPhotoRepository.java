package com.opticrm.core.chantier.repository;

import com.opticrm.core.chantier.entity.ChantierPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChantierPhotoRepository extends JpaRepository<ChantierPhoto, UUID> {
    List<ChantierPhoto> findByChantierIdOrderByCreatedAtDesc(UUID chantierId);
}

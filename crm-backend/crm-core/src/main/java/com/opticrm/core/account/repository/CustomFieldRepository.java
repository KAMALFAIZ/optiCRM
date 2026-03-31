package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomFieldRepository extends JpaRepository<CustomField, UUID> {

    List<CustomField> findAllByOrderBySortOrderAsc();

    List<CustomField> findByActiveOrderBySortOrderAsc(boolean active);

    Optional<CustomField> findByFieldKey(String fieldKey);

    boolean existsByFieldKey(String fieldKey);
}

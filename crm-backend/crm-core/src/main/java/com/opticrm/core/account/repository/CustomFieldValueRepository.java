package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, UUID> {

    List<CustomFieldValue> findByAccountId(UUID accountId);

    Optional<CustomFieldValue> findByAccountIdAndFieldId(UUID accountId, UUID fieldId);

    void deleteByAccountIdAndFieldId(UUID accountId, UUID fieldId);
}

package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.AccountPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountPhotoRepository extends JpaRepository<AccountPhoto, UUID> {

    List<AccountPhoto> findByAccountIdOrderByDisplayOrderAscUploadedAtAsc(UUID accountId);

    void deleteByAccountIdAndId(UUID accountId, UUID photoId);

    int countByAccountId(UUID accountId);
}

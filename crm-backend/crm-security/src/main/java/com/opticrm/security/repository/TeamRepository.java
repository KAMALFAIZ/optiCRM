package com.opticrm.security.repository;

import com.opticrm.security.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findByParentTeamIsNull();

    List<Team> findByParentTeamId(UUID parentTeamId);

    @Query("SELECT t FROM Team t WHERE t.manager.id = :managerId")
    List<Team> findByManagerId(@Param("managerId") UUID managerId);

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.manager")
    List<Team> findAllWithManager();

    boolean existsByName(String name);
}

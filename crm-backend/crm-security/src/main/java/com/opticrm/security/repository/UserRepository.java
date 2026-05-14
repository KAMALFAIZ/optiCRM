package com.opticrm.security.repository;

import com.opticrm.security.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    /**
     * Load a User by email with team and territory eagerly fetched (LEFT JOIN FETCH).
     * Use this instead of findByEmail() whenever lazy associations (team, territory)
     * will be accessed outside a transactional context.
     */
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.team " +
           "LEFT JOIN FETCH u.territory " +
           "WHERE u.email = :email")
    Optional<User> findByEmailFetched(@Param("email") String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true")
    List<User> findAllActive();

    @Query("SELECT u FROM User u WHERE u.team.id = :teamId")
    List<User> findByTeamId(@Param("teamId") UUID teamId);

    @Query("SELECT u FROM User u WHERE u.territory.id = :territoryId")
    List<User> findByTerritoryId(@Param("territoryId") UUID territoryId);

    @Query("SELECT u FROM User u WHERE u.role.id = :roleId")
    List<User> findByRoleId(@Param("roleId") UUID roleId);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.isActive = :isActive")
    Page<User> findByIsActive(@Param("isActive") Boolean isActive, Pageable pageable);

    @Query(value = "SELECT u.* FROM users u " +
            "LEFT JOIN roles r ON r.id = u.role_id " +
            "LEFT JOIN teams t ON t.id = u.team_id " +
            "LEFT JOIN territories te ON te.id = u.territory_id " +
            "WHERE (:search = '' OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:roleId IS NULL OR u.role_id = :roleId) " +
            "AND (:isActive IS NULL OR u.is_active = :isActive)",
            countQuery = "SELECT COUNT(*) FROM users u " +
            "LEFT JOIN roles r ON r.id = u.role_id " +
            "WHERE (:search = '' OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:roleId IS NULL OR u.role_id = :roleId) " +
            "AND (:isActive IS NULL OR u.is_active = :isActive)",
            nativeQuery = true)
    Page<User> findAllFiltered(
            @Param("search") String search,
            @Param("roleId") UUID roleId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    // --- List for export (no pagination) ---
    @Query(value = "SELECT u.* FROM users u " +
            "LEFT JOIN roles r ON r.id = u.role_id " +
            "LEFT JOIN teams t ON t.id = u.team_id " +
            "LEFT JOIN territories te ON te.id = u.territory_id " +
            "WHERE (:search = '' OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.last_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:roleId IS NULL OR u.role_id = :roleId) " +
            "AND (:isActive IS NULL OR u.is_active = :isActive) " +
            "ORDER BY u.created_at DESC",
            nativeQuery = true)
    List<User> findAllFilteredList(
            @Param("search") String search,
            @Param("roleId") UUID roleId,
            @Param("isActive") Boolean isActive);

    // --- Statistics queries ---
    @Query(value = "SELECT COUNT(*) FROM users", nativeQuery = true)
    long countAll();

    @Query(value = "SELECT COUNT(*) FROM users WHERE is_active = 1", nativeQuery = true)
    long countActive();

    @Query(value = "SELECT COUNT(*) FROM users WHERE is_active = 0", nativeQuery = true)
    long countInactive();

    @Query(value = "SELECT COUNT(*) FROM users WHERE locked_until IS NOT NULL AND locked_until > GETUTCDATE()", nativeQuery = true)
    long countLocked();

    @Query(value = "SELECT COUNT(*) FROM users WHERE last_login_at > DATEADD(day, -7, GETUTCDATE())", nativeQuery = true)
    long countRecentLogins();

    @Query(value = "SELECT r.name AS role_name, COUNT(u.id) AS cnt " +
            "FROM users u JOIN roles r ON r.id = u.role_id " +
            "GROUP BY r.name ORDER BY cnt DESC", nativeQuery = true)
    List<Object[]> countByRoleGrouped();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.id = :roleId")
    long countByRoleId(@Param("roleId") UUID roleId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.team.id = :teamId")
    long countByTeamId(@Param("teamId") UUID teamId);

    // --- Batch operations ---
    @Query("SELECT u FROM User u WHERE u.id IN :ids")
    List<User> findAllByIdIn(@Param("ids") List<UUID> ids);
}

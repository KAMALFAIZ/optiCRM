package com.opticrm.security.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.security.dto.*;
import com.opticrm.security.entity.Role;
import com.opticrm.security.entity.Team;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.RoleRepository;
import com.opticrm.security.repository.TeamRepository;
import com.opticrm.security.repository.TerritoryRepository;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.FileStorageService;
import com.opticrm.security.service.UserActivityService;
import com.opticrm.security.service.UserExportService;
import com.opticrm.security.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class UserController {

    private final UserService userService;
    private final UserExportService userExportService;
    private final UserActivityService activityService;
    private final FileStorageService fileStorageService;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final TerritoryRepository territoryRepository;
    private final UserRepository userRepository;

    // ---- Statistics ----

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(userService.getStats()));
    }

    // ---- List ----

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID roleId,
            @RequestParam(required = false) Boolean isActive
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy != null ? sortBy : "createdAt")
                .sortDirection(sortDirection)
                .build();

        Page<UserResponse> result = userService.list(pageRequest, search, roleId, isActive);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    // ---- Export Excel ----

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID roleId,
            @RequestParam(required = false) Boolean isActive
    ) throws IOException {
        byte[] data = userExportService.exportToExcel(search, roleId, isActive);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "utilisateurs.xlsx");

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    // ---- CRUD ----

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable UUID id) {
        UserResponse user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @Valid @RequestBody CreateUserRequest request
    ) {
        UserResponse user = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserResponse user = userService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/{id}/delete")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable UUID id) {
        userService.activate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        userService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlock(@PathVariable UUID id) {
        userService.unlockUser(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ---- Batch operations ----

    @PatchMapping("/batch/activate")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> batchActivate(
            @Valid @RequestBody BatchActionRequest request
    ) {
        int count = userService.batchActivate(request.getIds());
        return ResponseEntity.ok(ApiResponse.success(Map.of("affected", count)));
    }

    @PatchMapping("/batch/deactivate")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> batchDeactivate(
            @Valid @RequestBody BatchActionRequest request
    ) {
        int count = userService.batchDeactivate(request.getIds());
        return ResponseEntity.ok(ApiResponse.success(Map.of("affected", count)));
    }

    // ---- Activity history ----

    @GetMapping("/{id}/activities")
    public ResponseEntity<ApiResponse<List<UserActivityDto>>> getActivities(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage
    ) {
        Page<UserActivityDto> result = activityService.getActivities(id, page, perPage);
        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    // ---- Avatar upload ----

    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String avatarUrl = fileStorageService.storeAvatar(id, file);
        UserResponse user = userService.updateAvatar(id, avatarUrl);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // ---- Reference data endpoints ----

    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleDto>>> getRoles() {
        List<RoleDto> roles = roleRepository.findAll().stream()
                .map(role -> RoleDto.builder()
                        .id(role.getId().toString())
                        .name(role.getName())
                        .description(role.getDescription())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<List<TeamDto>>> getTeams() {
        List<TeamDto> teams = teamRepository.findAllWithManager().stream()
                .map(team -> TeamDto.builder()
                        .id(team.getId().toString())
                        .name(team.getName())
                        .description(team.getDescription())
                        .managerId(team.getManager() != null ? team.getManager().getId().toString() : null)
                        .managerName(team.getManager() != null ? team.getManager().getFullName() : null)
                        .memberCount((int) userRepository.countByTeamId(team.getId()))
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    @Transactional
    @PostMapping("/teams")
    public ResponseEntity<ApiResponse<TeamDto>> createTeam(@RequestBody TeamCreateRequest req) {
        Team team = new Team();
        team.setName(req.getName());
        team.setDescription(req.getDescription());
        if (req.getManagerId() != null) {
            userRepository.findById(UUID.fromString(req.getManagerId()))
                    .ifPresent(team::setManager);
        }
        Team saved = teamRepository.save(team);
        return ResponseEntity.ok(ApiResponse.success(TeamDto.builder()
                .id(saved.getId().toString())
                .name(saved.getName())
                .description(saved.getDescription())
                .managerId(saved.getManager() != null ? saved.getManager().getId().toString() : null)
                .managerName(saved.getManager() != null ? saved.getManager().getFullName() : null)
                .memberCount(0)
                .build()));
    }

    @Transactional
    @PutMapping("/teams/{id}")
    public ResponseEntity<ApiResponse<TeamDto>> updateTeam(@PathVariable UUID id, @RequestBody TeamCreateRequest req) {
        return teamRepository.findById(id).map(team -> {
            team.setName(req.getName());
            team.setDescription(req.getDescription());
            if (req.getManagerId() != null) {
                userRepository.findById(UUID.fromString(req.getManagerId())).ifPresent(team::setManager);
            } else {
                team.setManager(null);
            }
            Team saved = teamRepository.save(team);
            return ResponseEntity.ok(ApiResponse.success(TeamDto.builder()
                    .id(saved.getId().toString())
                    .name(saved.getName())
                    .description(saved.getDescription())
                    .managerId(saved.getManager() != null ? saved.getManager().getId().toString() : null)
                    .managerName(saved.getManager() != null ? saved.getManager().getFullName() : null)
                    .memberCount((int) userRepository.countByTeamId(saved.getId()))
                    .build()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/teams/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable UUID id) {
        if (!teamRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.findByTeamId(id).forEach(u -> { u.setTeam(null); userRepository.save(u); });
        teamRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ---- Team membership ----

    @Transactional
    @GetMapping("/teams/{teamId}/members")
    public ResponseEntity<ApiResponse<List<TeamMemberDto>>> getTeamMembers(@PathVariable UUID teamId) {
        if (!teamRepository.existsById(teamId)) return ResponseEntity.notFound().build();
        List<TeamMemberDto> members = userRepository.findByTeamId(teamId).stream()
                .map(u -> TeamMemberDto.builder()
                        .id(u.getId().toString())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .roleName(u.getRole() != null ? u.getRole().getName() : null)
                        .avatarUrl(u.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @Transactional
    @PostMapping("/teams/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> addTeamMember(@PathVariable UUID teamId, @PathVariable UUID userId) {
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.notFound().build();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        user.setTeam(team);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Transactional
    @DeleteMapping("/teams/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(@PathVariable UUID teamId, @PathVariable UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (user.getTeam() != null && user.getTeam().getId().equals(teamId)) {
            user.setTeam(null);
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/territories")
    public ResponseEntity<ApiResponse<List<TerritoryDto>>> getTerritories() {
        List<TerritoryDto> territories = territoryRepository.findAll().stream()
                .map(territory -> TerritoryDto.builder()
                        .id(territory.getId().toString())
                        .name(territory.getName())
                        .region(territory.getRegion())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(territories));
    }

    // ---- Inner DTOs for reference data ----

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RoleDto {
        private String id;
        private String name;
        private String description;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamDto {
        private String id;
        private String name;
        private String description;
        private String managerId;
        private String managerName;
        private Integer memberCount;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamCreateRequest {
        private String name;
        private String description;
        private String managerId;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TerritoryDto {
        private String id;
        private String name;
        private String region;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamMemberDto {
        private String id;
        private String fullName;
        private String email;
        private String roleName;
        private String avatarUrl;
    }
}

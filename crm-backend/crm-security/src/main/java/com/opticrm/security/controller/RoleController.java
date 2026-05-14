package com.opticrm.security.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.dto.CreateRoleRequest;
import com.opticrm.security.dto.RoleResponse;
import com.opticrm.security.dto.UpdateRoleRequest;
import com.opticrm.security.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> list() {
        List<RoleResponse> roles = roleService.listAll();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> getById(@PathVariable UUID id) {
        RoleResponse role = roleService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> create(
            @Valid @RequestBody CreateRoleRequest request
    ) {
        RoleResponse role = roleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(role));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        RoleResponse role = roleService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        roleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> updatePermissions(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> permissions
    ) {
        RoleResponse role = roleService.updatePermissions(id, permissions);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> duplicate(
            @PathVariable UUID id,
            @RequestParam String name
    ) {
        RoleResponse role = roleService.duplicateRole(id, name);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(role));
    }
}

package com.opticrm.core.contact.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.contact.dto.*;
import com.opticrm.core.contact.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ContactListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) String assignedToId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<ContactListDto> result = contactService.list(pageRequest, search, accountId, assignedToId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ContactDto>> getById(@PathVariable UUID id) {
        ContactDto contact = contactService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(contact));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ContactDto>> create(
            @Valid @RequestBody CreateContactRequest request
    ) {
        ContactDto contact = contactService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(contact));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ContactDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateContactRequest request
    ) {
        ContactDto contact = contactService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(contact));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        contactService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/by-account/{accountId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ContactListDto>>> getByAccount(
            @PathVariable UUID accountId
    ) {
        List<ContactListDto> contacts = contactService.getByAccountId(accountId);
        return ResponseEntity.ok(ApiResponse.success(contacts));
    }

    @GetMapping("/duplicates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ContactDto>>> findDuplicates(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone
    ) {
        List<ContactDto> duplicates = contactService.findDuplicates(firstName, lastName, email, phone);
        return ResponseEntity.ok(ApiResponse.success(duplicates));
    }
}

package com.opticrm.core.contact.service;

import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.dto.*;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ContactDto getById(UUID id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        return mapToDto(contact);
    }

    @Transactional(readOnly = true)
    public Page<ContactListDto> list(PageRequest pageRequest, String search, String accountId, String assignedToId) {
        // COMMERCIAL ne voit que ses propres contacts
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                return contactRepository.findByAssignedToId(uid,
                        pageRequest.toPageable("lastName", Sort.Direction.ASC)).map(this::mapToListDto);
            }
        }

        Page<Contact> contacts;

        if (search != null && !search.isBlank()) {
            contacts = contactRepository.search(search.trim(),
                    pageRequest.toPageable("lastName", Sort.Direction.ASC));
        } else if (accountId != null) {
            contacts = contactRepository.findByAccountIdPaged(UUID.fromString(accountId),
                    pageRequest.toPageable("lastName", Sort.Direction.ASC));
        } else if (assignedToId != null) {
            contacts = contactRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("lastName", Sort.Direction.ASC));
        } else {
            contacts = contactRepository.findAll(
                    pageRequest.toPageable("lastName", Sort.Direction.ASC));
        }

        return contacts.map(this::mapToListDto);
    }

    @Transactional
    public ContactDto create(CreateContactRequest request) {
        // Check for duplicates
        if (request.getEmail() != null && contactRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEntryException("email", request.getEmail());
        }

        Contact contact = Contact.builder()
                .salutation(request.getSalutation())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneMobile(request.getPhoneMobile())
                .phoneOffice(request.getPhoneOffice())
                .jobTitle(request.getJobTitle())
                .department(request.getDepartment())
                .addressStreet(request.getAddressStreet())
                .addressCity(request.getAddressCity())
                .addressState(request.getAddressState())
                .addressPostalCode(request.getAddressPostalCode())
                .addressCountry(request.getAddressCountry())
                .linkedinUrl(request.getLinkedinUrl())
                .twitterHandle(request.getTwitterHandle())
                .dateOfBirth(request.getDateOfBirth())
                .preferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "fr")
                .doNotCall(request.getDoNotCall() != null ? request.getDoNotCall() : false)
                .doNotEmail(request.getDoNotEmail() != null ? request.getDoNotEmail() : false)
                .contactRole(request.getContactRole())
                .build();

        // Set relations
        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId()));
            contact.setAccount(account);
        }

        if (request.getReportsToId() != null) {
            Contact reportsTo = contactRepository.findById(UUID.fromString(request.getReportsToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", request.getReportsToId()));
            contact.setReportsTo(reportsTo);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            contact.setAssignedTo(assignedTo);
        } else if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    contact.setAssignedTo(currentUser);
                    log.info("Auto-assigned contact to commercial '{}'", currentUser.getEmail());
                }
            }
        }

        contact = contactRepository.save(contact);
        log.info("Created contact: {} {}", contact.getFirstName(), contact.getLastName());

        return mapToDto(contact);
    }

    @Transactional
    public ContactDto update(UUID id, UpdateContactRequest request) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));

        // Check email uniqueness
        if (request.getEmail() != null && !request.getEmail().equals(contact.getEmail())) {
            if (contactRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateEntryException("email", request.getEmail());
            }
        }

        // Optimistic locking
        if (request.getVersion() != null) {
            contact.setVersion(request.getVersion());
        }

        // Update fields if provided
        if (request.getSalutation() != null) contact.setSalutation(request.getSalutation());
        if (request.getFirstName() != null) contact.setFirstName(request.getFirstName());
        if (request.getLastName() != null) contact.setLastName(request.getLastName());
        if (request.getEmail() != null) contact.setEmail(request.getEmail());
        if (request.getPhoneMobile() != null) contact.setPhoneMobile(request.getPhoneMobile());
        if (request.getPhoneOffice() != null) contact.setPhoneOffice(request.getPhoneOffice());
        if (request.getJobTitle() != null) contact.setJobTitle(request.getJobTitle());
        if (request.getDepartment() != null) contact.setDepartment(request.getDepartment());
        if (request.getAddressStreet() != null) contact.setAddressStreet(request.getAddressStreet());
        if (request.getAddressCity() != null) contact.setAddressCity(request.getAddressCity());
        if (request.getAddressState() != null) contact.setAddressState(request.getAddressState());
        if (request.getAddressPostalCode() != null) contact.setAddressPostalCode(request.getAddressPostalCode());
        if (request.getAddressCountry() != null) contact.setAddressCountry(request.getAddressCountry());
        if (request.getLinkedinUrl() != null) contact.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getTwitterHandle() != null) contact.setTwitterHandle(request.getTwitterHandle());
        if (request.getDateOfBirth() != null) contact.setDateOfBirth(request.getDateOfBirth());
        if (request.getPreferredLanguage() != null) contact.setPreferredLanguage(request.getPreferredLanguage());
        if (request.getDoNotCall() != null) contact.setDoNotCall(request.getDoNotCall());
        if (request.getDoNotEmail() != null) contact.setDoNotEmail(request.getDoNotEmail());
        if (request.getContactRole() != null) contact.setContactRole(request.getContactRole());

        // Update relations
        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId()));
            contact.setAccount(account);
        }

        if (request.getReportsToId() != null) {
            Contact reportsTo = contactRepository.findById(UUID.fromString(request.getReportsToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", request.getReportsToId()));
            contact.setReportsTo(reportsTo);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            contact.setAssignedTo(assignedTo);
        }

        contact = contactRepository.save(contact);
        log.info("Updated contact: {}", id);

        return mapToDto(contact);
    }

    @Transactional
    public void delete(UUID id) {
        if (!contactRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contact", id);
        }
        contactRepository.deleteById(id);
        log.info("Deleted contact: {}", id);
    }

    @Transactional(readOnly = true)
    public List<ContactListDto> getByAccountId(UUID accountId) {
        return contactRepository.findByAccountId(accountId)
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContactDto> findDuplicates(String firstName, String lastName, String email, String phone) {
        return contactRepository.findPotentialDuplicates(firstName, lastName, email, phone)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Mapping methods
    private ContactDto mapToDto(Contact contact) {
        ContactDto.ContactDtoBuilder builder = ContactDto.builder()
                .id(contact.getId().toString())
                .salutation(contact.getSalutation())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .fullName(contact.getFullName())
                .email(contact.getEmail())
                .phoneMobile(contact.getPhoneMobile())
                .phoneOffice(contact.getPhoneOffice())
                .jobTitle(contact.getJobTitle())
                .department(contact.getDepartment())
                .addressStreet(contact.getAddressStreet())
                .addressCity(contact.getAddressCity())
                .addressState(contact.getAddressState())
                .addressPostalCode(contact.getAddressPostalCode())
                .addressCountry(contact.getAddressCountry())
                .fullAddress(contact.getFullAddress())
                .linkedinUrl(contact.getLinkedinUrl())
                .twitterHandle(contact.getTwitterHandle())
                .dateOfBirth(contact.getDateOfBirth())
                .preferredLanguage(contact.getPreferredLanguage())
                .doNotCall(contact.getDoNotCall())
                .doNotEmail(contact.getDoNotEmail())
                .contactRole(contact.getContactRole())
                .version(contact.getVersion())
                .createdAt(contact.getCreatedAt())
                .updatedAt(contact.getUpdatedAt());

        if (contact.getAccount() != null) {
            builder.account(ContactDto.AccountSummary.builder()
                    .id(contact.getAccount().getId().toString())
                    .name(contact.getAccount().getName())
                    .accountType(contact.getAccount().getAccountType())
                    .build());
        }

        if (contact.getReportsTo() != null) {
            builder.reportsTo(ContactDto.ContactSummary.builder()
                    .id(contact.getReportsTo().getId().toString())
                    .fullName(contact.getReportsTo().getFullName())
                    .jobTitle(contact.getReportsTo().getJobTitle())
                    .build());
        }

        if (contact.getAssignedTo() != null) {
            builder.assignedTo(ContactDto.UserSummary.builder()
                    .id(contact.getAssignedTo().getId().toString())
                    .fullName(contact.getAssignedTo().getFullName())
                    .email(contact.getAssignedTo().getEmail())
                    .build());
        }

        return builder.build();
    }

    private ContactListDto mapToListDto(Contact contact) {
        return ContactListDto.builder()
                .id(contact.getId().toString())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .fullName(contact.getDisplayName())
                .email(contact.getEmail())
                .phoneOffice(contact.getPhoneOffice())
                .phoneMobile(contact.getPhoneMobile())
                .jobTitle(contact.getJobTitle())
                .addressCity(contact.getAddressCity())
                .accountId(contact.getAccount() != null ? contact.getAccount().getId().toString() : null)
                .accountName(contact.getAccount() != null ? contact.getAccount().getName() : null)
                .assignedToName(contact.getAssignedTo() != null ? contact.getAssignedTo().getFullName() : null)
                .contactRole(contact.getContactRole())
                .build();
    }
}

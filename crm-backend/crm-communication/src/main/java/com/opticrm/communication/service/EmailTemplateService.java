package com.opticrm.communication.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.communication.dto.*;
import com.opticrm.communication.entity.EmailTemplate;
import com.opticrm.communication.repository.EmailTemplateRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<EmailTemplateListDto> findAll(String category, Boolean isActive, Pageable pageable) {
        if (category != null && !category.isBlank()) {
            return emailTemplateRepository.findByCategory(category, pageable).map(this::toListDto);
        }
        if (isActive != null) {
            return emailTemplateRepository.findByIsActive(isActive, pageable).map(this::toListDto);
        }
        return emailTemplateRepository.findAll(pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<EmailTemplateListDto> search(String search, Pageable pageable) {
        return emailTemplateRepository.search(search, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public EmailTemplateDto findById(UUID id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle d'email non trouvé"));
        return toDto(template);
    }

    public EmailTemplateDto create(CreateEmailTemplateRequest request) {
        User currentUser = securityService.getCurrentUser();

        EmailTemplate template = EmailTemplate.builder()
                .name(request.getName())
                .subject(request.getSubject())
                .bodyHtml(request.getBodyHtml())
                .bodyText(request.getBodyText())
                .category(request.getCategory())
                .availableVariables(request.getAvailableVariables())
                .createdBy(currentUser)
                .build();

        template = emailTemplateRepository.save(template);
        return toDto(template);
    }

    public EmailTemplateDto update(UUID id, UpdateEmailTemplateRequest request) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle d'email non trouvé"));

        if (request.getName() != null) {
            template.setName(request.getName());
        }
        if (request.getSubject() != null) {
            template.setSubject(request.getSubject());
        }
        if (request.getBodyHtml() != null) {
            template.setBodyHtml(request.getBodyHtml());
        }
        if (request.getBodyText() != null) {
            template.setBodyText(request.getBodyText());
        }
        if (request.getCategory() != null) {
            template.setCategory(request.getCategory());
        }
        if (request.getAvailableVariables() != null) {
            template.setAvailableVariables(request.getAvailableVariables());
        }

        template = emailTemplateRepository.save(template);
        return toDto(template);
    }

    public void delete(UUID id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle d'email non trouvé"));
        emailTemplateRepository.delete(template);
    }

    public EmailTemplateDto toggleActive(UUID id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle d'email non trouvé"));

        template.setIsActive(!template.getIsActive());
        template = emailTemplateRepository.save(template);
        return toDto(template);
    }

    private EmailTemplateDto toDto(EmailTemplate template) {
        return EmailTemplateDto.builder()
                .id(template.getId())
                .name(template.getName())
                .subject(template.getSubject())
                .bodyHtml(template.getBodyHtml())
                .bodyText(template.getBodyText())
                .category(template.getCategory())
                .availableVariables(template.getAvailableVariables())
                .usageCount(template.getUsageCount())
                .openRate(template.getOpenRate())
                .clickRate(template.getClickRate())
                .isActive(template.getIsActive())
                .createdBy(template.getCreatedBy() != null ? EmailTemplateDto.UserSummaryDto.builder()
                        .id(template.getCreatedBy().getId())
                        .fullName(template.getCreatedBy().getFullName())
                        .build() : null)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private EmailTemplateListDto toListDto(EmailTemplate template) {
        return EmailTemplateListDto.builder()
                .id(template.getId())
                .name(template.getName())
                .subject(template.getSubject())
                .category(template.getCategory())
                .isActive(template.getIsActive())
                .usageCount(template.getUsageCount())
                .openRate(template.getOpenRate())
                .clickRate(template.getClickRate())
                .build();
    }
}

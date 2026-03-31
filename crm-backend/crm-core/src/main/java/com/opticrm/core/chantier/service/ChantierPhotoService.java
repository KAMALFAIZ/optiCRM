package com.opticrm.core.chantier.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.chantier.dto.ChantierPhotoDto;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.entity.ChantierPhoto;
import com.opticrm.core.chantier.repository.ChantierPhotoRepository;
import com.opticrm.core.chantier.repository.ChantierRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.FileStorageService;
import com.opticrm.security.config.ContextUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChantierPhotoService {

    private final ChantierPhotoRepository photoRepository;
    private final ChantierRepository chantierRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public ChantierPhotoDto upload(UUID chantierId, MultipartFile file) throws IOException {
        Chantier chantier = chantierRepository.findById(chantierId)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", chantierId));

        String url = fileStorageService.storeChantierPhoto(file);
        String filename = url.substring(url.lastIndexOf('/') + 1);

        User uploadedBy = ContextUtils.getCurrentUserId()
                .flatMap(userRepository::findById)
                .orElse(null);

        ChantierPhoto photo = ChantierPhoto.builder()
                .chantier(chantier)
                .filename(filename)
                .originalName(file.getOriginalFilename())
                .url(url)
                .uploadedBy(uploadedBy)
                .build();

        photo = photoRepository.save(photo);
        log.info("Photo ajoutée au chantier {} : {}", chantierId, filename);
        return mapToDto(photo);
    }

    @Transactional(readOnly = true)
    public List<ChantierPhotoDto> findByChantier(UUID chantierId) {
        return photoRepository.findByChantierIdOrderByCreatedAtDesc(chantierId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID chantierId, UUID photoId) throws IOException {
        ChantierPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", photoId));

        if (!photo.getChantier().getId().equals(chantierId)) {
            throw new ResourceNotFoundException("Photo", photoId);
        }

        // Delete file from disk
        fileStorageService.deleteChantierPhoto(photo.getFilename());

        photoRepository.deleteById(photoId);
        log.info("Photo supprimée du chantier {} : {}", chantierId, photo.getFilename());
    }

    private ChantierPhotoDto mapToDto(ChantierPhoto p) {
        return ChantierPhotoDto.builder()
                .id(p.getId().toString())
                .url(p.getUrl())
                .originalName(p.getOriginalName())
                .uploadedBy(p.getUploadedBy() != null ? p.getUploadedBy().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}

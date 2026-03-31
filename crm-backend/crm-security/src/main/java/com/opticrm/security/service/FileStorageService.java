package com.opticrm.security.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> ALLOWED_RECEIPT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf");
    private static final long MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final long MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir:./uploads/avatars}")
    private String uploadDir;

    @Value("${app.upload.receipt-dir:./uploads/receipts}")
    private String receiptDir;

    @Value("${app.upload.account-photo-dir:./uploads/account-photos}")
    private String accountPhotoDir;

    @Value("${app.upload.product-image-dir:./uploads/product-images}")
    private String productImageDir;

    @Value("${app.upload.datasheet-dir:./uploads/datasheets}")
    private String datasheetDir;

    @Value("${app.upload.chantier-photo-dir:./uploads/chantier-photos}")
    private String chantierPhotoDir;

    /**
     * Store a receipt file (image or PDF) for expense reports.
     */
    public String storeReceipt(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }
        if (file.getSize() > MAX_RECEIPT_SIZE) {
            throw new IllegalArgumentException("Le fichier dépasse 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_RECEIPT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP, PDF");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        Path dirPath = Paths.get(receiptDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Receipt stored: {}", filePath);
        return "/uploads/receipts/" + filename;
    }

    /**
     * Store a photo for an account gallery (logo or galerie).
     * Max 5 MB, images only (JPEG, PNG, GIF, WebP).
     */
    public String storeAccountPhoto(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }
        if (file.getSize() > MAX_RECEIPT_SIZE) { // 5 MB
            throw new IllegalArgumentException("Le fichier dépasse 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        Path dirPath = Paths.get(accountPhotoDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Account photo stored: {}", filePath);
        return "/uploads/account-photos/" + filename;
    }

    public String storeProductImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Le fichier est vide");
        if (file.getSize() > MAX_RECEIPT_SIZE) throw new IllegalArgumentException("Le fichier dépasse 5 MB");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            throw new IllegalArgumentException("Type non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP");

        String originalFilename = file.getOriginalFilename();
        String ext = "png";
        if (originalFilename != null && originalFilename.contains("."))
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();

        Path dirPath = Paths.get(productImageDir);
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Product image stored: {}", filePath);
        return "/uploads/product-images/" + filename;
    }

    private static final Set<String> ALLOWED_DATASHEET_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png", "gif", "webp");

    public String storeProductDatasheet(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Le fichier est vide");
        if (file.getSize() > 10 * 1024 * 1024) throw new IllegalArgumentException("Le fichier dépasse 10 MB");
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String ext = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf('.') + 1) : "";
        boolean validByType = contentType != null && ALLOWED_RECEIPT_TYPES.contains(contentType);
        boolean validByExt = ALLOWED_DATASHEET_EXTENSIONS.contains(ext);
        if (!validByType && !validByExt)
            throw new IllegalArgumentException("Type non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP, PDF");

        if (ext.isEmpty()) ext = "pdf";

        Path dirPath = Paths.get(datasheetDir);
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Datasheet stored: {}", filePath);
        return "/uploads/datasheets/" + filename;
    }

    public String storeChantierPhoto(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Le fichier est vide");
        if (file.getSize() > MAX_RECEIPT_SIZE) throw new IllegalArgumentException("Le fichier dépasse 5 MB");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            throw new IllegalArgumentException("Type non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP");

        String originalFilename = file.getOriginalFilename();
        String ext = "jpg";
        if (originalFilename != null && originalFilename.contains("."))
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();

        Path dirPath = Paths.get(chantierPhotoDir);
        if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        log.info("Chantier photo stored: {}", filePath);
        return "/uploads/chantier-photos/" + filename;
    }

    public void deleteChantierPhoto(String filename) throws IOException {
        Path filePath = Paths.get(chantierPhotoDir).resolve(filename);
        Files.deleteIfExists(filePath);
        log.info("Chantier photo deleted: {}", filePath);
    }

    public String storeAvatar(UUID userId, MultipartFile file) throws IOException {
        // Validate
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("Le fichier dépasse 2 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP");
        }

        // Extract extension
        String originalFilename = file.getOriginalFilename();
        String ext = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        // Create directory if needed
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        // Store with userId as name
        String filename = userId.toString() + "." + ext;
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Avatar stored for user {}: {}", userId, filePath);
        return "/uploads/avatars/" + filename;
    }
}

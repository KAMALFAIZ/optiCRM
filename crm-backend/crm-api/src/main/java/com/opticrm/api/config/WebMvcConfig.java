package com.opticrm.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

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

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + uploadPath.toString() + "/");

        Path receiptPath = Paths.get(receiptDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/receipts/**")
                .addResourceLocations("file:" + receiptPath.toString() + "/");

        Path accountPhotoPath = Paths.get(accountPhotoDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/account-photos/**")
                .addResourceLocations("file:" + accountPhotoPath.toString() + "/");

        Path productImagePath = Paths.get(productImageDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/product-images/**")
                .addResourceLocations("file:" + productImagePath.toString() + "/");

        Path datasheetPath = Paths.get(datasheetDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/datasheets/**")
                .addResourceLocations("file:" + datasheetPath.toString() + "/");

        Path chantierPhotoPath = Paths.get(chantierPhotoDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/chantier-photos/**")
                .addResourceLocations("file:" + chantierPhotoPath.toString() + "/");
    }
}

package com.opticrm.stock.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.security.service.FileStorageService;
import com.opticrm.stock.dto.*;
import com.opticrm.stock.service.ProductService;
import com.opticrm.stock.service.StockLevelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final StockLevelService stockLevelService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ProductListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isStockable,
            @RequestParam(required = false) Boolean isSellable
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<ProductListDto> result = productService.list(pageRequest, search, categoryId, isActive, isStockable, isSellable);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<ProductDto>> getById(@PathVariable UUID id) {
        ProductDto product = productService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> create(
            @Valid @RequestBody CreateProductRequest request
    ) {
        ProductDto product = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        ProductDto product = productService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> uploadImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws java.io.IOException {
        String url = fileStorageService.storeProductImage(file);
        ProductDto product = productService.updateImageUrl(id, url);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping(value = "/{id}/datasheet", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> uploadDatasheet(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws java.io.IOException {
        String originalFilename = file.getOriginalFilename();
        String displayName = (originalFilename != null && !originalFilename.isBlank())
                ? originalFilename : "fiche-technique";
        String url = fileStorageService.storeProductDatasheet(file);
        ProductDto product = productService.updateDatasheet(id, url, displayName);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @DeleteMapping("/{id}/datasheet")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> deleteDatasheet(@PathVariable UUID id) {
        ProductDto product = productService.deleteDatasheet(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<StockLevelDto>>> getStock(@PathVariable UUID id) {
        List<StockLevelDto> stockLevels = stockLevelService.getByProduct(id);
        return ResponseEntity.ok(ApiResponse.success(stockLevels));
    }

    // ---- Prix par catégorie tarifaire ----

    @GetMapping("/{id}/prices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ProductPriceDto>>> getPrices(@PathVariable UUID id) {
        List<ProductPriceDto> prices = productService.getPrices(id);
        return ResponseEntity.ok(ApiResponse.success(prices));
    }

    @PutMapping("/{id}/prices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductPriceDto>> setPrice(
            @PathVariable UUID id,
            @Valid @RequestBody SetProductPriceRequest request) {
        ProductPriceDto price = productService.setPrice(id, request);
        return ResponseEntity.ok(ApiResponse.success(price));
    }

    @DeleteMapping("/{id}/prices/{categoryId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deletePrice(
            @PathVariable UUID id,
            @PathVariable UUID categoryId) {
        productService.deletePrice(id, categoryId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/stats/by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatsByCategory() {
        Map<String, Long> stats = productService.getCategoryStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/stats/counts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCounts() {
        Map<String, Long> counts = Map.of(
                "active", productService.countActive(),
                "stockable", productService.countStockable()
        );
        return ResponseEntity.ok(ApiResponse.success(counts));
    }
}

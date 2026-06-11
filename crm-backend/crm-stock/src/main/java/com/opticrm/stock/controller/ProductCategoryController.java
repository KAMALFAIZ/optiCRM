package com.opticrm.stock.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.stock.dto.CreateProductCategoryRequest;
import com.opticrm.stock.dto.ProductCategoryDto;
import com.opticrm.stock.dto.ProductCategoryListDto;
import com.opticrm.stock.service.ProductCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/product-categories")
@RequiredArgsConstructor
public class ProductCategoryController {

    private final ProductCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ProductCategoryListDto>>> list() {
        List<ProductCategoryListDto> categories = categoryService.list();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/tree")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ProductCategoryDto>>> getTree() {
        List<ProductCategoryDto> tree = categoryService.getTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ProductCategoryListDto>>> search(
            @RequestParam String q
    ) {
        List<ProductCategoryListDto> categories = categoryService.search(q);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ProductCategoryDto>> getById(@PathVariable UUID id) {
        ProductCategoryDto category = categoryService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ProductCategoryDto>> create(
            @Valid @RequestBody CreateProductCategoryRequest request
    ) {
        ProductCategoryDto category = categoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ProductCategoryDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProductCategoryRequest request
    ) {
        ProductCategoryDto category = categoryService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

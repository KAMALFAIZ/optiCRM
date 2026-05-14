package com.opticrm.stock.service;

import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.stock.dto.CreateProductCategoryRequest;
import com.opticrm.stock.dto.ProductCategoryDto;
import com.opticrm.stock.dto.ProductCategoryListDto;
import com.opticrm.stock.entity.ProductCategory;
import com.opticrm.stock.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductCategoryService {

    private final ProductCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public ProductCategoryDto getById(UUID id) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", id));
        return mapToDto(category);
    }

    @Transactional(readOnly = true)
    public List<ProductCategoryListDto> list() {
        return categoryRepository.findAllOrdered()
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductCategoryDto> getTree() {
        // Get root categories and build tree
        List<ProductCategory> roots = categoryRepository.findRootCategories();
        return roots.stream()
                .map(this::mapToDtoWithChildren)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductCategoryListDto> search(String searchTerm) {
        return categoryRepository.search(searchTerm)
                .stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductCategoryDto create(CreateProductCategoryRequest request) {
        // Check for duplicate code
        if (categoryRepository.existsByCode(request.getCode())) {
            throw new DuplicateEntryException("code", request.getCode());
        }

        ProductCategory category = ProductCategory.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        // Set parent category if provided
        if (request.getParentCategoryId() != null) {
            ProductCategory parent = categoryRepository.findById(UUID.fromString(request.getParentCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", request.getParentCategoryId()));
            category.setParentCategory(parent);
        }

        category = categoryRepository.save(category);
        log.info("Created product category: {} ({})", category.getName(), category.getCode());

        return mapToDto(category);
    }

    @Transactional
    public ProductCategoryDto update(UUID id, CreateProductCategoryRequest request) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", id));

        // Check for duplicate code (excluding current)
        if (request.getCode() != null && !request.getCode().equals(category.getCode())) {
            if (categoryRepository.existsByCode(request.getCode())) {
                throw new DuplicateEntryException("code", request.getCode());
            }
            category.setCode(request.getCode());
        }

        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());

        // Update parent category
        if (request.getParentCategoryId() != null) {
            // Prevent setting itself as parent
            if (request.getParentCategoryId().equals(id.toString())) {
                throw new IllegalArgumentException("Une catégorie ne peut pas être sa propre parente");
            }
            ProductCategory parent = categoryRepository.findById(UUID.fromString(request.getParentCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", request.getParentCategoryId()));
            category.setParentCategory(parent);
        }

        category = categoryRepository.save(category);
        log.info("Updated product category: {}", id);

        return mapToDto(category);
    }

    @Transactional
    public void delete(UUID id) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", id));

        // Check if category has products
        long productCount = categoryRepository.countProductsByCategoryId(id);
        if (productCount > 0) {
            throw new IllegalStateException("Impossible de supprimer la catégorie car elle contient " + productCount + " produit(s)");
        }

        // Check if category has children
        List<ProductCategory> children = categoryRepository.findByParentCategoryId(id);
        if (!children.isEmpty()) {
            throw new IllegalStateException("Impossible de supprimer la catégorie car elle contient des sous-catégories");
        }

        categoryRepository.delete(category);
        log.info("Deleted product category: {}", id);
    }

    // Mapping methods
    private ProductCategoryDto mapToDto(ProductCategory category) {
        long productCount = categoryRepository.countProductsByCategoryId(category.getId());

        ProductCategoryDto.ProductCategoryDtoBuilder builder = ProductCategoryDto.builder()
                .id(category.getId().toString())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .sortOrder(category.getSortOrder())
                .fullPath(category.getFullPath())
                .productCount(productCount)
                .createdAt(category.getCreatedAt());

        if (category.getParentCategory() != null) {
            builder.parentCategory(ProductCategoryDto.CategorySummary.builder()
                    .id(category.getParentCategory().getId().toString())
                    .code(category.getParentCategory().getCode())
                    .name(category.getParentCategory().getName())
                    .build());
        }

        return builder.build();
    }

    private ProductCategoryDto mapToDtoWithChildren(ProductCategory category) {
        ProductCategoryDto dto = mapToDto(category);

        // Load children
        List<ProductCategory> children = categoryRepository.findByParentCategoryId(category.getId());
        if (!children.isEmpty()) {
            dto.setSubCategories(children.stream()
                    .map(c -> ProductCategoryDto.CategorySummary.builder()
                            .id(c.getId().toString())
                            .code(c.getCode())
                            .name(c.getName())
                            .build())
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private ProductCategoryListDto mapToListDto(ProductCategory category) {
        long productCount = categoryRepository.countProductsByCategoryId(category.getId());

        return ProductCategoryListDto.builder()
                .id(category.getId().toString())
                .code(category.getCode())
                .name(category.getName())
                .parentCategoryName(category.getParentCategory() != null ? category.getParentCategory().getName() : null)
                .sortOrder(category.getSortOrder())
                .productCount(productCount)
                .build();
    }
}

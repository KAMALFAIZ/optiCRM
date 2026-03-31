package com.opticrm.common.exception;

import lombok.Getter;

import java.util.UUID;

@Getter
public class ResourceNotFoundException extends BusinessException {

    private final String resourceType;
    private final Object resourceId;

    public ResourceNotFoundException(String resourceType, Object resourceId) {
        super("RESOURCE_NOT_FOUND",
                String.format("%s with id '%s' not found", resourceType, resourceId));
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    public ResourceNotFoundException(String resourceType, UUID id) {
        this(resourceType, (Object) id);
    }

    public ResourceNotFoundException(String resourceType, String identifier) {
        this(resourceType, (Object) identifier);
    }

    /**
     * Constructor with just a message
     */
    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", message);
        this.resourceType = "Resource";
        this.resourceId = null;
    }
}

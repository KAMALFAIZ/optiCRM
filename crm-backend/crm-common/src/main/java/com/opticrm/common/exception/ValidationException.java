package com.opticrm.common.exception;

import com.opticrm.common.dto.ApiError;
import lombok.Getter;

import java.util.List;

@Getter
public class ValidationException extends BusinessException {

    private final List<ApiError.FieldError> fieldErrors;

    public ValidationException(String message) {
        super("VALIDATION_ERROR", message);
        this.fieldErrors = null;
    }

    public ValidationException(List<ApiError.FieldError> fieldErrors) {
        super("VALIDATION_ERROR", "Validation failed");
        this.fieldErrors = fieldErrors;
    }

    public ValidationException(String field, String message) {
        super("VALIDATION_ERROR", message);
        this.fieldErrors = List.of(ApiError.FieldError.builder()
                .field(field)
                .message(message)
                .build());
    }
}

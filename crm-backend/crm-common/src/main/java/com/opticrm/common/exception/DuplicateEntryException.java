package com.opticrm.common.exception;

import lombok.Getter;

@Getter
public class DuplicateEntryException extends BusinessException {

    private final String field;
    private final Object value;

    public DuplicateEntryException(String field, Object value) {
        super("DUPLICATE_ENTRY",
                String.format("A record with %s '%s' already exists", field, value));
        this.field = field;
        this.value = value;
    }
}

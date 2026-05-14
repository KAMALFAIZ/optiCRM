package com.opticrm.common.exception;

public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super("AUTH_FORBIDDEN", message);
    }

    public ForbiddenException() {
        super("AUTH_FORBIDDEN", "Access denied");
    }
}

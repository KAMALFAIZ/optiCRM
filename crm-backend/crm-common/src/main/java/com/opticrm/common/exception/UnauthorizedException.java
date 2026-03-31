package com.opticrm.common.exception;

public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super("AUTH_UNAUTHORIZED", message);
    }

    public UnauthorizedException() {
        super("AUTH_UNAUTHORIZED", "Authentication required");
    }
}

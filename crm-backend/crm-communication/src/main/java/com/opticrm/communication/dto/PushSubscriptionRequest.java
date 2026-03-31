package com.opticrm.communication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PushSubscriptionRequest {
    @NotBlank
    private String endpoint;

    @NotBlank
    private String p256dhKey;

    @NotBlank
    private String authKey;
}

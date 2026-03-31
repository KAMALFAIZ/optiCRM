package com.opticrm.communication.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationDto {
    private String id;
    private String type;
    private String title;
    private String message;
    private String link;
    private Boolean isRead;
    private Instant createdAt;
}

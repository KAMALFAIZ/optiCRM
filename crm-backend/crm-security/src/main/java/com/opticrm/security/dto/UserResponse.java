package com.opticrm.security.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    @JsonProperty("isActive")
    private boolean isActive;
    private Instant lastLoginAt;
    private String preferredLanguage;
    private String timezone;
    private Instant createdAt;

    // Role info
    private RoleInfo role;

    // Team info
    private TeamInfo team;

    // Territory info
    private TerritoryInfo territory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleInfo {
        private String id;
        private String name;
        private String description;
        private Map<String, Object> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamInfo {
        private String id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TerritoryInfo {
        private String id;
        private String name;
        private String region;
    }
}

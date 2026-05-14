package com.opticrm.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SageAutoSyncConfigDto {

    private boolean enabled;
    /** HOURLY | DAILY | WEEKLY */
    private String interval;
    private boolean syncAccounts;
    private boolean syncContacts;
    private String lastRunAt;
    private String lastRunStatus;
}

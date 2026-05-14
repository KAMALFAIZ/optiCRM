package com.opticrm.core.lead.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConvertLeadResponse {
    private String accountId;
    private String contactId;
    private String opportunityId;
}

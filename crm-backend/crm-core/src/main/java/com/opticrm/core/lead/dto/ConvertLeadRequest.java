package com.opticrm.core.lead.dto;

import lombok.Data;

@Data
public class ConvertLeadRequest {
    private Boolean createAccount = true;
    private Boolean createContact = true;
    private Boolean createOpportunity = false;

    // Account fields (if createAccount is true)
    private String accountName;
    private String accountType;
    private String industryId;

    // Opportunity fields (if createOpportunity is true)
    private String opportunityName;
    private Double opportunityAmount;
    private String opportunityStageId;
    private String closeDate;

    // Use existing account instead of creating
    private String existingAccountId;
}

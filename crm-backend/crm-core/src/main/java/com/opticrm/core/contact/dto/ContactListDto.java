package com.opticrm.core.contact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactListDto {

    private String id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneOffice;
    private String phoneMobile;
    private String jobTitle;
    private String addressCity;
    private String accountId;
    private String accountName;
    private String assignedToName;
    private String contactRole;
}

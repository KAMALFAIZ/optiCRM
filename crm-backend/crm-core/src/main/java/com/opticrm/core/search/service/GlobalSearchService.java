package com.opticrm.core.search.service;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.search.dto.GlobalSearchResult;
import com.opticrm.core.search.dto.GlobalSearchResult.SearchItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResult search(String query, int limit) {
        if (query == null || query.trim().length() < 2) {
            return GlobalSearchResult.builder()
                    .query(query)
                    .totalResults(0)
                    .items(List.of())
                    .build();
        }

        String trimmed = query.trim();
        int perType = Math.max(3, limit / 4);
        PageRequest pageRequest = PageRequest.of(0, perType, Sort.by("name").ascending());

        List<SearchItem> items = new ArrayList<>();

        // Search Accounts
        try {
            accountRepository.search(trimmed, pageRequest)
                    .forEach(account -> items.add(mapAccount(account)));
        } catch (Exception e) {
            log.warn("Error searching accounts: {}", e.getMessage());
        }

        // Search Contacts
        try {
            PageRequest contactPage = PageRequest.of(0, perType, Sort.by("lastName").ascending());
            contactRepository.search(trimmed, contactPage)
                    .forEach(contact -> items.add(mapContact(contact)));
        } catch (Exception e) {
            log.warn("Error searching contacts: {}", e.getMessage());
        }

        // Search Leads
        try {
            PageRequest leadPage = PageRequest.of(0, perType, Sort.by("lastName").ascending());
            leadRepository.findAllWithFilters(trimmed, null, null, null, leadPage)
                    .forEach(lead -> items.add(mapLead(lead)));
        } catch (Exception e) {
            log.warn("Error searching leads: {}", e.getMessage());
        }

        // Search Opportunities
        try {
            opportunityRepository.findAllWithFilters(trimmed, null, null, null, null, pageRequest)
                    .forEach(opp -> items.add(mapOpportunity(opp)));
        } catch (Exception e) {
            log.warn("Error searching opportunities: {}", e.getMessage());
        }

        // Limit total results
        List<SearchItem> limited = items.size() > limit ? items.subList(0, limit) : items;

        return GlobalSearchResult.builder()
                .query(trimmed)
                .totalResults(limited.size())
                .items(limited)
                .build();
    }

    private SearchItem mapAccount(Account account) {
        String subtitle = account.getAccountType() != null ? account.getAccountType() : "";
        if (account.getBillingCity() != null) {
            subtitle += (subtitle.isEmpty() ? "" : " - ") + account.getBillingCity();
        }
        return SearchItem.builder()
                .id(account.getId().toString())
                .type("ACCOUNT")
                .title(account.getName())
                .subtitle(subtitle)
                .icon("bank")
                .build();
    }

    private SearchItem mapContact(Contact contact) {
        String subtitle = "";
        if (contact.getJobTitle() != null) {
            subtitle = contact.getJobTitle();
        }
        if (contact.getAccount() != null) {
            subtitle += (subtitle.isEmpty() ? "" : " - ") + contact.getAccount().getName();
        }
        return SearchItem.builder()
                .id(contact.getId().toString())
                .type("CONTACT")
                .title(contact.getFirstName() + " " + contact.getLastName())
                .subtitle(subtitle)
                .icon("user")
                .build();
    }

    private SearchItem mapLead(Lead lead) {
        String subtitle = "";
        if (lead.getCompanyName() != null) {
            subtitle = lead.getCompanyName();
        }
        if (lead.getStatus() != null) {
            subtitle += (subtitle.isEmpty() ? "" : " - ") + lead.getStatus();
        }
        return SearchItem.builder()
                .id(lead.getId().toString())
                .type("LEAD")
                .title(lead.getFirstName() + " " + lead.getLastName())
                .subtitle(subtitle)
                .icon("funnel-plot")
                .build();
    }

    private SearchItem mapOpportunity(Opportunity opportunity) {
        String subtitle = "";
        if (opportunity.getAccount() != null) {
            subtitle = opportunity.getAccount().getName();
        }
        if (opportunity.getStage() != null) {
            subtitle += (subtitle.isEmpty() ? "" : " - ") + opportunity.getStage().getName();
        }
        return SearchItem.builder()
                .id(opportunity.getId().toString())
                .type("OPPORTUNITY")
                .title(opportunity.getName())
                .subtitle(subtitle)
                .icon("trophy")
                .build();
    }
}

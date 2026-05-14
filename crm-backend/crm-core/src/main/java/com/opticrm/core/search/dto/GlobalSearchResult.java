package com.opticrm.core.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResult {

    private String query;
    private int totalResults;
    private List<SearchItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchItem {
        private String id;
        private String type;       // ACCOUNT, CONTACT, LEAD, OPPORTUNITY, PRODUCT
        private String title;
        private String subtitle;
        private String icon;       // bank, user, funnel-plot, trophy, shopping
    }
}

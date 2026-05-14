package com.opticrm.api.sage;

import com.opticrm.api.sage.dto.CreateSyncRequestRequest;
import com.opticrm.api.sage.dto.SageSyncRequestDto;
import com.opticrm.common.exception.BusinessException;
import com.opticrm.security.dto.SageAutoSyncConfigDto;
import com.opticrm.security.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SageAutoSyncService {

    private final SettingService settingService;
    private final SageQueryService sageQueryService;
    private final SageIntegrationService sageIntegrationService;

    public SageAutoSyncConfigDto getConfig() {
        return settingService.getSageAutoSyncConfig();
    }

    public SageAutoSyncConfigDto saveConfig(SageAutoSyncConfigDto dto) {
        settingService.saveSageAutoSyncConfig(dto);
        return settingService.getSageAutoSyncConfig();
    }

    /** Triggers sync for all enabled entities. Returns a human-readable status summary. */
    public String triggerAll() {
        SageAutoSyncConfigDto config = settingService.getSageAutoSyncConfig();
        List<String> results = new ArrayList<>();
        String errorStatus = null;

        try {
            if (config.isSyncAccounts()) {
                SageSyncRequestDto req = triggerEntity("ACCOUNTS");
                results.add("Comptes: " + req.getSuccessItems() + " OK");
            }
            if (config.isSyncContacts()) {
                SageSyncRequestDto req = triggerEntity("CONTACTS");
                results.add("Contacts: " + req.getSuccessItems() + " OK");
            }
            if (results.isEmpty()) {
                return "Aucune entité activée";
            }
            String summary = String.join(", ", results);
            settingService.updateAutoSyncRunResult(summary);
            return summary;
        } catch (Exception e) {
            errorStatus = "ERREUR: " + e.getMessage();
            settingService.updateAutoSyncRunResult(errorStatus);
            throw e;
        }
    }

    /** Triggers sync for a single entity type. Returns the created SageSyncRequestDto. */
    public SageSyncRequestDto triggerOne(String entityType) {
        SageSyncRequestDto result = triggerEntity(entityType.toUpperCase());
        settingService.updateAutoSyncRunResult(
                entityType.toUpperCase() + ": " + result.getSuccessItems() + " OK");
        return result;
    }

    private SageSyncRequestDto triggerEntity(String entityType) {
        List<Map<String, Object>> rows = fetchRows(entityType);
        if (rows.isEmpty()) {
            throw new BusinessException("SAGE_NO_DATA",
                    "Aucune donnée récupérée depuis Sage pour l'entité " + entityType);
        }

        String label = entityType + " — auto-sync "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        CreateSyncRequestRequest req = new CreateSyncRequestRequest();
        req.setEntityType(entityType);
        req.setLabel(label);
        req.setSourceFormat("SAGE_SQL");
        req.setRows(rows);

        SageSyncRequestDto created = sageIntegrationService.createRequest(req);
        return sageIntegrationService.applyRequest(created.getId());
    }

    private List<Map<String, Object>> fetchRows(String entityType) {
        return switch (entityType) {
            case "ACCOUNTS" -> sageQueryService.fetchAccounts();
            case "CONTACTS" -> remapContacts(sageQueryService.fetchContacts());
            default -> throw new BusinessException("UNSUPPORTED_ENTITY",
                    "Entité non supportée pour l'auto-sync : " + entityType);
        };
    }

    /** Remaps Sage contact column names (co_nom, co_prenom…) to the keys applyContact expects. */
    private List<Map<String, Object>> remapContacts(List<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>(row);
            remap(mapped, "co_nom",      "last_name");
            remap(mapped, "co_prenom",   "first_name");
            remap(mapped, "co_email",    "email");
            remap(mapped, "co_tel",      "phone");
            remap(mapped, "co_portable", "mobile");
            remap(mapped, "co_fonction", "job_title");
            result.add(mapped);
        }
        return result;
    }

    private void remap(Map<String, Object> row, String from, String to) {
        Object val = row.remove(from);
        if (val != null) row.put(to, val);
    }
}

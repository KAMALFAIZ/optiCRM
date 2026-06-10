package com.opticrm.agent.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Charge / persiste agent-config.yml dans le répertoire courant.
 */
@Slf4j
@Component
public class ConfigPersister {

    private static final Path CONFIG_FILE = Path.of("agent-config.yml");

    @SuppressWarnings("unchecked")
    public Map<String, Object> load() {
        if (!Files.exists(CONFIG_FILE)) return new LinkedHashMap<>();
        try (var in = Files.newInputStream(CONFIG_FILE)) {
            Yaml yaml = new Yaml();
            Object loaded = yaml.load(in);
            return loaded instanceof Map<?, ?> m ? (Map<String, Object>) m : new LinkedHashMap<>();
        } catch (IOException e) {
            log.error("Lecture agent-config.yml impossible : {}", e.getMessage());
            return new LinkedHashMap<>();
        }
    }

    public void save(AgentProperties props) {
        Map<String, Object> root = new LinkedHashMap<>();
        Map<String, Object> agent = new LinkedHashMap<>();
        root.put("agent", agent);

        Map<String, Object> opticrm = new LinkedHashMap<>();
        opticrm.put("server-url", nonNull(props.getOpticrm().getServerUrl()));
        opticrm.put("tenant-id",  nonNull(props.getOpticrm().getTenantId()));
        opticrm.put("agent-key",  nonNull(props.getOpticrm().getAgentKey()));
        agent.put("opticrm", opticrm);

        Map<String, Object> sage = new LinkedHashMap<>();
        sage.put("host",     nonNull(props.getSage().getHost()));
        sage.put("port",     props.getSage().getPort());
        sage.put("database", nonNull(props.getSage().getDatabase()));
        sage.put("username", nonNull(props.getSage().getUsername()));
        sage.put("password", nonNull(props.getSage().getPassword()));
        sage.put("dossier",  nonNull(props.getSage().getDossier()));
        agent.put("sage", sage);

        Map<String, Object> sync = new LinkedHashMap<>();
        Map<String, Object> pull = new LinkedHashMap<>();
        pull.put("enabled",  props.getSync().getPull().isEnabled());
        pull.put("cron",     props.getSync().getPull().getCron());
        pull.put("entities", props.getSync().getPull().getEntities());
        sync.put("pull", pull);
        Map<String, Object> push = new LinkedHashMap<>();
        push.put("enabled",          props.getSync().getPush().isEnabled());
        push.put("poll-interval-ms", props.getSync().getPush().getPollIntervalMs());
        push.put("auto-apply",       props.getSync().getPush().isAutoApply());
        sync.put("push", push);
        agent.put("sync", sync);

        DumperOptions opts = new DumperOptions();
        opts.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        opts.setPrettyFlow(true);
        opts.setIndent(2);
        Yaml yaml = new Yaml(opts);

        try (FileWriter fw = new FileWriter(CONFIG_FILE.toFile())) {
            yaml.dump(root, fw);
            log.info("Configuration sauvegardée dans {}", CONFIG_FILE.toAbsolutePath());
        } catch (IOException e) {
            log.error("Sauvegarde config impossible : {}", e.getMessage());
        }
    }

    private static String nonNull(String s) { return s == null ? "" : s; }
}

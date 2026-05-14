package com.opticrm.core.sav.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "sav")
public class SavProperties {

    private String kamalWhatsapp = "+212600000000";
    private int otpExpirationMinutes = 10;
    private int sessionExpirationHours = 8;
    private int rapportQuotidienHeure = 19;
    private int rapportQuotidienMinute = 0;

    private Embedding embedding = new Embedding();
    private Openai openai = new Openai();
    private Claude claude = new Claude();

    @Data
    public static class Embedding {
        private String model = "text-embedding-3-small";
        private int dimension = 1536;
        private double seuilP1 = 0.80;
        private double seuilP2 = 0.75;
        private double seuilP3 = 0.70;
    }

    @Data
    public static class Openai {
        private String apiKey = "";
    }

    @Data
    public static class Claude {
        private String model = "claude-sonnet-4-6";
    }
}

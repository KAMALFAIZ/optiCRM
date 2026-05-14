package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stock_replenishment")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReplenishment extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private SourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "motive", nullable = false)
    private Motive motive;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReplenishmentStatus status = ReplenishmentStatus.DRAFT;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @OneToMany(mappedBy = "replenishment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockReplenishmentItem> items;

    public enum SourceType {
        WAREHOUSE, DELIVERY, CUSTOMER
    }

    public enum TargetType {
        WAREHOUSE, DELIVERY
    }

    public enum ReplenishmentStatus {
        DRAFT, PENDING, APPROVED, APPLIED, TRANSFERRED
    }

    public enum Motive {
        URGENCE_STOCK_EPUISE("Urgence stock épuisé en tournée"),
        OPPORTUNITE_VENTE("Opportunité vente additionnelle"),
        COMMANDE_URGENTE_CLIENT("Commande urgente client régulier"),
        MARCHANDISE_ENDOMMAGEE("Marchandise endommagée en tournée"),
        RETOUR_CLIENT_DEFECTUEUX("Retour client - Produit défectueux"),
        ECHANGE_CLIENT("Échange produit - Client non satisfait"),
        NOUVEAU_CLIENT("Nouveau client identifié en tournée"),
        RETOUR_NON_VENDU("Retour marchandise non vendue"),
        TRANSFERT_REEQUILIBRAGE("Transfert dépôt - Rééquilibrage stock"),
        RECTIFICATION_INVENTAIRE("Rectification inventaire - Écart détecté"),
        ECHANTILLONS_CADEAUX("Échantillons/Cadeaux commerciaux");

        private final String label;

        Motive(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}

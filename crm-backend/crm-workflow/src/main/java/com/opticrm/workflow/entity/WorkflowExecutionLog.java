package com.opticrm.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_execution_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class WorkflowExecutionLog {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    private WorkflowExecution execution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    private WorkflowStep step;

    /** STARTED, COMPLETED, FAILED, SKIPPED */
    @Column(name = "status", nullable = false, length = 30)
    private String status;

    /** JSON input data for the step */
    @Column(name = "input_data", columnDefinition = "NVARCHAR(MAX)")
    private String inputData;

    /** JSON output/result from the step */
    @Column(name = "output_data", columnDefinition = "NVARCHAR(MAX)")
    private String outputData;

    @Column(name = "error_message", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    /** Duration of step execution in milliseconds */
    @Column(name = "duration_ms")
    private Long durationMs;

    @CreatedDate
    @Column(name = "executed_at", nullable = false, updatable = false)
    private Instant executedAt;
}

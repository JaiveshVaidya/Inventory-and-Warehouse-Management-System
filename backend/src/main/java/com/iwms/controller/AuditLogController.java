package com.iwms.controller;

import com.iwms.entity.AuditLog;
import com.iwms.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs() {
        List<AuditLog> logs = auditLogService.getAllLogs();
        
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("Log ID,Timestamp,Username,Action,Details\n");
        
        for (AuditLog log : logs) {
            csvBuilder.append(log.getId()).append(",")
                    .append(log.getTimestamp()).append(",")
                    .append(escapeCsvField(log.getUsername())).append(",")
                    .append(escapeCsvField(log.getAction())).append(",")
                    .append(escapeCsvField(log.getDetails())).append("\n");
        }
        
        byte[] csvBytes = csvBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit_ledger.csv")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    private String escapeCsvField(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}

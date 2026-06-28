package com.iwms.controller;

import com.iwms.dto.StockTransferRequest;
import com.iwms.entity.StockTransfer;
import com.iwms.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @GetMapping
    public ResponseEntity<List<StockTransfer>> getAllTransfers() {
        return ResponseEntity.ok(transferService.getAllTransfers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<StockTransfer> requestTransfer(@Valid @RequestBody StockTransferRequest request) {
        StockTransfer transfer = transferService.requestTransfer(request);
        return ResponseEntity.ok(transfer);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<StockTransfer> approveTransfer(@PathVariable Long id) {
        StockTransfer completed = transferService.approveTransfer(id);
        return ResponseEntity.ok(completed);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<StockTransfer> cancelTransfer(@PathVariable Long id) {
        StockTransfer cancelled = transferService.cancelTransfer(id);
        return ResponseEntity.ok(cancelled);
    }
}

package com.iwms.service;

import com.iwms.dto.InventoryAdjustmentRequest;
import com.iwms.dto.StockTransferRequest;
import com.iwms.entity.*;
import com.iwms.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransferService {

    private final StockTransferRepository stockTransferRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;

    public TransferService(StockTransferRepository stockTransferRepository, WarehouseRepository warehouseRepository,
                           ProductRepository productRepository, InventoryRepository inventoryRepository,
                           InventoryService inventoryService, AuditLogService auditLogService) {
        this.stockTransferRepository = stockTransferRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public StockTransfer requestTransfer(StockTransferRequest request) {
        Warehouse source = warehouseRepository.findById(request.getSourceWarehouseId())
                .orElseThrow(() -> new RuntimeException("Source warehouse not found"));

        Warehouse target = warehouseRepository.findById(request.getTargetWarehouseId())
                .orElseThrow(() -> new RuntimeException("Target warehouse not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Validate that source has enough quantity in stock currently
        Inventory sourceInv = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), source.getId())
                .orElseThrow(() -> new RuntimeException("No inventory of product: " + product.getName() + " exists in source warehouse: " + source.getName()));

        if (sourceInv.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock in source warehouse. Available: " + sourceInv.getQuantity() + ", Requesting: " + request.getQuantity());
        }

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        StockTransfer transfer = StockTransfer.builder()
                .sourceWarehouse(source)
                .targetWarehouse(target)
                .product(product)
                .quantity(request.getQuantity())
                .status(StockTransferStatus.REQUESTED)
                .requestDate(LocalDateTime.now())
                .requestedBy(user)
                .build();

        StockTransfer saved = stockTransferRepository.save(transfer);
        auditLogService.log("TRANSFER_REQUEST", String.format("Requested stock transfer ID %d: %d units of %s from %s to %s",
                saved.getId(), saved.getQuantity(), product.getName(), source.getName(), target.getName()));

        return saved;
    }

    @Transactional
    public StockTransfer approveTransfer(Long transferId) {
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Stock transfer request not found"));

        if (transfer.getStatus() != StockTransferStatus.REQUESTED) {
            throw new RuntimeException("Can only approve requested transfers. Current status: " + transfer.getStatus());
        }

        // Deduct from source warehouse
        InventoryAdjustmentRequest deductReq = new InventoryAdjustmentRequest();
        deductReq.setProductId(transfer.getProduct().getId());
        deductReq.setWarehouseId(transfer.getSourceWarehouse().getId());
        deductReq.setQuantity(transfer.getQuantity());
        deductReq.setType("SUBTRACT");
        inventoryService.adjustInventory(deductReq);

        // Add to target warehouse
        InventoryAdjustmentRequest addReq = new InventoryAdjustmentRequest();
        addReq.setProductId(transfer.getProduct().getId());
        addReq.setWarehouseId(transfer.getTargetWarehouse().getId());
        addReq.setQuantity(transfer.getQuantity());
        addReq.setType("ADD");
        inventoryService.adjustInventory(addReq);

        transfer.setStatus(StockTransferStatus.COMPLETED);
        transfer.setCompletionDate(LocalDateTime.now());
        StockTransfer completed = stockTransferRepository.save(transfer);

        auditLogService.log("TRANSFER_COMPLETED", "Stock transfer ID " + transferId + " processed and completed successfully.");
        return completed;
    }

    @Transactional
    public StockTransfer cancelTransfer(Long transferId) {
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Stock transfer request not found"));

        if (transfer.getStatus() != StockTransferStatus.REQUESTED) {
            throw new RuntimeException("Can only cancel pending requested transfers.");
        }

        transfer.setStatus(StockTransferStatus.CANCELLED);
        StockTransfer cancelled = stockTransferRepository.save(transfer);

        auditLogService.log("TRANSFER_CANCEL", "Cancelled stock transfer ID: " + transferId);
        return cancelled;
    }

    public List<StockTransfer> getAllTransfers() {
        return stockTransferRepository.findAll();
    }
}

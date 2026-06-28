package com.iwms.controller;

import com.iwms.dto.InventoryAdjustmentRequest;
import com.iwms.entity.Inventory;
import com.iwms.entity.Product;
import com.iwms.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<Inventory>> getInventory(@RequestParam(required = false) Long warehouseId) {
        if (warehouseId != null) {
            return ResponseEntity.ok(inventoryService.getInventoryByWarehouse(warehouseId));
        }
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @PutMapping("/adjust")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<Inventory> adjustInventory(@Valid @RequestBody InventoryAdjustmentRequest request) {
        Inventory adjusted = inventoryService.adjustInventory(request);
        return ResponseEntity.ok(adjusted);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<List<Inventory>> getLowStockItems() {
        return ResponseEntity.ok(inventoryService.getLowStockItems());
    }

    // Product catalog operations
    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = inventoryService.createProduct(product);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(inventoryService.getAllProducts());
    }

    @GetMapping("/products/barcode/{barcode}")
    public ResponseEntity<Product> getProductByBarcode(@PathVariable String barcode) {
        Product product = inventoryService.getProductByBarcode(barcode);
        return ResponseEntity.ok(product);
    }
}

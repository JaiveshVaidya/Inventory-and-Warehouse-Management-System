package com.iwms.service;

import com.iwms.config.RabbitMQConfig;
import com.iwms.dto.InventoryAdjustmentRequest;
import com.iwms.entity.Inventory;
import com.iwms.entity.Product;
import com.iwms.entity.Warehouse;
import com.iwms.repository.InventoryRepository;
import com.iwms.repository.ProductRepository;
import com.iwms.repository.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {
    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final RabbitTemplate rabbitTemplate;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository,
                            WarehouseRepository warehouseRepository, RabbitTemplate rabbitTemplate,
                            AuditLogService auditLogService, NotificationService notificationService) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public List<Inventory> getInventoryByWarehouse(Long warehouseId) {
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    @Transactional
    public Inventory adjustInventory(InventoryAdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        Optional<Inventory> optInv = inventoryRepository.findByProductIdAndWarehouseId(
                request.getProductId(), request.getWarehouseId());

        Inventory inventory;
        int oldQuantity = 0;
        if (optInv.isPresent()) {
            inventory = optInv.get();
            oldQuantity = inventory.getQuantity();
            if ("SET".equalsIgnoreCase(request.getType())) {
                inventory.setQuantity(request.getQuantity());
            } else if ("ADD".equalsIgnoreCase(request.getType())) {
                inventory.setQuantity(inventory.getQuantity() + request.getQuantity());
            } else if ("SUBTRACT".equalsIgnoreCase(request.getType())) {
                inventory.setQuantity(inventory.getQuantity() - request.getQuantity());
            }
        } else {
            int initialQty = 0;
            if ("SET".equalsIgnoreCase(request.getType()) || "ADD".equalsIgnoreCase(request.getType())) {
                initialQty = request.getQuantity();
            } else if ("SUBTRACT".equalsIgnoreCase(request.getType())) {
                initialQty = -request.getQuantity();
            }
            inventory = Inventory.builder()
                    .product(product)
                    .warehouse(warehouse)
                    .quantity(initialQty)
                    .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 10)
                    .build();
        }

        if (request.getReorderLevel() != null) {
            inventory.setReorderLevel(request.getReorderLevel());
        }

        // Validate stock level is not negative
        if (inventory.getQuantity() < 0) {
            throw new RuntimeException("Stock level cannot be negative. Current stock: " + oldQuantity);
        }

        Inventory savedInventory = inventoryRepository.save(inventory);

        String logMsg = String.format("Adjusted product %s in warehouse %s. Type: %s, Qty Delta: %d, New Qty: %d",
                product.getName(), warehouse.getName(), request.getType(), request.getQuantity(), savedInventory.getQuantity());
        auditLogService.log("INVENTORY_ADJUST", logMsg);

        // Check for low stock alert
        checkLowStockAndNotify(savedInventory);

        return savedInventory;
    }

    private void checkLowStockAndNotify(Inventory inventory) {
        if (inventory.getQuantity() <= inventory.getReorderLevel()) {
            String warningMessage = String.format("ALERT: Low stock for SKU %s (%s) at Warehouse %s. Current stock: %d (Reorder level: %d)",
                    inventory.getProduct().getSku(), inventory.getProduct().getName(),
                    inventory.getWarehouse().getName(), inventory.getQuantity(), inventory.getReorderLevel());
            
            logger.warn(warningMessage);
            
            // Real-time broadcast
            try {
                notificationService.broadcast("LOW_STOCK", warningMessage);
            } catch (Exception e) {
                logger.warn("SSE broadcast failed: {}", e.getMessage());
            }

            try {
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, warningMessage);
                logger.info("Sent low-stock AMQP warning message to RabbitMQ.");
            } catch (Exception e) {
                logger.warn("Could not dispatch low-stock notification over AMQP (RabbitMQ offline): {}", e.getMessage());
            }
        }
    }

    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    // Product Catalog CRUD
    @Transactional
    public Product createProduct(Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Product SKU already exists");
        }
        Product savedProduct = productRepository.save(product);
        auditLogService.log("PRODUCT_CREATE", "Created product: " + savedProduct.getName() + " with SKU: " + savedProduct.getSku());
        return savedProduct;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("Product with scanned barcode not found: " + barcode));
    }
}

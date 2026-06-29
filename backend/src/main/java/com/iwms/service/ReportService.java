package com.iwms.service;

import com.iwms.entity.Inventory;
import com.iwms.entity.SalesOrder;
import com.iwms.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuditLogRepository auditLogRepository;

    public ReportService(ProductRepository productRepository, InventoryRepository inventoryRepository,
                         PurchaseOrderRepository purchaseOrderRepository, SalesOrderRepository salesOrderRepository,
                         WarehouseRepository warehouseRepository, AuditLogRepository auditLogRepository) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.warehouseRepository = warehouseRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalProducts", productRepository.count());
        stats.put("totalWarehouses", warehouseRepository.count());
        stats.put("totalPurchaseOrders", purchaseOrderRepository.count());
        stats.put("totalSalesOrders", salesOrderRepository.count());

        // Calculate total inventory items
        List<Inventory> allInventory = inventoryRepository.findAll();
        long totalStockCount = allInventory.stream()
                .mapToLong(Inventory::getQuantity)
                .sum();
        stats.put("totalStockQuantity", totalStockCount);

        // Low stock item count
        long lowStockCount = inventoryRepository.findLowStockItems().size();
        stats.put("lowStockCount", lowStockCount);

        // Total sales revenue
        List<SalesOrder> salesOrders = salesOrderRepository.findAll();
        BigDecimal totalRevenue = salesOrders.stream()
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalRevenue", totalRevenue);

        // Group stock value per category
        Map<String, BigDecimal> categoryValueMap = new HashMap<>();
        // Group stock quantity per warehouse
        Map<String, Long> warehouseStockMap = new HashMap<>();

        for (Inventory inv : allInventory) {
            String category = inv.getProduct().getCategory();
            BigDecimal unitPrice = inv.getProduct().getPrice();
            BigDecimal totalValue = unitPrice.multiply(BigDecimal.valueOf(inv.getQuantity()));

            categoryValueMap.put(category, categoryValueMap.getOrDefault(category, BigDecimal.ZERO).add(totalValue));

            String warehouseName = inv.getWarehouse().getName();
            warehouseStockMap.put(warehouseName, warehouseStockMap.getOrDefault(warehouseName, 0L) + inv.getQuantity());
        }

        stats.put("categoryStockValue", categoryValueMap);
        stats.put("warehouseStockDistribution", warehouseStockMap);

        // Recent audit activities (limit to 10 logs)
        stats.put("recentActivities", auditLogRepository.findAllByOrderByTimestampDesc().stream().limit(10).toList());

        return stats;
    }
}

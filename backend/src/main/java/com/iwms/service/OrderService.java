package com.iwms.service;

import com.iwms.dto.InventoryAdjustmentRequest;
import com.iwms.dto.OrderItemRequest;
import com.iwms.dto.PurchaseOrderRequest;
import com.iwms.dto.SalesOrderRequest;
import com.iwms.entity.*;
import com.iwms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;

    public OrderService(PurchaseOrderRepository purchaseOrderRepository, SalesOrderRepository salesOrderRepository,
                        ProductRepository productRepository, WarehouseRepository warehouseRepository,
                        SupplierRepository supplierRepository, InventoryRepository inventoryRepository,
                        InventoryService inventoryService, AuditLogService auditLogService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
        this.auditLogService = auditLogService;
    }

    // PURCHASE ORDERS
    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .warehouse(warehouse)
                .status(PurchaseOrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .orderDate(LocalDateTime.now())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            BigDecimal itemPrice = itemReq.getPrice() != null ? itemReq.getPrice() : product.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(itemTotal);

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .price(itemPrice)
                    .build();

            items.add(item);
        }

        po.setTotalAmount(total);
        po.setItems(items);

        PurchaseOrder savedPo = purchaseOrderRepository.save(po);
        auditLogService.log("PO_CREATE", "Created Purchase Order ID: " + savedPo.getId() + " for supplier: " + supplier.getName());
        return savedPo;
    }

    @Transactional
    public PurchaseOrder updatePurchaseOrderStatus(Long poId, PurchaseOrderStatus status) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED || po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot change status of a completed/cancelled order");
        }

        // If transition to RECEIVED, inject items into warehouse inventory
        if (status == PurchaseOrderStatus.RECEIVED) {
            for (PurchaseOrderItem item : po.getItems()) {
                InventoryAdjustmentRequest adj = new InventoryAdjustmentRequest();
                adj.setProductId(item.getProduct().getId());
                adj.setWarehouseId(po.getWarehouse().getId());
                adj.setQuantity(item.getQuantity());
                adj.setType("ADD");
                inventoryService.adjustInventory(adj);
            }
            auditLogService.log("PO_FULFILL", "Stock received for Purchase Order ID: " + poId);
        }

        po.setStatus(status);
        PurchaseOrder updatedPo = purchaseOrderRepository.save(po);
        auditLogService.log("PO_STATUS", "Updated Purchase Order ID " + poId + " status to: " + status);
        return updatedPo;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    // SALES ORDERS
    @Transactional
    public SalesOrder createSalesOrder(SalesOrderRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        SalesOrder so = SalesOrder.builder()
                .customerName(request.getCustomerName())
                .warehouse(warehouse)
                .status(SalesOrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .orderDate(LocalDateTime.now())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<SalesOrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            BigDecimal itemPrice = itemReq.getPrice() != null ? itemReq.getPrice() : product.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(itemTotal);

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrder(so)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .price(itemPrice)
                    .build();

            items.add(item);
        }

        so.setTotalAmount(total);
        so.setItems(items);

        SalesOrder savedSo = salesOrderRepository.save(so);
        auditLogService.log("SO_CREATE", "Created Sales Order ID: " + savedSo.getId() + " for customer: " + request.getCustomerName());
        return savedSo;
    }

    @Transactional
    public SalesOrder updateSalesOrderStatus(Long soId, SalesOrderStatus status) {
        SalesOrder so = salesOrderRepository.findById(soId)
                .orElseThrow(() -> new RuntimeException("Sales Order not found"));

        if (so.getStatus() == SalesOrderStatus.DELIVERED || so.getStatus() == SalesOrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot change status of a completed/cancelled order");
        }

        // If status changes to DISPATCHED, subtract items from warehouse inventory
        if (status == SalesOrderStatus.DISPATCHED) {
            // First check if all items are in stock
            for (SalesOrderItem item : so.getItems()) {
                Inventory inv = inventoryRepository.findByProductIdAndWarehouseId(
                        item.getProduct().getId(), so.getWarehouse().getId())
                        .orElseThrow(() -> new RuntimeException("No inventory found for Product: " + item.getProduct().getName() + " in Warehouse: " + so.getWarehouse().getName()));
                
                if (inv.getQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for Product: " + item.getProduct().getName() + ". Available: " + inv.getQuantity() + ", Ordered: " + item.getQuantity());
                }
            }

            // Perform subtraction
            for (SalesOrderItem item : so.getItems()) {
                InventoryAdjustmentRequest adj = new InventoryAdjustmentRequest();
                adj.setProductId(item.getProduct().getId());
                adj.setWarehouseId(so.getWarehouse().getId());
                adj.setQuantity(item.getQuantity());
                adj.setType("SUBTRACT");
                inventoryService.adjustInventory(adj);
            }
            auditLogService.log("SO_DISPATCH", "Stock dispatched for Sales Order ID: " + soId);
        }

        so.setStatus(status);
        SalesOrder updatedSo = salesOrderRepository.save(so);
        auditLogService.log("SO_STATUS", "Updated Sales Order ID " + soId + " status to: " + status);
        return updatedSo;
    }

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAll();
    }
}

package com.iwms.controller;

import com.iwms.dto.PurchaseOrderRequest;
import com.iwms.dto.SalesOrderRequest;
import com.iwms.entity.PurchaseOrder;
import com.iwms.entity.PurchaseOrderStatus;
import com.iwms.entity.SalesOrder;
import com.iwms.entity.SalesOrderStatus;
import com.iwms.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Purchase Orders
    @GetMapping("/purchase")
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders() {
        return ResponseEntity.ok(orderService.getAllPurchaseOrders());
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrder po = orderService.createPurchaseOrder(request);
        return ResponseEntity.ok(po);
    }

    @PutMapping("/purchase/{id}/status")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<PurchaseOrder> updatePurchaseOrderStatus(
            @PathVariable Long id,
            @RequestParam PurchaseOrderStatus status) {
        PurchaseOrder updated = orderService.updatePurchaseOrderStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // Sales Orders
    @GetMapping("/sales")
    public ResponseEntity<List<SalesOrder>> getAllSalesOrders() {
        return ResponseEntity.ok(orderService.getAllSalesOrders());
    }

    @PostMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_TEAM')")
    public ResponseEntity<SalesOrder> createSalesOrder(@Valid @RequestBody SalesOrderRequest request) {
        SalesOrder so = orderService.createSalesOrder(request);
        return ResponseEntity.ok(so);
    }

    @PutMapping("/sales/{id}/status")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SalesOrder> updateSalesOrderStatus(
            @PathVariable Long id,
            @RequestParam SalesOrderStatus status) {
        SalesOrder updated = orderService.updateSalesOrderStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}

package com.iwms.service;

import com.iwms.entity.Warehouse;
import com.iwms.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final AuditLogService auditLogService;

    public WarehouseService(WarehouseRepository warehouseRepository, AuditLogService auditLogService) {
        this.warehouseRepository = warehouseRepository;
        this.auditLogService = auditLogService;
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }

    @Transactional
    public Warehouse createWarehouse(Warehouse warehouse) {
        Warehouse saved = warehouseRepository.save(warehouse);
        auditLogService.log("WAREHOUSE_CREATE", "Created warehouse: " + saved.getName() + " in " + saved.getLocation());
        return saved;
    }
}

package com.iwms.service;

import com.iwms.entity.Supplier;
import com.iwms.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditLogService auditLogService;

    public SupplierService(SupplierRepository supplierRepository, AuditLogService auditLogService) {
        this.supplierRepository = supplierRepository;
        this.auditLogService = auditLogService;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        Supplier saved = supplierRepository.save(supplier);
        auditLogService.log("SUPPLIER_CREATE", "Created supplier: " + saved.getName());
        return saved;
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplierDetails) {
        Supplier supplier = getSupplierById(id);
        supplier.setName(supplierDetails.getName());
        supplier.setContactPerson(supplierDetails.getContactPerson());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setPhone(supplierDetails.getPhone());
        supplier.setAddress(supplierDetails.getAddress());
        Supplier updated = supplierRepository.save(supplier);
        auditLogService.log("SUPPLIER_UPDATE", "Updated supplier details for ID: " + id);
        return updated;
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier s = getSupplierById(id);
        supplierRepository.delete(s);
        auditLogService.log("SUPPLIER_DELETE", "Deleted supplier: " + s.getName() + " (ID: " + id + ")");
    }
}

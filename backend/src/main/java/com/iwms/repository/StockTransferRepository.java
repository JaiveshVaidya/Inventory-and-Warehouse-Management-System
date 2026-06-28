package com.iwms.repository;

import com.iwms.entity.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findBySourceWarehouseIdOrTargetWarehouseId(Long sourceWarehouseId, Long targetWarehouseId);
}

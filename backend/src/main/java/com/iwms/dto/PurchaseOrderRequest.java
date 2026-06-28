package com.iwms.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class PurchaseOrderRequest {
    @NotNull
    private Long supplierId;

    @NotNull
    private Long warehouseId;

    @NotEmpty
    private List<OrderItemRequest> items;
}

package com.iwms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class SalesOrderRequest {
    @NotBlank
    private String customerName;

    @NotNull
    private Long warehouseId; // Dispatching warehouse

    @NotEmpty
    private List<OrderItemRequest> items;
}

package com.iwms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InventoryAdjustmentRequest {
    @NotNull
    private Long productId;

    @NotNull
    private Long warehouseId;

    @NotNull
    private Integer quantity; // Quantity to set or adjust by

    @NotBlank
    private String type; // "SET", "ADD", "SUBTRACT"

    private Integer reorderLevel; // Optional new reorder level to set
}

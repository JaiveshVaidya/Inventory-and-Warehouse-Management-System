package com.iwms.config;

import com.iwms.entity.*;
import com.iwms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, WarehouseRepository warehouseRepository,
                          ProductRepository productRepository, SupplierRepository supplierRepository,
                          InventoryRepository inventoryRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Warehouses
        if (warehouseRepository.count() == 0) {
            Warehouse central = Warehouse.builder().name("Central Hub").location("New York, USA").capacity(10000).build();
            Warehouse west = Warehouse.builder().name("West Coast Annex").location("Los Angeles, USA").capacity(5000).build();
            Warehouse europe = Warehouse.builder().name("Euro Distribution").location("Rotterdam, Netherlands").capacity(8000).build();
            warehouseRepository.saveAll(List.of(central, west, europe));
        }

        // Fetch central warehouse for referencing
        Warehouse centralHub = warehouseRepository.findAll().stream()
                .filter(w -> "Central Hub".equals(w.getName()))
                .findFirst()
                .orElse(null);

        // 2. Seed Users
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@iwms.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();

            User manager = User.builder()
                    .username("manager")
                    .email("manager@iwms.com")
                    .password(passwordEncoder.encode("manager123"))
                    .role(Role.WAREHOUSE_MANAGER)
                    .warehouse(centralHub)
                    .build();

            User staff = User.builder()
                    .username("staff")
                    .email("staff@iwms.com")
                    .password(passwordEncoder.encode("staff123"))
                    .role(Role.WAREHOUSE_STAFF)
                    .warehouse(centralHub)
                    .build();

            User sales = User.builder()
                    .username("sales")
                    .email("sales@iwms.com")
                    .password(passwordEncoder.encode("sales123"))
                    .role(Role.SALES_TEAM)
                    .build();

            userRepository.saveAll(List.of(admin, manager, staff, sales));
        }

        // 3. Seed Products
        if (productRepository.count() == 0) {
            Product iphone = Product.builder()
                    .name("Apple iPhone 15 Pro")
                    .sku("IPH15PRO")
                    .description("128GB, Natural Titanium")
                    .price(new BigDecimal("999.99"))
                    .category("Electronics")
                    .barcode("123456789012")
                    .build();

            Product galaxy = Product.builder()
                    .name("Samsung Galaxy S24 Ultra")
                    .sku("SAMS24ULTRA")
                    .description("256GB, Titanium Black")
                    .price(new BigDecimal("1199.99"))
                    .category("Electronics")
                    .barcode("234567890123")
                    .build();

            Product headphones = Product.builder()
                    .name("Sony WH-1000XM5")
                    .sku("SONYXM5")
                    .description("Wireless Noise Cancelling Headphones")
                    .price(new BigDecimal("349.99"))
                    .category("Accessories")
                    .barcode("345678901234")
                    .build();

            Product mouse = Product.builder()
                    .name("Logitech MX Master 3S")
                    .sku("LOGMX3S")
                    .description("Wireless Ergonomic Performance Mouse")
                    .price(new BigDecimal("99.99"))
                    .category("Accessories")
                    .barcode("456789012345")
                    .build();

            productRepository.saveAll(List.of(iphone, galaxy, headphones, mouse));
        }

        // 4. Seed Suppliers
        if (supplierRepository.count() == 0) {
            Supplier techDist = Supplier.builder()
                    .name("Global Tech Distributors")
                    .contactPerson("Alice Johnson")
                    .email("sales@globaltech.com")
                    .phone("+1-555-0199")
                    .address("100 Innovation Way, San Jose, CA")
                    .build();

            Supplier logisticElite = Supplier.builder()
                    .name("Elite Logistics Partners")
                    .contactPerson("Bob Smith")
                    .email("partner@elitelogistics.com")
                    .phone("+1-555-0144")
                    .address("450 Freight Blvd, Chicago, IL")
                    .build();

            supplierRepository.saveAll(List.of(techDist, logisticElite));
        }

        // 5. Seed Inventory Levels
        if (inventoryRepository.count() == 0 && centralHub != null) {
            List<Product> products = productRepository.findAll();
            for (Product p : products) {
                // Central Hub stock
                Inventory centralStock = Inventory.builder()
                        .product(p)
                        .warehouse(centralHub)
                        .quantity(150)
                        .reorderLevel(20)
                        .build();
                inventoryRepository.save(centralStock);
            }
        }
    }
}

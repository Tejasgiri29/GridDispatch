package com.portfolio.griddispatch.application.service;

import com.portfolio.griddispatch.domain.model.InventoryItem;
import com.portfolio.griddispatch.domain.model.InventoryReservation;
import com.portfolio.griddispatch.domain.repository.InventoryItemRepository;
import com.portfolio.griddispatch.domain.repository.InventoryReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private InventoryReservationRepository reservationRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private InventoryItem inventoryItem;

    @BeforeEach
    void setUp() {
        inventoryItem = InventoryItem.builder()
            .id("inv-01")
            .tenantId("tenant-logistics-us")
            .warehouseId("wh-01")
            .productId("prod-01")
            .availableQuantity(10)
            .reservedQuantity(0)
            .version(1)
            .build();
    }

    @Test
    @DisplayName("Should successfully reserve stock when sufficient quantity is available")
    void testSuccessfulReservation() {
        when(inventoryItemRepository.findWithLockByWarehouseIdAndProductIdAndTenantId("wh-01", "prod-01", "tenant-logistics-us"))
            .thenReturn(Optional.of(inventoryItem));
        when(reservationRepository.save(any(InventoryReservation.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        InventoryReservation res = inventoryService.reserveStock(
            "tenant-logistics-us", "ord-01", "wh-01", "prod-01", 4, 15
        );

        assertNotNull(res);
        assertEquals(6, inventoryItem.getAvailableQuantity());
        assertEquals(4, inventoryItem.getReservedQuantity());
        assertEquals("RESERVED", res.getStatus());
        verify(inventoryItemRepository).save(inventoryItem);
    }

    @Test
    @DisplayName("Should throw IllegalStateException and prevent overselling when requested > available")
    void testOversellPrevention() {
        when(inventoryItemRepository.findWithLockByWarehouseIdAndProductIdAndTenantId("wh-01", "prod-01", "tenant-logistics-us"))
            .thenReturn(Optional.of(inventoryItem));

        assertThrows(
            IllegalStateException.class,
            () -> inventoryService.reserveStock("tenant-logistics-us", "ord-02", "wh-01", "prod-01", 15, 15)
        );

        assertEquals(10, inventoryItem.getAvailableQuantity(), "Available quantity must remain untouched");
        assertEquals(0, inventoryItem.getReservedQuantity(), "Reserved quantity must remain untouched");
        verify(reservationRepository, never()).save(any());
    }
}

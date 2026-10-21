package com.portfolio.griddispatch.domain.valueobject;

public enum OrderStatus {
    CREATED,
    INVENTORY_RESERVED,
    ASSET_SEARCHING,
    ASSET_ASSIGNED,
    PICKUP_EN_ROUTE,
    PICKED_UP,
    IN_TRANSIT,
    DELAYED,
    ARRIVED,
    DELIVERED,
    FAILED,
    CANCELLED
}

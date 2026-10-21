package com.portfolio.griddispatch.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String TOPIC_ORDER_CREATED = "griddispatch.order-created";
    public static final String TOPIC_INVENTORY_RESERVED = "griddispatch.inventory-reserved";
    public static final String TOPIC_TELEMETRY_INGESTED = "griddispatch.asset-telemetry-ingested";
    public static final String TOPIC_ASSET_ASSIGNED = "griddispatch.asset-assigned";
    public static final String TOPIC_ANOMALY_DETECTED = "griddispatch.anomaly-detected";
    public static final String TOPIC_INCIDENT_CREATED = "griddispatch.incident-created";
    public static final String TOPIC_ORDER_DELIVERED = "griddispatch.order-delivered";
    public static final String TOPIC_EMISSION_CALCULATED = "griddispatch.emission-calculated";
    public static final String TOPIC_DLQ = "griddispatch.dlq";

    @Bean
    public NewTopic telemetryIngestedTopic() {
        return TopicBuilder.name(TOPIC_TELEMETRY_INGESTED).partitions(6).replicas(1).build();
    }

    @Bean
    public NewTopic orderCreatedTopic() {
        return TopicBuilder.name(TOPIC_ORDER_CREATED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic dlqTopic() {
        return TopicBuilder.name(TOPIC_DLQ).partitions(1).replicas(1).build();
    }
}

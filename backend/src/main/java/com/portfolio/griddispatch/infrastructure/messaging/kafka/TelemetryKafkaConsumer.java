package com.portfolio.griddispatch.infrastructure.messaging.kafka;

import com.portfolio.griddispatch.config.KafkaConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TelemetryKafkaConsumer {

    @KafkaListener(topics = KafkaConfig.TOPIC_TELEMETRY_INGESTED, groupId = "griddispatch-telemetry-consumer")
    public void onTelemetryIngested(
        @Payload String payload,
        @Header(KafkaHeaders.RECEIVED_KEY) String key,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.debug("[Kafka Ingest Consumer] Asset Key: {}, Partition: {}, Offset: {}, Payload: {}",
            key, partition, offset, payload);
    }
}

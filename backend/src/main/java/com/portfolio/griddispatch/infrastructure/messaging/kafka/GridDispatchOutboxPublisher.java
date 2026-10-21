package com.portfolio.griddispatch.infrastructure.messaging.kafka;

import com.portfolio.griddispatch.domain.model.OutboxEvent;
import com.portfolio.griddispatch.domain.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class GridDispatchOutboxPublisher {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc("PENDING", PageRequest.of(0, 50));
        if (pendingEvents.isEmpty()) return;

        for (OutboxEvent event : pendingEvents) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getEventKey(), event.getPayload()).whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Published outbox event {} to topic {}", event.getId(), event.getTopic());
                    } else {
                        log.error("Failed to publish outbox event {}: {}", event.getId(), ex.getMessage());
                    }
                });
                event.setStatus("PUBLISHED");
                event.setPublishedAt(Instant.now());
                outboxRepository.save(event);
            } catch (Exception ex) {
                log.error("Error dispatching outbox event {}: {}", event.getId(), ex.getMessage());
                event.setStatus("FAILED");
                outboxRepository.save(event);
            }
        }
    }
}

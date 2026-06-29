package com.iwms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter addEmitter() {
        // Set timeout to 30 minutes
        SseEmitter emitter = new SseEmitter(1800000L);
        emitters.add(emitter);

        emitter.onCompletion(() -> {
            logger.info("SSE connection completed. Removing emitter.");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            logger.info("SSE connection timed out. Removing emitter.");
            emitters.remove(emitter);
        });

        emitter.onError((e) -> {
            logger.info("SSE connection encountered error. Removing emitter.");
            emitters.remove(emitter);
        });

        // Send initial connection message
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to real-time notification stream."));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(String eventName, String data) {
        logger.info("Broadcasting notification event: {} with data: {}", eventName, data);
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            logger.info("Cleaned up {} dead SSE emitters.", deadEmitters.size());
        }
    }
}

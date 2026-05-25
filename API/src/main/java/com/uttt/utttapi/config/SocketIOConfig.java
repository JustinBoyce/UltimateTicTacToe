package com.uttt.utttapi.config;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class SocketIOConfig {

    @Value("${socket-server.host}")
    private String host;

    @Value("${socket-server.port}")
    private Integer port;

    @Value("${socket-server.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin(resolveOrigin(allowedOrigins));
        return new SocketIOServer(config);
    }

    /**
     * netty-socketio accepts a single {@link com.corundumstudio.socketio.Configuration#setOrigin(String)}.
     * Comma-separated lists are common for local dev; those are mapped to "*" with a warning.
     */
    private String resolveOrigin(String value) {
        if (value == null || value.isBlank()) {
            return "*";
        }
        String trimmed = value.trim();
        if (trimmed.contains(",")) {
            log.warn(
                    "socket-server.allowed-origins contains multiple values; using wildcard '*' for Socket.IO origin check. Prefer a single origin or set '*' explicitly.");
            return "*";
        }
        return trimmed;
    }

}

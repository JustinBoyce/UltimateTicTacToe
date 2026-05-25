package com.uttt.utttapi.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
public abstract class PostgresIntegrationTestBase {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = createPostgres();

    @SuppressWarnings("resource") // Container is closed by Testcontainers, suppressing resource leak warning
    private static PostgreSQLContainer<?> createPostgres() {
        return new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("uttt")
                .withUsername("uttt")
                .withPassword("uttt");
    }

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}

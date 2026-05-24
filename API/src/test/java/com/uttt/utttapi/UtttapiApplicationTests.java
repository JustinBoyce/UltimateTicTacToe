package com.uttt.utttapi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.context.SpringBootTest;

import com.uttt.utttapi.support.PostgresIntegrationTestBase;

@SpringBootTest
@EnabledIf("com.uttt.utttapi.support.DockerTestSupport#enabled")
class UtttapiApplicationTests extends PostgresIntegrationTestBase {

	@Test
	void contextLoads() {
	}
}

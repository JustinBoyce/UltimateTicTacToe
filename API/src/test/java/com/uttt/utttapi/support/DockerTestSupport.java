package com.uttt.utttapi.support;

public final class DockerTestSupport {

    private DockerTestSupport() {
    }

    public static boolean enabled() {
        return "true".equalsIgnoreCase(System.getenv("RUN_DOCKER_TESTS"));
    }
}
